/**
 * @fileoverview CSV import API routes for Instagram oEmbed batch processing
 * @author Backend Team
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { parseCsvFile, parseCsvContent, generateSampleCsv } = require('../../functions/csv/csvParser');
const { createCsvProcessor } = require('../../functions/csv/csvProcessor');

// Configure multer for file uploads
const upload = multer({
    dest: path.join(__dirname, '../../temp/csv_uploads/'),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
        files: 1
    },
    fileFilter: (req, file, cb) => {
        // Accept only CSV files
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.csv' || file.mimetype === 'text/csv') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

// Ensure upload directory exists
const ensureUploadDir = async () => {
    const uploadDir = path.join(__dirname, '../../temp/csv_uploads/');
    try {
        await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
        console.error('Error creating upload directory:', error);
    }
};

// Initialize upload directory
ensureUploadDir();

/**
 * POST /api/csv/upload
 * Upload and process CSV file with Instagram URLs
 */
router.post('/upload', upload.single('csv'), async (req, res) => {
    let filePath = null;
    
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No CSV file uploaded'
            });
        }
        
        filePath = req.file.path;
        
        // Parse CSV file
        const parseOptions = {
            skipHeader: req.body.skipHeader !== 'false',
            maxRows: parseInt(req.body.maxRows) || 1000,
            removeDuplicates: req.body.removeDuplicates !== 'false'
        };
        
        const parseResult = await parseCsvFile(filePath, parseOptions);
        
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Failed to parse CSV',
                details: parseResult.errors
            });
        }
        
        // Generate job ID
        const jobId = uuidv4();
        
        // Get database connection
        const { getDatabase } = require('../../database/connection');
        const db = await getDatabase();
        
        // Create processor with progress callback
        const processor = createCsvProcessor(db, {
            batchSize: 10,
            maxConcurrent: 3,
            onProgress: (progress) => {
                console.log(`Job ${jobId}: ${progress.percentage}% complete`);
            },
            onError: (error) => {
                console.error(`Job ${jobId} error:`, error);
            }
        });
        
        // Start processing in background
        // Convert rows to expected format
        const urls = parseResult.rows.map(row => ({
            url: row.url,
            tag: row.tag || null
        }));
        processor.processJob(jobId, urls).catch(error => {
            console.error(`Job ${jobId} failed:`, error);
        });
        
        // Return job ID immediately
        res.json({
            success: true,
            jobId: jobId,
            totalUrls: parseResult.validRows,
            parseErrors: parseResult.errors.slice(0, 10) // Return first 10 errors
        });
        
    } catch (error) {
        console.error('CSV upload error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        // Clean up uploaded file
        if (filePath) {
            try {
                await fs.unlink(filePath);
            } catch (error) {
                console.error('Error deleting temp file:', error);
            }
        }
    }
});

/**
 * POST /api/csv/parse
 * Parse CSV content without file upload
 */
router.post('/parse', express.json({ limit: '10mb' }), async (req, res) => {
    try {
        const { content, skipHeader = true, maxRows = 1000, removeDuplicates = true } = req.body;
        
        if (!content) {
            return res.status(400).json({
                success: false,
                error: 'No CSV content provided'
            });
        }
        
        // Parse CSV content
        const parseResult = parseCsvContent(content, {
            skipHeader,
            maxRows,
            removeDuplicates
        });
        
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Failed to parse CSV',
                details: parseResult.errors
            });
        }
        
        // Generate job ID
        const jobId = uuidv4();
        
        // Get database connection
        const { getDatabase } = require('../../database/connection');
        const db = await getDatabase();
        
        // Create processor
        const processor = createCsvProcessor(db, {
            batchSize: 10,
            maxConcurrent: 3
        });
        
        // Start processing in background
        // Convert rows to expected format
        const urls = parseResult.rows.map(row => ({
            url: row.url,
            tag: row.tag || null
        }));
        processor.processJob(jobId, urls).catch(error => {
            console.error(`Job ${jobId} failed:`, error);
        });
        
        // Return job ID
        res.json({
            success: true,
            jobId: jobId,
            totalUrls: parseResult.validRows,
            parseErrors: parseResult.errors.slice(0, 10)
        });
        
    } catch (error) {
        console.error('CSV parse error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/csv/job/:jobId
 * Get job status
 */
router.get('/job/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        
        if (!jobId) {
            return res.status(400).json({
                success: false,
                error: 'Job ID is required'
            });
        }
        
        const { getDatabase } = require('../../database/connection');
        const db = await getDatabase();
        const csvImportTable = require('../../database/tables/csvImportTable');
        
        const job = await csvImportTable.getCsvImportJob(db, jobId);
        
        if (!job) {
            return res.status(404).json({
                success: false,
                error: 'Job not found'
            });
        }
        
        // Calculate progress percentage
        const progress = job.total_urls > 0 
            ? Math.round((job.processed_urls / job.total_urls) * 100)
            : 0;
        
        res.json({
            success: true,
            job: {
                id: job.id,
                filename: job.filename,
                status: job.status,
                totalUrls: job.total_urls,
                processedUrls: job.processed_urls,
                progress: progress,
                createdAt: job.created_at,
                completedAt: job.completed_at,
                errorMessage: job.error_message
            }
        });
        
    } catch (error) {
        console.error('Get job status error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/csv/results/:jobId
 * Get job results
 */
router.get('/results/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const { limit = 100, offset = 0, format = 'json' } = req.query;
        
        if (!jobId) {
            return res.status(400).json({
                success: false,
                error: 'Job ID is required'
            });
        }
        
        const { getDatabase } = require('../../database/connection');
        const db = await getDatabase();
        const csvImportTable = require('../../database/tables/csvImportTable');
        
        // Get job to check if it exists
        const job = await csvImportTable.getCsvImportJob(db, jobId);
        
        if (!job) {
            return res.status(404).json({
                success: false,
                error: 'Job not found'
            });
        }
        
        // Get results
        const results = await csvImportTable.getCsvImportResults(
            db, 
            jobId, 
            parseInt(String(limit)), 
            parseInt(String(offset))
        );
        
        // Parse oEmbed data
        const parsedResults = results.map(result => ({
            ...result,
            oembed_data: result.oembed_data ? JSON.parse(result.oembed_data) : null
        }));
        
        // Format response based on requested format
        if (format === 'csv') {
            // Generate CSV download
            const csvContent = generateResultsCsv(parsedResults);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="instagram_oembed_results_${jobId}.csv"`);
            res.send(csvContent);
        } else {
            // Return JSON
            res.json({
                success: true,
                jobId: jobId,
                results: parsedResults,
                totalResults: results.length,
                hasMore: results.length === parseInt(String(limit))
            });
        }
        
    } catch (error) {
        console.error('Get job results error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/csv/job/:jobId
 * Cancel a running job
 */
router.delete('/job/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        
        if (!jobId) {
            return res.status(400).json({
                success: false,
                error: 'Job ID is required'
            });
        }
        
        const { getDatabase } = require('../../database/connection');
        const db = await getDatabase();
        const csvImportTable = require('../../database/tables/csvImportTable');
        
        // Update job status to cancelled
        await csvImportTable.updateCsvImportJob(db, jobId, 'cancelled');
        
        res.json({
            success: true,
            message: 'Job cancelled successfully'
        });
        
    } catch (error) {
        console.error('Cancel job error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/csv/sample
 * Get sample CSV format
 */
router.get('/sample', (req, res) => {
    try {
        const sampleCsv = generateSampleCsv();
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="instagram_urls_sample.csv"');
        res.send(sampleCsv);
        
    } catch (error) {
        console.error('Generate sample CSV error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Generate CSV from results
 * @param {Array} results - Results array
 * @returns {string} CSV content
 */
function generateResultsCsv(results) {
    const headers = [
        'URL',
        'Status',
        'Username',
        'Author ID',
        'Caption',
        'Thumbnail URL',
        'Error',
        'Custom Tag',
        'Processed At'
    ];
    
    const rows = results.map(result => {
        const oembed = result.oembed_data || {};
        return [
            result.url,
            result.status,
            oembed.username || '',
            oembed.author_id || '',
            (oembed.caption || '').replace(/"/g, '""'), // Escape quotes
            oembed.thumbnail_url || '',
            result.error_message || '',
            result.custom_tag || '',
            result.processed_at
        ].map(val => `"${val}"`).join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
}

module.exports = router;