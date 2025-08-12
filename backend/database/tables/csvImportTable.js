/**
 * @fileoverview CSV Import Jobs database table schema and operations
 * @author Backend Team
 */

const tableName = 'csv_import_jobs';
const resultsTableName = 'csv_import_results';

/**
 * @typedef {Object} CsvImportJob
 * @property {string} id - Unique job ID
 * @property {string} filename - Original CSV filename
 * @property {number} total_urls - Total number of URLs in CSV
 * @property {number} processed_urls - Number of processed URLs
 * @property {string} status - Job status (pending, processing, completed, failed)
 * @property {string} created_at - Job creation timestamp
 * @property {string} [completed_at] - Job completion timestamp
 * @property {string} [error_message] - Error message if job failed
 * @property {Object} [rateLimiterStats] - Rate limiter statistics when job is active
 */

/**
 * @typedef {Object} CsvImportResult
 * @property {number} id - Auto-incrementing ID
 * @property {string} job_id - Reference to csv_import_jobs.id
 * @property {string} url - Instagram post URL
 * @property {string} status - Processing status (success, failed, skipped)
 * @property {string} [oembed_data] - JSON string of oEmbed response
 * @property {string} [error_message] - Error message if failed
 * @property {string} processed_at - Processing timestamp
 * @property {string} [custom_tag] - Optional custom tag from CSV
 */

/**
 * Initialize CSV import jobs table
 * @param {Object} db - Database connection wrapper
 * @returns {Promise<void>}
 */
async function initializeCsvImportTable(db) {
    try {
        // Create csv_import_jobs table
        await db.run(`
            CREATE TABLE IF NOT EXISTS ${tableName} (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                total_urls INTEGER NOT NULL DEFAULT 0,
                processed_urls INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                error_message TEXT,
                CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
            )
        `);

        // Create csv_import_results table
        await db.run(`
            CREATE TABLE IF NOT EXISTS ${resultsTableName} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id TEXT NOT NULL,
                url TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                oembed_data TEXT,
                error_message TEXT,
                processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                custom_tag TEXT,
                FOREIGN KEY (job_id) REFERENCES ${tableName}(id) ON DELETE CASCADE,
                CHECK (status IN ('pending', 'success', 'failed', 'skipped'))
            )
        `);

        // Create indexes for better query performance
        await db.run(`CREATE INDEX IF NOT EXISTS idx_csv_jobs_status ON ${tableName}(status)`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_csv_jobs_created ON ${tableName}(created_at)`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_csv_results_job ON ${resultsTableName}(job_id)`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_csv_results_status ON ${resultsTableName}(status)`);

    } catch (error) {
        console.error('Error creating CSV import tables:', error);
        throw error;
    } finally {
        // CSV import tables initialization completed
    }
}

/**
 * Drop CSV import tables
 * @param {Object} db - Database connection wrapper
 * @returns {Promise<void>}
 */
async function dropCsvImportTable(db) {
    try {
        await db.run(`DROP TABLE IF EXISTS ${resultsTableName}`);
        await db.run(`DROP TABLE IF EXISTS ${tableName}`);
    } catch (error) {
        console.error('Error dropping CSV import tables:', error);
        throw error;
    } finally {
        // CSV import tables cleanup completed
    }
}

/**
 * Create a new CSV import job
 * @param {Object} db - Database connection wrapper
 * @param {string} jobId - Unique job ID
 * @param {string} filename - Original CSV filename
 * @param {number} totalUrls - Total number of URLs
 * @returns {Promise<void>}
 */
async function createCsvImportJob(db, jobId, filename, totalUrls) {
    try {
        await db.run(
            `INSERT INTO ${tableName} (id, filename, total_urls, status) VALUES (?, ?, ?, 'pending')`,
            [jobId, filename, totalUrls]
        );
    } catch (error) {
        console.error('Error creating CSV import job:', error);
        throw error;
    } finally {
        // CSV import job created
    }
}

/**
 * Update CSV import job status
 * @param {Object} db - Database connection wrapper
 * @param {string} jobId - Job ID
 * @param {string} status - New status
 * @param {number} [processedUrls] - Number of processed URLs
 * @param {string} [errorMessage] - Error message if failed
 * @returns {Promise<void>}
 */
async function updateCsvImportJob(db, jobId, status, processedUrls = null, errorMessage = null) {
    try {
        const updates = ['status = ?'];
        const params = [status];

        if (processedUrls !== null) {
            updates.push('processed_urls = ?');
            params.push(String(processedUrls));
        }

        if (status === 'completed' || status === 'failed') {
            updates.push('completed_at = CURRENT_TIMESTAMP');
        }

        if (errorMessage) {
            updates.push('error_message = ?');
            params.push(errorMessage);
        }

        params.push(jobId);

        await db.run(
            `UPDATE ${tableName} SET ${updates.join(', ')} WHERE id = ?`,
            params
        );
    } catch (error) {
        console.error('Error updating CSV import job:', error);
        throw error;
    } finally {
        // CSV import job updated
    }
}

/**
 * Add CSV import result
 * @param {Object} db - Database connection wrapper
 * @param {string} jobId - Job ID
 * @param {string} url - Instagram URL
 * @param {string} status - Processing status
 * @param {Object} [oembedData] - oEmbed response data
 * @param {string} [errorMessage] - Error message if failed
 * @param {string} [customTag] - Optional custom tag
 * @returns {Promise<void>}
 */
async function addCsvImportResult(db, jobId, url, status, oembedData = null, errorMessage = null, customTag = null) {
    try {
        const oembedJson = oembedData ? JSON.stringify(oembedData) : null;
        
        await db.run(
            `INSERT INTO ${resultsTableName} (job_id, url, status, oembed_data, error_message, custom_tag) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [jobId, url, status, oembedJson, errorMessage, customTag]
        );
    } catch (error) {
        console.error('Error adding CSV import result:', error);
        throw error;
    } finally {
        // CSV import result added
    }
}

/**
 * Get CSV import job by ID
 * @param {Object} db - Database connection wrapper
 * @param {string} jobId - Job ID
 * @returns {Promise<CsvImportJob|null>}
 */
async function getCsvImportJob(db, jobId) {
    try {
        const job = await db.get(
            `SELECT * FROM ${tableName} WHERE id = ?`,
            [jobId]
        );
        return job || null;
    } catch (error) {
        console.error('Error getting CSV import job:', error);
        throw error;
    } finally {
        // CSV import job retrieval completed
    }
}

/**
 * Get CSV import results by job ID
 * @param {Object} db - Database connection wrapper
 * @param {string} jobId - Job ID
 * @param {number} [limit] - Limit number of results
 * @param {number} [offset] - Offset for pagination
 * @returns {Promise<Array<CsvImportResult>>}
 */
async function getCsvImportResults(db, jobId, limit = null, offset = 0) {
    try {
        let query = `SELECT * FROM ${resultsTableName} WHERE job_id = ? ORDER BY id`;
        const params = [jobId];

        if (limit !== null) {
            query += ` LIMIT ? OFFSET ?`;
            params.push(String(limit), String(offset));
        }

        const results = await db.all(query, params);
        return results || [];
    } catch (error) {
        console.error('Error getting CSV import results:', error);
        throw error;
    } finally {
        // CSV import results retrieval completed
    }
}

/**
 * Get pending URLs for a job
 * @param {Object} db - Database connection wrapper
 * @param {string} jobId - Job ID
 * @param {number} limit - Number of URLs to fetch
 * @returns {Promise<Array<{id: number, url: string, custom_tag: string}>>}
 */
async function getPendingUrls(db, jobId, limit = 10) {
    try {
        const results = await db.all(
            `SELECT id, url, custom_tag FROM ${resultsTableName} 
             WHERE job_id = ? AND status = 'pending' 
             ORDER BY id LIMIT ?`,
            [jobId, limit]
        );
        return results || [];
    } catch (error) {
        console.error('Error getting pending URLs:', error);
        throw error;
    } finally {
        // Pending URLs retrieval completed
    }
}

/**
 * Update CSV import result
 * @param {Object} db - Database connection wrapper
 * @param {number} resultId - Result ID
 * @param {string} status - New status
 * @param {Object} [oembedData] - oEmbed response data
 * @param {string} [errorMessage] - Error message if failed
 * @returns {Promise<void>}
 */
async function updateCsvImportResult(db, resultId, status, oembedData = null, errorMessage = null) {
    try {
        const oembedJson = oembedData ? JSON.stringify(oembedData) : null;
        
        await db.run(
            `UPDATE ${resultsTableName} 
             SET status = ?, oembed_data = ?, error_message = ?, processed_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [status, oembedJson, errorMessage, resultId]
        );
    } catch (error) {
        console.error('Error updating CSV import result:', error);
        throw error;
    } finally {
        // CSV import result updated
    }
}

module.exports = {
    tableName,
    resultsTableName,
    initializeCsvImportTable,
    dropCsvImportTable,
    createCsvImportJob,
    updateCsvImportJob,
    addCsvImportResult,
    getCsvImportJob,
    getCsvImportResults,
    getPendingUrls,
    updateCsvImportResult
};