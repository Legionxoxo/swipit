/**
 * @fileoverview Channel analysis route functions - consolidated exports
 * @author Backend Team
 */

const { generateAnalysisId, parseChannelUrl } = require('../../utils/helpers');
const { 
    getAnalysisJob, 
    storeAnalysisJob, 
    updateAnalysisStatus 
} = require('../analysis/jobManager');
const { processChannelAnalysis, segmentVideosByViews } = require('../analysis/videoProcessor');

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

/**
 * Start YouTube channel analysis
 * @param {string} channelUrl - YouTube channel URL
 * @returns {Promise<{analysisId: string, estimatedTime: string}>} Analysis job info
 */
async function startAnalysis(channelUrl) {
    try {
        const analysisId = generateAnalysisId();
        
        // Parse channel URL to get channel ID
        const { channelId, channelType } = await parseChannelUrl(channelUrl);
        
        // Create analysis job
        const analysisJob = {
            analysisId,
            channelUrl,
            channelId,
            channelType,
            status: 'processing',
            progress: 0,
            startTime: new Date(),
            data: [],
            totalVideos: 0
        };

        // Store job
        storeAnalysisJob(analysisId, analysisJob);

        // Start background processing
        processChannelAnalysis(analysisId, analysisJob).catch(error => {
            console.error(`Analysis ${analysisId} failed:`, error);
            updateAnalysisStatus(analysisId, 'error', 0, { error: error.message });
        });

        return {
            analysisId,
            estimatedTime: '2-10 minutes depending on channel size'
        };

    } catch (error) {
        console.error('Start analysis error:', error);
        throw new Error(`Failed to start analysis: ${error.message}`);
    } finally {
        console.log(`Analysis started for channel: ${channelUrl}`);
    }
}

/**
 * Get analysis status and results
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<AnalysisJob|null>} Analysis job data
 */
async function getAnalysisStatus(analysisId) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        const analysisJob = getAnalysisJob(analysisId);
        
        if (!analysisJob) {
            return null;
        }

        return {
            analysisId: analysisJob.analysisId,
            status: analysisJob.status,
            progress: analysisJob.progress,
            data: analysisJob.data || [],
            channelInfo: analysisJob.channelInfo,
            videoSegments: analysisJob.videoSegments,
            totalVideos: analysisJob.totalVideos || 0,
            processingTime: analysisJob.endTime 
                ? Math.round((analysisJob.endTime - analysisJob.startTime) / 1000) 
                : Math.round((new Date() - analysisJob.startTime) / 1000),
            error: analysisJob.error
        };

    } catch (error) {
        console.error('Get analysis status error:', error);
        throw new Error(`Failed to get analysis status: ${error.message}`);
    } finally {
        console.log(`Status requested for analysis: ${analysisId}`);
    }
}

/**
 * Re-export all analysis functions for backward compatibility
 */
module.exports = {
    startAnalysis,
    getAnalysisStatus,
    processChannelAnalysis,
    updateAnalysisStatus,
    segmentVideosByViews
};