/**
 * @fileoverview Video processing and analysis utilities
 * @author Backend Team
 */

const youtubeService = require('../../utils/youtubeService');
const youtubeDbService = require('../../utils/youtube/youtubeService');
const { updateAnalysisStatus } = require('./jobManager');

/**
 * @typedef {Object} VideoSegments
 * @property {VideoData[]} low - 0-1,000 views
 * @property {VideoData[]} medium - 1,001-10,000 views
 * @property {VideoData[]} high - 10,001-100,000 views
 * @property {VideoData[]} veryHigh - 100,001-1,000,000 views
 * @property {VideoData[]} viral - 1,000,001+ views
 */

/**
 * @typedef {Object} VideoData
 * @property {string} videoId - Video ID
 * @property {string} title - Video title
 * @property {string} description - Video description
 * @property {string} thumbnailUrl - Thumbnail URL
 * @property {string} uploadDate - Upload date
 * @property {string} duration - Video duration
 * @property {number} viewCount - View count
 * @property {number} likeCount - Like count
 * @property {number} commentCount - Comment count
 * @property {string} categoryId - Category ID
 */

/**
 * Process channel analysis in background
 * @param {string} analysisId - Analysis ID
 * @param {Object} analysisJob - Analysis job data
 * @returns {Promise<void>}
 */
async function processChannelAnalysis(analysisId, analysisJob) {
    try {
        // Load fresh analysis job from database to get correct field names
        const dbAnalysisJob = await youtubeDbService.getAnalysisJob(analysisId);
        if (!dbAnalysisJob) {
            throw new Error('Analysis job not found in database');
        }

        // Step 1: Get channel information
        updateAnalysisStatus(analysisId, 'processing', 10);
        await youtubeDbService.updateAnalysis(analysisId, 'processing', 10);
        
        const channelInfo = await youtubeService.getChannelInfo(dbAnalysisJob.youtubeChannelId);
        
        // Store channel data in database
        await youtubeDbService.storeChannel(analysisId, channelInfo);
        
        analysisJob.channelInfo = channelInfo;
        updateAnalysisStatus(analysisId, 'processing', 20);
        await youtubeDbService.updateAnalysis(analysisId, 'processing', 20);

        // Step 2: Get all video IDs from uploads playlist
        updateAnalysisStatus(analysisId, 'processing', 30);
        await youtubeDbService.updateAnalysis(analysisId, 'processing', 30);
        
        const videoIds = await youtubeService.getAllVideoIds(channelInfo.uploadsPlaylistId);
        
        // Update total videos count (using memory object for backward compatibility)
        if (analysisJob) analysisJob.totalVideos = videoIds.length;
        updateAnalysisStatus(analysisId, 'processing', 50);
        await youtubeDbService.updateAnalysis(analysisId, 'processing', 50);

        // Step 3: Get detailed video information in batches
        updateAnalysisStatus(analysisId, 'processing', 60);
        await youtubeDbService.updateAnalysis(analysisId, 'processing', 60);
        
        const videos = await youtubeService.getVideoDetails(videoIds, async (progress) => {
            const currentProgress = 60 + (progress * 30);
            updateAnalysisStatus(analysisId, 'processing', currentProgress);
            await youtubeDbService.updateAnalysis(analysisId, 'processing', currentProgress);
        });

        // Store video data in database
        await youtubeDbService.storeVideos(analysisId, dbAnalysisJob.youtubeChannelId, videos);

        // Step 4: Segment videos by view count
        updateAnalysisStatus(analysisId, 'processing', 90);
        await youtubeDbService.updateAnalysis(analysisId, 'processing', 90);
        
        const videoSegments = segmentVideosByViews(videos);

        // Update final results
        analysisJob.data = videos;
        analysisJob.videoSegments = videoSegments;
        analysisJob.endTime = new Date();
        
        updateAnalysisStatus(analysisId, 'completed', 100);
        await youtubeDbService.updateAnalysis(analysisId, 'completed', 100);

    } catch (error) {
        console.error(`Process analysis ${analysisId} error:`, error);
        updateAnalysisStatus(analysisId, 'error', 0, { error: error.message });
        await youtubeDbService.updateAnalysis(analysisId, 'failed', 0, error.message);
        throw error;
    } finally {
        console.log(`Analysis processing completed for: ${analysisId}`);
    }
}

/**
 * Segment videos by view count ranges
 * @param {VideoData[]} videos - Array of video data
 * @returns {VideoSegments} Segmented videos
 */
function segmentVideosByViews(videos) {
    try {
        const segments = {
            low: [],        // 0-1,000 views
            medium: [],     // 1,001-10,000 views
            high: [],       // 10,001-100,000 views
            veryHigh: [],   // 100,001-1,000,000 views
            viral: []       // 1,000,001+ views
        };

        if (!videos || !Array.isArray(videos)) {
            return segments;
        }

        videos.forEach(video => {
            const viewCount = video.viewCount || 0;
            
            if (viewCount <= 1000) {
                segments.low.push(video);
            } else if (viewCount <= 10000) {
                segments.medium.push(video);
            } else if (viewCount <= 100000) {
                segments.high.push(video);
            } else if (viewCount <= 1000000) {
                segments.veryHigh.push(video);
            } else {
                segments.viral.push(video);
            }
        });

        return segments;

    } catch (error) {
        console.error('Segment videos error:', error);
        throw new Error(`Failed to segment videos: ${error.message}`);
    } finally {
        console.log(`Videos segmented: ${videos ? videos.length : 0} total videos`);
    }
}

module.exports = {
    processChannelAnalysis,
    segmentVideosByViews
};