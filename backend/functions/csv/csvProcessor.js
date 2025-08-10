/**
 * @fileoverview CSV processor for batch Instagram oEmbed fetching
 * @author Backend Team
 */

const { extractInstagramOembed } = require('../../utils/instagram/instagramOembed');
const AdaptiveRateLimiter = require('../../utils/rateLimit/rateLimiter');
const csvImportTable = require('../../database/tables/csvImportTable');
const { v4: uuidv4 } = require('uuid');

/**
 * @typedef {Object} ProcessorOptions
 * @property {number} [batchSize=10] - Number of URLs to process in parallel
 * @property {number} [maxConcurrent=3] - Maximum concurrent oEmbed requests
 * @property {Function} [onProgress] - Progress callback
 * @property {Function} [onError] - Error callback
 */

/**
 * @typedef {Object} ProcessorResult
 * @property {string} jobId - Job ID
 * @property {number} totalProcessed - Total URLs processed
 * @property {number} successful - Successful fetches
 * @property {number} failed - Failed fetches
 * @property {Array<string>} errors - Error messages
 */

class CsvProcessor {
    /**
     * Create a CSV processor
     * @param {Object} db - Database connection
     * @param {ProcessorOptions} options - Processor options
     */
    constructor(db, options = {}) {
        this.db = db;
        this.batchSize = options.batchSize || 10;
        this.maxConcurrent = options.maxConcurrent || 3;
        this.onProgress = options.onProgress || (() => {});
        this.onError = options.onError || (() => {});
        
        // Initialize rate limiter with conservative settings
        this.rateLimiter = new AdaptiveRateLimiter({
            initialRate: 1,      // Start with 1 request per second
            minRate: 0.5,        // Minimum 0.5 requests per second
            maxRate: 5,          // Maximum 5 requests per second
            backoffMultiplier: 2,
            recoveryRate: 1.1,
            maxRetries: 3
        });
        
        this.activeJobs = new Map();
    }
    
    /**
     * Process CSV import job
     * @param {string} jobId - Job ID
     * @param {Array<{url: string, tag: string}>} urls - URLs to process
     * @returns {Promise<ProcessorResult>} Processing result
     */
    async processJob(jobId, urls) {
        const result = {
            jobId,
            totalProcessed: 0,
            successful: 0,
            failed: 0,
            errors: []
        };
        
        try {
            // Create job in database
            await csvImportTable.createCsvImportJob(this.db, jobId, 'csv_upload.csv', urls.length);
            
            // Add all URLs to database as pending
            for (const urlData of urls) {
                await csvImportTable.addCsvImportResult(
                    this.db,
                    jobId,
                    urlData.url,
                    'pending',
                    null,
                    null,
                    urlData.tag
                );
            }
            
            // Update job status to processing
            await csvImportTable.updateCsvImportJob(this.db, jobId, 'processing');
            
            // Store job in active jobs
            this.activeJobs.set(jobId, {
                status: 'processing',
                cancelled: false
            });
            
            // Process URLs in batches
            while (true) {
                // Check if job was cancelled
                const job = this.activeJobs.get(jobId);
                if (job && job.cancelled) {
                    await csvImportTable.updateCsvImportJob(this.db, jobId, 'cancelled');
                    break;
                }
                
                // Get next batch of pending URLs
                const pendingUrls = await csvImportTable.getPendingUrls(this.db, jobId, this.batchSize);
                
                if (pendingUrls.length === 0) {
                    break; // No more URLs to process
                }
                
                // Process batch
                const batchResults = await this.processBatch(jobId, pendingUrls);
                
                // Update statistics
                result.totalProcessed += batchResults.processed;
                result.successful += batchResults.successful;
                result.failed += batchResults.failed;
                
                // Update job progress
                await csvImportTable.updateCsvImportJob(
                    this.db,
                    jobId,
                    'processing',
                    result.totalProcessed
                );
                
                // Call progress callback
                this.onProgress({
                    jobId,
                    processed: result.totalProcessed,
                    total: urls.length,
                    percentage: Math.round((result.totalProcessed / urls.length) * 100)
                });
            }
            
            // Update final job status
            const finalStatus = result.failed === 0 ? 'completed' : 'completed';
            await csvImportTable.updateCsvImportJob(
                this.db,
                jobId,
                finalStatus,
                result.totalProcessed
            );
            
            // Remove from active jobs
            this.activeJobs.delete(jobId);
            
        } catch (error) {
            console.error('CSV processing error:', error);
            result.errors.push(error.message);
            
            // Update job status to failed
            await csvImportTable.updateCsvImportJob(
                this.db,
                jobId,
                'failed',
                result.totalProcessed,
                error.message
            );
            
            // Remove from active jobs
            this.activeJobs.delete(jobId);
            
            this.onError(error);
        } finally {
            // Processing completed
        }
        
        return result;
    }
    
    /**
     * Process a batch of URLs
     * @param {string} jobId - Job ID
     * @param {Array<{id: number, url: string, custom_tag: string}>} urls - URLs to process
     * @returns {Promise<{processed: number, successful: number, failed: number}>} Batch results
     */
    async processBatch(jobId, urls) {
        const results = {
            processed: 0,
            successful: 0,
            failed: 0
        };
        
        // Process URLs with rate limiting
        const promises = urls.map(urlData => 
            this.rateLimiter.execute(async () => {
                try {
                    // Fetch oEmbed data
                    const oembedData = await extractInstagramOembed(urlData.url);
                    
                    // Update result in database
                    await csvImportTable.updateCsvImportResult(
                        this.db,
                        urlData.id,
                        'success',
                        oembedData,
                        null
                    );
                    
                    results.successful++;
                    
                } catch (error) {
                    console.error(`Failed to fetch oEmbed for ${urlData.url}:`, error.message);
                    
                    // Update result with error
                    await csvImportTable.updateCsvImportResult(
                        this.db,
                        urlData.id,
                        'failed',
                        null,
                        error.message
                    );
                    
                    results.failed++;
                    
                    this.onError({
                        url: urlData.url,
                        error: error.message
                    });
                } finally {
                    results.processed++;
                }
            })
        );
        
        // Wait for all requests to complete
        await Promise.allSettled(promises);
        
        return results;
    }
    
    /**
     * Cancel a job
     * @param {string} jobId - Job ID to cancel
     */
    cancelJob(jobId) {
        const job = this.activeJobs.get(jobId);
        if (job) {
            job.cancelled = true;
        }
    }
    
    /**
     * Get job status
     * @param {string} jobId - Job ID
     * @returns {Promise<Object>} Job status
     */
    async getJobStatus(jobId) {
        try {
            const job = await csvImportTable.getCsvImportJob(this.db, jobId);
            
            if (!job) {
                return null;
            }
            
            // Add rate limiter stats if job is active
            if (this.activeJobs.has(jobId)) {
                const stats = this.rateLimiter.getStats();
                job.rateLimiterStats = stats;
            }
            
            return job;
            
        } catch (error) {
            console.error('Error getting job status:', error);
            throw error;
        } finally {
            // Status retrieval completed
        }
    }
    
    /**
     * Get job results
     * @param {string} jobId - Job ID
     * @param {number} [limit] - Limit number of results
     * @param {number} [offset] - Offset for pagination
     * @returns {Promise<Array>} Job results
     */
    async getJobResults(jobId, limit = null, offset = 0) {
        try {
            const results = await csvImportTable.getCsvImportResults(this.db, jobId, limit, offset);
            
            // Parse oEmbed data from JSON strings
            return results.map(result => ({
                ...result,
                oembed_data: result.oembed_data ? JSON.parse(result.oembed_data) : null
            }));
            
        } catch (error) {
            console.error('Error getting job results:', error);
            throw error;
        } finally {
            // Results retrieval completed
        }
    }
    
    /**
     * Get rate limiter statistics
     * @returns {Object} Rate limiter stats
     */
    getRateLimiterStats() {
        return this.rateLimiter.getStats();
    }
    
    /**
     * Reset rate limiter
     */
    resetRateLimiter() {
        this.rateLimiter.reset();
    }
}

/**
 * Create a new CSV processor instance
 * @param {Object} db - Database connection
 * @param {ProcessorOptions} options - Processor options
 * @returns {CsvProcessor} Processor instance
 */
function createCsvProcessor(db, options = {}) {
    return new CsvProcessor(db, options);
}

module.exports = {
    CsvProcessor,
    createCsvProcessor
};