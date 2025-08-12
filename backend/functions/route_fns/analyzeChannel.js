/**
 * @fileoverview Channel analysis route functions - consolidated exports
 * @author Backend Team
 */

// Import type definitions
require('../../types/common');

const { generateAnalysisId, parseChannelUrl } = require('../../utils/helpers');
const { 
    getAnalysisJob, 
    storeAnalysisJob, 
    updateAnalysisStatus 
} = require('../analysis/jobManager');
const { processChannelAnalysis, segmentVideosByViews } = require('../analysis/videoProcessor');
const youtubeService = require('../../utils/youtube/youtubeService');
const youtubeDb = require('../../database/youtube');

/**
 * @typedef {Object} AnalysisJobResponse
 * @property {string} analysisId - Unique analysis ID
 * @property {string} status - Current status (processing, completed, error)
 * @property {number} progress - Progress percentage (0-100)
 * @property {Array} [data] - Analysis results
 * @property {Object} [channelInfo] - Channel information
 * @property {Object} [videoSegments] - Video segments by view count
 * @property {number} [totalVideos] - Total number of videos
 * @property {Object} [pagination] - Pagination information
 * @property {number} [processingTime] - Processing time in seconds
 * @property {string} [error] - Error message if failed
 */

/**
 * Start YouTube channel analysis
 * @param {string} channelUrl - YouTube channel URL
 * @returns {Promise<{analysisId: string, estimatedTime: string, isExisting?: boolean}>} Analysis job info
 */
async function startAnalysis(channelUrl) {
    try {
        // Parse channel URL to get channel ID
        const { channelId, channelType } = await parseChannelUrl(channelUrl);
        
        // Check if this channel has already been analyzed
        const existingAnalysis = await youtubeDb.findExistingAnalysis(channelId, channelUrl);
        
        if (existingAnalysis) {
            console.log(`Found existing analysis for channel: ${channelId || channelUrl}`);
            
            // Check if analysis is completed AND has videos stored
            if (existingAnalysis.status === 'completed') {
                const { getVideoCount } = require('../../database/youtube/youtubeVideos');
                const videoCount = await getVideoCount(existingAnalysis.analysisId);
                
                if (videoCount > 0) {
                    return {
                        analysisId: existingAnalysis.analysisId,
                        estimatedTime: 'Analysis already completed',
                        isExisting: true
                    };
                }
                // If no videos stored, continue with new analysis
                console.log(`Existing analysis has no videos stored, reprocessing...`);
            }
            
            // If analysis is still processing, return the ongoing one
            if (existingAnalysis.status === 'processing' || existingAnalysis.status === 'pending') {
                return {
                    analysisId: existingAnalysis.analysisId,
                    estimatedTime: 'Analysis in progress',
                    isExisting: true
                };
            }
            
            // If analysis failed, we can create a new one (fall through)
        }

        const analysisId = await generateAnalysisId();
        
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

        // Store job in database
        await youtubeService.createAnalysis(analysisId, channelId, channelUrl);
        
        // Store in memory for backward compatibility
        storeAnalysisJob(analysisId, analysisJob);

        // Start background processing
        processChannelAnalysis(analysisId, analysisJob).catch(async error => {
            console.error(`Analysis ${analysisId} failed:`, error);
            updateAnalysisStatus(analysisId, 'error', 0, { error: error.message });
            await youtubeService.updateAnalysis(analysisId, 'failed', 0, error.message);
        });

        return {
            analysisId,
            estimatedTime: '2-10 minutes depending on channel size',
            isExisting: false
        };

    } catch (error) {
        console.error('Start analysis error:', error);
        throw new Error(`Failed to start analysis: ${error.message}`);
    } finally {
        console.log(`Analysis requested for channel: ${channelUrl}`);
    }
}

/**
 * Get analysis status and results with pagination
 * @param {string} analysisId - Analysis ID
 * @param {number} [page=1] - Page number for pagination
 * @param {number} [limit=50] - Items per page
 * @returns {Promise<AnalysisJobResponse|null>} Analysis job data
 */
async function getAnalysisStatus(analysisId, page = 1, limit = 50) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        // Try to get from database first with pagination
        const dbResult = await youtubeService.getAnalysis(analysisId, page, limit);
        
        if (dbResult.success && dbResult.data) {
            return dbResult.data;
        }

        // Fallback to memory store
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
                ? Math.round((analysisJob.endTime.getTime() - analysisJob.startTime.getTime()) / 1000) 
                : Math.round((new Date().getTime() - analysisJob.startTime.getTime()) / 1000),
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