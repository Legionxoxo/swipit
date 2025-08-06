/**
 * @fileoverview YouTube service layer for data management
 * @author Backend Team
 */

const youtubeDb = require('../../database/youtubeDb');

/**
 * @typedef {Object} YouTubeServiceResponse
 * @property {boolean} success - Success status
 * @property {string} message - Response message
 * @property {any} [data] - Response data
 * @property {string} [error] - Error message if failed
 */

/**
 * Create new YouTube analysis job
 * @param {string} analysisId - Unique analysis ID
 * @param {string} youtubeChannelId - YouTube channel ID
 * @param {string} channelUrl - Channel URL
 * @returns {Promise<YouTubeServiceResponse>} Service response
 */
async function createAnalysis(analysisId, youtubeChannelId, channelUrl) {
    try {
        if (!analysisId || !youtubeChannelId || !channelUrl) {
            throw new Error('Analysis ID, channel ID, and channel URL are required');
        }

        const result = await youtubeDb.createAnalysisJob(analysisId, youtubeChannelId, channelUrl);

        return {
            success: true,
            message: 'YouTube analysis job created successfully',
            data: result
        };

    } catch (error) {
        console.error('YouTube service create analysis error:', error);
        return {
            success: false,
            message: 'Failed to create YouTube analysis job',
            error: error.message
        };
    } finally {
        console.log(`YouTube analysis creation attempted: ${analysisId}`);
    }
}

/**
 * Update YouTube analysis status
 * @param {string} analysisId - Analysis ID
 * @param {string} status - New status
 * @param {number} progress - Progress percentage
 * @param {string} [errorMessage] - Error message if failed
 * @returns {Promise<YouTubeServiceResponse>} Service response
 */
async function updateAnalysis(analysisId, status, progress, errorMessage = null) {
    try {
        if (!analysisId || !status) {
            throw new Error('Analysis ID and status are required');
        }

        const result = await youtubeDb.updateAnalysisStatus(analysisId, status, progress, errorMessage);

        return {
            success: true,
            message: 'YouTube analysis status updated successfully',
            data: result
        };

    } catch (error) {
        console.error('YouTube service update analysis error:', error);
        return {
            success: false,
            message: 'Failed to update YouTube analysis status',
            error: error.message
        };
    } finally {
        console.log(`YouTube analysis update attempted: ${analysisId}`);
    }
}

/**
 * Store YouTube channel data
 * @param {string} analysisId - Analysis ID
 * @param {Object} channelData - Channel data object
 * @returns {Promise<YouTubeServiceResponse>} Service response
 */
async function storeChannel(analysisId, channelData) {
    try {
        if (!analysisId || !channelData) {
            throw new Error('Analysis ID and channel data are required');
        }

        const result = await youtubeDb.storeChannelData(analysisId, channelData);

        return {
            success: true,
            message: 'YouTube channel data stored successfully',
            data: result
        };

    } catch (error) {
        console.error('YouTube service store channel error:', error);
        return {
            success: false,
            message: 'Failed to store YouTube channel data',
            error: error.message
        };
    } finally {
        console.log(`YouTube channel storage attempted: ${analysisId}`);
    }
}

/**
 * Store YouTube video data
 * @param {string} analysisId - Analysis ID
 * @param {string} youtubeChannelId - YouTube channel ID
 * @param {Array} videoDataArray - Array of video data
 * @returns {Promise<YouTubeServiceResponse>} Service response
 */
async function storeVideos(analysisId, youtubeChannelId, videoDataArray) {
    try {
        if (!analysisId || !youtubeChannelId || !Array.isArray(videoDataArray)) {
            throw new Error('Analysis ID, channel ID, and video data array are required');
        }

        const result = await youtubeDb.storeVideoData(analysisId, youtubeChannelId, videoDataArray);

        return {
            success: true,
            message: 'YouTube video data stored successfully',
            data: result
        };

    } catch (error) {
        console.error('YouTube service store videos error:', error);
        return {
            success: false,
            message: 'Failed to store YouTube video data',
            error: error.message
        };
    } finally {
        console.log(`YouTube videos storage attempted: ${analysisId}`);
    }
}

/**
 * Get YouTube analysis by ID
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<YouTubeServiceResponse>} Service response with analysis data
 */
async function getAnalysis(analysisId) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        const results = await youtubeDb.getAnalysisResults(analysisId);

        if (!results) {
            return {
                success: false,
                message: 'YouTube analysis not found',
                error: `No analysis found with ID: ${analysisId}`
            };
        }

        return {
            success: true,
            message: 'YouTube analysis retrieved successfully',
            data: results
        };

    } catch (error) {
        console.error('YouTube service get analysis error:', error);
        return {
            success: false,
            message: 'Failed to get YouTube analysis',
            error: error.message
        };
    } finally {
        console.log(`YouTube analysis retrieval attempted: ${analysisId}`);
    }
}

/**
 * Get YouTube analysis summary
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<YouTubeServiceResponse>} Service response with summary
 */
async function getAnalysisSummary(analysisId) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        const summary = await youtubeDb.getAnalysisSummary(analysisId);

        if (!summary) {
            return {
                success: false,
                message: 'YouTube analysis summary not found',
                error: `No analysis found with ID: ${analysisId}`
            };
        }

        return {
            success: true,
            message: 'YouTube analysis summary retrieved successfully',
            data: summary
        };

    } catch (error) {
        console.error('YouTube service get summary error:', error);
        return {
            success: false,
            message: 'Failed to get YouTube analysis summary',
            error: error.message
        };
    } finally {
        console.log(`YouTube analysis summary retrieval attempted: ${analysisId}`);
    }
}

/**
 * Get YouTube videos by analysis ID
 * @param {string} analysisId - Analysis ID
 * @param {Object} options - Query options
 * @returns {Promise<YouTubeServiceResponse>} Service response with videos
 */
async function getVideos(analysisId, options = {}) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        const videos = await youtubeDb.getVideosByAnalysis(analysisId, options);

        return {
            success: true,
            message: 'YouTube videos retrieved successfully',
            data: videos
        };

    } catch (error) {
        console.error('YouTube service get videos error:', error);
        return {
            success: false,
            message: 'Failed to get YouTube videos',
            error: error.message
        };
    } finally {
        console.log(`YouTube videos retrieval attempted: ${analysisId}`);
    }
}

/**
 * Delete YouTube analysis
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<YouTubeServiceResponse>} Service response
 */
async function deleteAnalysis(analysisId) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        const result = await youtubeDb.deleteAnalysisJob(analysisId);

        return {
            success: true,
            message: 'YouTube analysis deleted successfully',
            data: result
        };

    } catch (error) {
        console.error('YouTube service delete analysis error:', error);
        return {
            success: false,
            message: 'Failed to delete YouTube analysis',
            error: error.message
        };
    } finally {
        console.log(`YouTube analysis deletion attempted: ${analysisId}`);
    }
}

module.exports = {
    createAnalysis,
    updateAnalysis,
    storeChannel,
    storeVideos,
    getAnalysis,
    getAnalysisSummary,
    getVideos,
    deleteAnalysis
};