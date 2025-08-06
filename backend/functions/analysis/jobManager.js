/**
 * @fileoverview Analysis job management utilities
 * @author Backend Team
 */

// Import type definitions
require('../../types/common');

/**
 * @typedef {Object} AnalysisJob
 * @property {string} analysisId - Unique analysis ID
 * @property {string} channelUrl - Original channel URL
 * @property {string} channelId - YouTube channel ID
 * @property {string} status - Current status (processing, completed, error)
 * @property {number} progress - Progress percentage (0-100)
 * @property {Date} startTime - Analysis start time
 * @property {Date} [endTime] - Analysis end time
 * @property {VideoData[]} [data] - Analysis results
 * @property {ChannelInfo} [channelInfo] - Channel information
 * @property {VideoSegments} [videoSegments] - Video segments by view count
 * @property {number} [totalVideos] - Total number of videos
 * @property {string} [error] - Error message if failed
 */

// In-memory storage for analysis jobs (replace with database in production)
const analysisJobs = new Map();

/**
 * Get analysis job by ID
 * @param {string} analysisId - Analysis ID
 * @returns {AnalysisJob|null} Analysis job data
 */
function getAnalysisJob(analysisId) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        return analysisJobs.get(analysisId) || null;

    } catch (error) {
        console.error('Get analysis job error:', error);
        return null;
    } finally {
        console.log(`Analysis job retrieved: ${analysisId}`);
    }
}

/**
 * Store analysis job
 * @param {string} analysisId - Analysis ID
 * @param {AnalysisJob} analysisJob - Analysis job data
 * @returns {void}
 */
function storeAnalysisJob(analysisId, analysisJob) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        if (!analysisJob) {
            throw new Error('Analysis job data is required');
        }

        analysisJobs.set(analysisId, analysisJob);

    } catch (error) {
        console.error('Store analysis job error:', error);
        throw error;
    } finally {
        console.log(`Analysis job stored: ${analysisId}`);
    }
}

/**
 * Update analysis status
 * @param {string} analysisId - Analysis ID
 * @param {string} status - New status
 * @param {number} progress - Progress percentage
 * @param {Object} [additionalData] - Additional data to merge
 * @returns {void}
 */
function updateAnalysisStatus(analysisId, status, progress, additionalData = {}) {
    try {
        const analysisJob = analysisJobs.get(analysisId);
        if (!analysisJob) {
            throw new Error('Analysis job not found');
        }

        analysisJob.status = status;
        analysisJob.progress = progress;
        Object.assign(analysisJob, additionalData);
        
        analysisJobs.set(analysisId, analysisJob);

    } catch (error) {
        console.error('Update analysis status error:', error);
        throw error;
    } finally {
        console.log(`Analysis ${analysisId} status updated: ${status} (${progress}%)`);
    }
}

/**
 * Remove analysis job from memory
 * @param {string} analysisId - Analysis ID
 * @returns {boolean} Whether job was removed
 */
function removeAnalysisJob(analysisId) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        return analysisJobs.delete(analysisId);

    } catch (error) {
        console.error('Remove analysis job error:', error);
        return false;
    } finally {
        console.log(`Analysis job removal attempted: ${analysisId}`);
    }
}

/**
 * Get all active analysis jobs
 * @returns {Map<string, AnalysisJob>} All analysis jobs
 */
function getAllAnalysisJobs() {
    try {
        return new Map(analysisJobs);
    } catch (error) {
        console.error('Get all analysis jobs error:', error);
        return new Map();
    } finally {
        console.log(`Retrieved ${analysisJobs.size} analysis jobs`);
    }
}

module.exports = {
    getAnalysisJob,
    storeAnalysisJob,
    updateAnalysisStatus,
    removeAnalysisJob,
    getAllAnalysisJobs
};