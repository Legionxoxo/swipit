/**
 * @fileoverview Instagram analysis job lifecycle management
 * @author Backend Team
 */

const { getDatabase } = require('../connection');

/**
 * @typedef {Object} InstagramAnalysisJob
 * @property {string} analysisId - Unique analysis ID
 * @property {string} instagramUserId - Instagram user ID
 * @property {string} username - Instagram username
 * @property {string} status - Analysis status (pending, processing, completed, failed)
 * @property {number} progress - Progress percentage (0-100)
 * @property {string} [error] - Error message if failed
 * @property {Date} createdAt - Job creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * Create new Instagram analysis job in database
 * @param {string} analysisId - Unique analysis ID
 * @param {string} instagramUserId - Instagram user ID
 * @param {string} username - Instagram username
 * @returns {Promise<Object>} Creation result
 */
async function createAnalysisJob(analysisId, instagramUserId, username) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        if (!instagramUserId) {
            throw new Error('Instagram user ID is required');
        }

        if (!username) {
            throw new Error('Username is required');
        }

        const db = await getDatabase();

        const result = await db.run(
            `INSERT INTO instagram_data 
             (analysis_id, instagram_user_id, profile_username, analysis_status, analysis_progress) 
             VALUES (?, ?, ?, ?, ?)`,
            [analysisId, instagramUserId, username, 'pending', 0]
        );

        return {
            success: true,
            analysisId: analysisId,
            id: result.lastID
        };

    } catch (error) {
        console.error('Create analysis job error:', error);
        throw new Error(`Failed to create analysis job: ${error.message}`);
    } finally {
        console.log(`Analysis job creation attempted: ${analysisId}`);
    }
}

/**
 * Update analysis job status and progress
 * @param {string} analysisId - Analysis ID
 * @param {string} status - New status
 * @param {number} progress - Progress percentage
 * @param {string} [errorMessage] - Error message if failed
 * @returns {Promise<Object>} Update result
 */
async function updateAnalysisStatus(analysisId, status, progress, errorMessage = null) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        if (!status) {
            throw new Error('Status is required');
        }

        if (progress < 0 || progress > 100) {
            throw new Error('Progress must be between 0 and 100');
        }

        const db = await getDatabase();

        const result = await db.run(
            `UPDATE instagram_data 
             SET analysis_status = ?, analysis_progress = ?, analysis_error = ?, updated_at = CURRENT_TIMESTAMP
             WHERE analysis_id = ? AND reel_id IS NULL`,
            [status, progress, errorMessage, analysisId]
        );

        return {
            success: result.changes > 0,
            changes: result.changes
        };

    } catch (error) {
        console.error('Update analysis status error:', error);
        throw new Error(`Failed to update analysis status: ${error.message}`);
    } finally {
        console.log(`Analysis status update attempted: ${analysisId} -> ${status} (${progress}%)`);
    }
}

/**
 * Get Instagram analysis job by ID
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<Object|null>} Job data or null if not found
 */
async function getAnalysisJob(analysisId) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        const db = await getDatabase();

        const job = await db.get(
            `SELECT analysis_id, instagram_user_id, profile_username, analysis_status, 
                    analysis_progress, analysis_error, created_at, updated_at
             FROM instagram_data 
             WHERE analysis_id = ? AND reel_id IS NULL`,
            [analysisId]
        );

        if (!job) {
            return null;
        }

        return {
            analysisId: job.analysis_id,
            instagramUserId: job.instagram_user_id,
            username: job.profile_username,
            status: job.analysis_status,
            progress: job.analysis_progress,
            error: job.analysis_error,
            createdAt: new Date(job.created_at),
            updatedAt: new Date(job.updated_at)
        };

    } catch (error) {
        console.error('Get analysis job error:', error);
        throw new Error(`Failed to get analysis job: ${error.message}`);
    } finally {
        console.log(`Analysis job retrieval attempted: ${analysisId}`);
    }
}

/**
 * Delete Instagram analysis job and all related data
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<Object>} Deletion result
 */
async function deleteAnalysisJob(analysisId) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        const db = await getDatabase();

        const result = await db.run(
            'DELETE FROM instagram_data WHERE analysis_id = ?',
            [analysisId]
        );

        return {
            success: result.changes > 0,
            deletedRecords: result.changes
        };

    } catch (error) {
        console.error('Delete analysis job error:', error);
        throw new Error(`Failed to delete analysis job: ${error.message}`);
    } finally {
        console.log(`Analysis job deletion attempted: ${analysisId}`);
    }
}

module.exports = {
    createAnalysisJob,
    updateAnalysisStatus,
    getAnalysisJob,
    deleteAnalysisJob
};