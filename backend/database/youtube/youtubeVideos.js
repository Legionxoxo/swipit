/**
 * @fileoverview YouTube video data management
 * @author Backend Team
 */

const { getDatabase } = require('../connection');

/**
 * @typedef {Object} YouTubeVideoData
 * @property {string} videoId - Video ID
 * @property {string} title - Video title
 * @property {string} description - Video description
 * @property {string} thumbnailUrl - Video thumbnail URL
 * @property {string} videoUrl - Video URL
 * @property {string} uploadDate - Upload date
 * @property {string} duration - Video duration
 * @property {number} viewCount - View count
 * @property {number} likeCount - Like count
 * @property {number} commentCount - Comment count
 * @property {string} categoryId - Video category ID
 */

/**
 * Store YouTube video data in database
 * @param {string} analysisId - Analysis ID
 * @param {string} youtubeChannelId - YouTube channel ID
 * @param {Array<Object>} videoDataArray - Array of video data objects
 * @returns {Promise<Object>} Storage result
 */
async function storeVideoData(analysisId, youtubeChannelId, videoDataArray) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        if (!youtubeChannelId) {
            throw new Error('YouTube channel ID is required');
        }

        if (!Array.isArray(videoDataArray) || videoDataArray.length === 0) {
            throw new Error('Video data array is required and must not be empty');
        }

        const db = await getDatabase();
        let successCount = 0;
        let errorCount = 0;

        for (const videoData of videoDataArray) {
            try {
                const {
                    videoId,
                    title,
                    description,
                    thumbnailUrl,
                    videoUrl,
                    uploadDate,
                    duration,
                    viewCount = 0,
                    likeCount = 0,
                    commentCount = 0,
                    categoryId
                } = videoData;

                if (!videoId) {
                    console.warn('Skipping video without ID');
                    errorCount++;
                    continue;
                }

                await db.run(
                    `INSERT INTO youtube_data 
                     (analysis_id, youtube_channel_id, video_id, video_title, video_description, 
                      video_thumbnail_url, video_url, video_upload_date, video_duration, 
                      video_view_count, video_like_count, video_comment_count, video_category_id) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        analysisId, youtubeChannelId, videoId, title, description,
                        thumbnailUrl, videoUrl, uploadDate, duration,
                        viewCount, likeCount, commentCount, categoryId
                    ]
                );

                successCount++;

            } catch (videoError) {
                console.error('Error storing individual video:', videoError);
                errorCount++;
            }
        }

        return {
            success: successCount > 0,
            storedVideos: successCount,
            errors: errorCount,
            totalProcessed: videoDataArray.length
        };

    } catch (error) {
        console.error('Store YouTube video data error:', error);
        throw new Error(`Failed to store YouTube video data: ${error.message}`);
    } finally {
        console.log(`YouTube video data storage attempted for analysis: ${analysisId}`);
    }
}

/**
 * Get YouTube videos by analysis ID
 * @param {string} analysisId - Analysis ID
 * @param {Object} options - Query options
 * @param {number} [options.limit] - Limit number of results
 * @param {number} [options.offset] - Offset for pagination
 * @param {string} [options.sortBy] - Sort field (view_count, upload_date, etc.)
 * @param {string} [options.sortOrder] - Sort order (ASC, DESC)
 * @returns {Promise<Array>} Array of video data
 */
async function getVideosByAnalysis(analysisId, options = {}) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        const {
            limit = 100,
            offset = 0,
            sortBy = 'video_view_count',
            sortOrder = 'DESC'
        } = options;

        const validSortFields = ['video_view_count', 'video_upload_date', 'video_like_count', 'video_comment_count'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'video_view_count';
        const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const db = await getDatabase();

        const videos = await db.all(
            `SELECT video_id, video_title, video_description, video_thumbnail_url, video_url,
                    video_upload_date, video_duration, video_view_count, video_like_count,
                    video_comment_count, video_category_id, created_at, updated_at
             FROM youtube_data 
             WHERE analysis_id = ? AND video_id IS NOT NULL
             ORDER BY ${sortField} ${order}
             LIMIT ? OFFSET ?`,
            [analysisId, limit, offset]
        );

        return videos.map(video => ({
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
            categoryId: video.video_category_id,
            createdAt: new Date(video.created_at),
            updatedAt: new Date(video.updated_at)
        }));

    } catch (error) {
        console.error('Get YouTube videos by analysis error:', error);
        throw new Error(`Failed to get YouTube videos: ${error.message}`);
    } finally {
        console.log(`YouTube videos retrieval attempted for analysis: ${analysisId}`);
    }
}

/**
 * Get video count by analysis ID
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<number>} Total video count
 */
async function getVideoCount(analysisId) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        const db = await getDatabase();

        const result = await db.get(
            'SELECT COUNT(*) as count FROM youtube_data WHERE analysis_id = ? AND video_id IS NOT NULL',
            [analysisId]
        );

        return result.count || 0;

    } catch (error) {
        console.error('Get YouTube video count error:', error);
        throw new Error(`Failed to get YouTube video count: ${error.message}`);
    } finally {
        console.log(`YouTube video count retrieval attempted for analysis: ${analysisId}`);
    }
}

module.exports = {
    storeVideoData,
    getVideosByAnalysis,
    getVideoCount
};