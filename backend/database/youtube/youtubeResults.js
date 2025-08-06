/**
 * @fileoverview YouTube analysis results aggregation
 * @author Backend Team
 */

const { getDatabase } = require('../connection');

/**
 * @typedef {Object} YouTubeAnalysisResults
 * @property {string} analysisId - Analysis ID
 * @property {string} status - Analysis status
 * @property {number} progress - Progress percentage
 * @property {Object} channelInfo - Channel information
 * @property {Array} videos - Video data array
 * @property {Object} videoSegments - Videos segmented by performance
 * @property {number} totalVideos - Total video count
 * @property {string} [error] - Error message if failed
 */

/**
 * Get complete YouTube analysis results
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<Object|null>} Complete analysis results or null if not found
 */
async function getAnalysisResults(analysisId) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        const db = await getDatabase();

        const job = await db.get(
            `SELECT analysis_id, youtube_channel_id, channel_name, channel_url,
                    channel_subscriber_count, channel_video_count, channel_creation_date,
                    channel_description, channel_thumbnail_url, channel_uploads_playlist_id,
                    analysis_status, analysis_progress, analysis_error, created_at, updated_at
             FROM youtube_data 
             WHERE analysis_id = ? AND video_id IS NULL`,
            [analysisId]
        );

        if (!job) {
            return null;
        }

        const videos = await db.all(
            `SELECT video_id, video_title, video_description, video_thumbnail_url, video_url,
                    video_upload_date, video_duration, video_view_count, video_like_count,
                    video_comment_count, video_category_id
             FROM youtube_data 
             WHERE analysis_id = ? AND video_id IS NOT NULL
             ORDER BY video_view_count DESC`,
            [analysisId]
        );

        const channelInfo = {
            youtubeChannelId: job.youtube_channel_id,
            channelName: job.channel_name,
            channelUrl: job.channel_url,
            subscriberCount: job.channel_subscriber_count || 0,
            videoCount: job.channel_video_count || 0,
            creationDate: job.channel_creation_date,
            description: job.channel_description,
            thumbnailUrl: job.channel_thumbnail_url,
            uploadsPlaylistId: job.channel_uploads_playlist_id
        };

        const videoData = videos.map(video => ({
            videoId: video.video_id,
            title: video.video_title,
            description: video.video_description,
            thumbnailUrl: video.video_thumbnail_url,
            videoUrl: video.video_url,
            uploadDate: video.video_upload_date,
            duration: video.video_duration,
            viewCount: video.video_view_count || 0,
            likeCount: video.video_like_count || 0,
            commentCount: video.video_comment_count || 0,
            categoryId: video.video_category_id
        }));

        const videoSegments = segmentVideosByPerformance(videoData, channelInfo.subscriberCount);

        return {
            analysisId: job.analysis_id,
            status: job.analysis_status,
            progress: job.analysis_progress,
            channelInfo: channelInfo,
            data: videoData,
            videoSegments: videoSegments,
            totalVideos: videos.length,
            error: job.analysis_error,
            createdAt: new Date(job.created_at),
            updatedAt: new Date(job.updated_at)
        };

    } catch (error) {
        console.error('Get YouTube analysis results error:', error);
        throw new Error(`Failed to get YouTube analysis results: ${error.message}`);
    } finally {
        console.log(`YouTube analysis results retrieval attempted: ${analysisId}`);
    }
}

/**
 * Get YouTube analysis summary (lightweight version)
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<Object|null>} Analysis summary or null if not found
 */
async function getAnalysisSummary(analysisId) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        const db = await getDatabase();

        const summary = await db.get(
            `SELECT yd.analysis_id, yd.channel_name, yd.channel_subscriber_count, 
                    yd.analysis_status, yd.analysis_progress, yd.analysis_error,
                    yd.created_at, yd.updated_at,
                    COUNT(CASE WHEN yd2.video_id IS NOT NULL THEN 1 END) as video_count,
                    AVG(CASE WHEN yd2.video_view_count IS NOT NULL THEN yd2.video_view_count END) as avg_views,
                    MAX(CASE WHEN yd2.video_view_count IS NOT NULL THEN yd2.video_view_count END) as max_views,
                    SUM(CASE WHEN yd2.video_view_count IS NOT NULL THEN yd2.video_view_count END) as total_views
             FROM youtube_data yd
             LEFT JOIN youtube_data yd2 ON yd.analysis_id = yd2.analysis_id AND yd2.video_id IS NOT NULL
             WHERE yd.analysis_id = ? AND yd.video_id IS NULL
             GROUP BY yd.analysis_id`,
            [analysisId]
        );

        if (!summary) {
            return null;
        }

        return {
            analysisId: summary.analysis_id,
            channelName: summary.channel_name,
            subscriberCount: summary.channel_subscriber_count || 0,
            status: summary.analysis_status,
            progress: summary.analysis_progress,
            error: summary.analysis_error,
            totalVideos: summary.video_count || 0,
            averageViews: Math.round(summary.avg_views || 0),
            maxViews: summary.max_views || 0,
            totalViews: summary.total_views || 0,
            createdAt: new Date(summary.created_at),
            updatedAt: new Date(summary.updated_at)
        };

    } catch (error) {
        console.error('Get YouTube analysis summary error:', error);
        throw new Error(`Failed to get YouTube analysis summary: ${error.message}`);
    } finally {
        console.log(`YouTube analysis summary retrieval attempted: ${analysisId}`);
    }
}

/**
 * Segment videos by performance based on view counts
 * @param {Array} videos - Array of video data
 * @param {number} subscriberCount - Channel subscriber count
 * @returns {Object} Segmented videos object
 */
function segmentVideosByPerformance(videos, subscriberCount) {
    try {
        if (!Array.isArray(videos) || videos.length === 0) {
            return {
                viral: [],
                veryHigh: [],
                high: [],
                medium: [],
                low: []
            };
        }

        const sortedVideos = [...videos].sort((a, b) => b.viewCount - a.viewCount);
        const maxViews = sortedVideos[0]?.viewCount || 0;
        const avgViews = videos.reduce((sum, v) => sum + v.viewCount, 0) / videos.length;

        const viralThreshold = Math.max(subscriberCount * 2, maxViews * 0.8);
        const veryHighThreshold = Math.max(subscriberCount, avgViews * 2);
        const highThreshold = Math.max(subscriberCount * 0.5, avgViews * 1.5);
        const mediumThreshold = avgViews * 0.7;

        return videos.reduce((segments, video) => {
            const views = video.viewCount;
            
            if (views >= viralThreshold) {
                segments.viral.push(video);
            } else if (views >= veryHighThreshold) {
                segments.veryHigh.push(video);
            } else if (views >= highThreshold) {
                segments.high.push(video);
            } else if (views >= mediumThreshold) {
                segments.medium.push(video);
            } else {
                segments.low.push(video);
            }
            
            return segments;
        }, {
            viral: [],
            veryHigh: [],
            high: [],
            medium: [],
            low: []
        });

    } catch (error) {
        console.error('Segment videos by performance error:', error);
        return {
            viral: [],
            veryHigh: [],
            high: [],
            medium: [],
            low: []
        };
    } finally {
        console.log(`Video segmentation completed for ${videos.length} videos`);
    }
}

module.exports = {
    getAnalysisResults,
    getAnalysisSummary
};