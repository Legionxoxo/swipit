/**
 * @fileoverview Channel analysis route functions
 * @author Backend Team
 */

const { v4: uuidv4 } = require('uuid');
const youtubeService = require('../../utils/youtubeService');
const { generateAnalysisId, parseChannelUrl } = require('../../utils/helpers');

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
 * @typedef {Object} ChannelInfo
 * @property {string} channelId - Channel ID
 * @property {string} channelName - Channel name
 * @property {string} channelUrl - Channel URL
 * @property {number} subscriberCount - Subscriber count
 * @property {number} videoCount - Total video count
 * @property {string} creationDate - Channel creation date
 * @property {string} description - Channel description
 * @property {string} thumbnailUrl - Channel thumbnail URL
 */

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
 * @property {string} id - Video ID
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

// In-memory storage for analysis jobs (replace with database in production)
const analysisJobs = new Map();

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

        // Store job in memory
        analysisJobs.set(analysisId, analysisJob);

        // Start background processing
        processChannelAnalysis(analysisId).catch(error => {
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

        const analysisJob = analysisJobs.get(analysisId);
        
        if (!analysisJob) {
            return null;
        }

        return {
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
 * Process channel analysis in background
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<void>}
 */
async function processChannelAnalysis(analysisId) {
    try {
        const analysisJob = analysisJobs.get(analysisId);
        if (!analysisJob) {
            throw new Error('Analysis job not found');
        }

        // Step 1: Get channel information
        updateAnalysisStatus(analysisId, 'processing', 10);
        const channelInfo = await youtubeService.getChannelInfo(analysisJob.channelId);
        
        analysisJob.channelInfo = channelInfo;
        updateAnalysisStatus(analysisId, 'processing', 20);

        // Step 2: Get all video IDs from uploads playlist
        updateAnalysisStatus(analysisId, 'processing', 30);
        const videoIds = await youtubeService.getAllVideoIds(channelInfo.uploadsPlaylistId);
        
        analysisJob.totalVideos = videoIds.length;
        updateAnalysisStatus(analysisId, 'processing', 50);

        // Step 3: Get detailed video information in batches
        updateAnalysisStatus(analysisId, 'processing', 60);
        const videos = await youtubeService.getVideoDetails(videoIds, (progress) => {
            updateAnalysisStatus(analysisId, 'processing', 60 + (progress * 0.3));
        });

        // Step 4: Segment videos by view count
        updateAnalysisStatus(analysisId, 'processing', 90);
        const videoSegments = segmentVideosByViews(videos);

        // Update final results
        analysisJob.data = videos;
        analysisJob.videoSegments = videoSegments;
        analysisJob.endTime = new Date();
        
        updateAnalysisStatus(analysisId, 'completed', 100);

    } catch (error) {
        console.error(`Process analysis ${analysisId} error:`, error);
        updateAnalysisStatus(analysisId, 'error', 0, { error: error.message });
        throw error;
    } finally {
        console.log(`Analysis processing completed for: ${analysisId}`);
    }
}

/**
 * Update analysis status
 * @param {string} analysisId - Analysis ID
 * @param {string} status - New status
 * @param {number} progress - Progress percentage
 * @param {Object} [additionalData] - Additional data to merge
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
    } finally {
        console.log(`Analysis ${analysisId} status updated: ${status} (${progress}%)`);
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
        console.log(`Videos segmented into ${Object.keys(segments).length} categories`);
    }
}

module.exports = {
    startAnalysis,
    getAnalysisStatus,
    processChannelAnalysis,
    updateAnalysisStatus,
    segmentVideosByViews
};