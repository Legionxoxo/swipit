/**
 * @fileoverview YouTube analysis job lifecycle management
 * @author Backend Team
 */

const { getDatabase } = require('../connection');

/**
 * @typedef {Object} YouTubeAnalysisJob
 * @property {string} analysisId - Unique analysis ID
 * @property {string} youtubeChannelId - YouTube channel ID
 * @property {string} channelUrl - YouTube channel URL
 * @property {string} status - Analysis status (pending, processing, completed, failed)
 * @property {number} progress - Progress percentage (0-100)
 * @property {string} [error] - Error message if failed
 * @property {Date} createdAt - Job creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * Create new YouTube analysis job in database
 * @param {string} analysisId - Unique analysis ID
 * @param {string} youtubeChannelId - YouTube channel ID
 * @param {string} channelUrl - YouTube channel URL
 * @returns {Promise<Object>} Creation result
 */
async function createAnalysisJob(analysisId, youtubeChannelId, channelUrl) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        if (!youtubeChannelId) {
            throw new Error('YouTube channel ID is required');
        }

        if (!channelUrl) {
            throw new Error('Channel URL is required');
        }

        const db = await getDatabase();

        const result = await db.run(
            `INSERT INTO youtube_data 
             (analysis_id, youtube_channel_id, channel_url, analysis_status, analysis_progress) 
             VALUES (?, ?, ?, ?, ?)`,
            [analysisId, youtubeChannelId, channelUrl, 'pending', 0]
        );

        return {
            success: true,
            analysisId: analysisId,
            id: result.lastID
        };

    } catch (error) {
        console.error('Create YouTube analysis job error:', error);
        throw new Error(`Failed to create YouTube analysis job: ${error.message}`);
    } finally {
        console.log(`YouTube analysis job creation attempted: ${analysisId}`);
    }
}

/**
 * Update YouTube analysis job status and progress
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
            `UPDATE youtube_data 
             SET analysis_status = ?, analysis_progress = ?, analysis_error = ?, updated_at = CURRENT_TIMESTAMP
             WHERE analysis_id = ? AND video_id IS NULL`,
            [status, progress, errorMessage, analysisId]
        );

        return {
            success: result.changes > 0,
            changes: result.changes
        };

    } catch (error) {
        console.error('Update YouTube analysis status error:', error);
        throw new Error(`Failed to update YouTube analysis status: ${error.message}`);
    } finally {
        console.log(`YouTube analysis status update attempted: ${analysisId} -> ${status} (${progress}%)`);
    }
}

/**
 * Get YouTube analysis job by ID
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
            `SELECT analysis_id, youtube_channel_id, channel_name, channel_url, analysis_status, 
                    analysis_progress, analysis_error, created_at, updated_at
             FROM youtube_data 
             WHERE analysis_id = ? AND video_id IS NULL`,
            [analysisId]
        );

        if (!job) {
            return null;
        }

        return {
            analysisId: job.analysis_id,
            youtubeChannelId: job.youtube_channel_id,
            channelName: job.channel_name,
            channelUrl: job.channel_url,
            status: job.analysis_status,
            progress: job.analysis_progress,
            error: job.analysis_error,
            createdAt: new Date(job.created_at),
            updatedAt: new Date(job.updated_at)
        };

    } catch (error) {
        console.error('Get YouTube analysis job error:', error);
        throw new Error(`Failed to get YouTube analysis job: ${error.message}`);
    } finally {
        console.log(`YouTube analysis job retrieval attempted: ${analysisId}`);
    }
}

/**
 * Delete YouTube analysis job and all related data
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
            'DELETE FROM youtube_data WHERE analysis_id = ?',
            [analysisId]
        );

        return {
            success: result.changes > 0,
            deletedRecords: result.changes
        };

    } catch (error) {
        console.error('Delete YouTube analysis job error:', error);
        throw new Error(`Failed to delete YouTube analysis job: ${error.message}`);
    } finally {
        console.log(`YouTube analysis job deletion attempted: ${analysisId}`);
    }
}

module.exports = {
    createAnalysisJob,
    updateAnalysisStatus,
    getAnalysisJob,
    deleteAnalysisJob
};