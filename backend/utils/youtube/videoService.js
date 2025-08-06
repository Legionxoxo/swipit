/**
 * @fileoverview YouTube video service functions
 * @author Backend Team
 */

const { getYouTubeClient, delay } = require('./apiClient');

/**
 * @typedef {Object} VideoData
 * @property {string} id - Video ID
 * @property {string} title - Video title
 * @property {string} description - Video description
 * @property {string} thumbnailUrl - Thumbnail URL
 * @property {string} videoUrl - Video URL
 * @property {string} uploadDate - Upload date
 * @property {string} duration - Video duration
 * @property {number} viewCount - View count
 * @property {number} likeCount - Like count
 * @property {number} commentCount - Comment count
 * @property {string} categoryId - Category ID
 */

/**
 * Get all video IDs from channel uploads playlist
 * @param {string} playlistId - Uploads playlist ID
 * @returns {Promise<string[]>} Array of video IDs
 */
async function getAllVideoIds(playlistId) {
    try {
        const youtube = getYouTubeClient();

        if (!playlistId) {
            throw new Error('Playlist ID is required');
        }

        const videoIds = [];
        let nextPageToken = '';

        do {
            const response = await youtube.playlistItems.list({
                part: ['snippet'],
                playlistId: playlistId,
                maxResults: 50,
                pageToken: nextPageToken || undefined
            });

            if (response.data.items) {
                const pageVideoIds = response.data.items
                    .filter(item => item.snippet?.resourceId?.videoId)
                    .map(item => item.snippet.resourceId.videoId);
                videoIds.push(...pageVideoIds);
            }

            nextPageToken = response.data.nextPageToken || '';
            
            // Add delay to respect rate limits
            await delay(100);

        } while (nextPageToken);

        return videoIds;

    } catch (error) {
        console.error('Get all video IDs error:', error);
        if (error.code === 403) {
            throw new Error('YouTube API quota exceeded or invalid API key');
        }
        throw new Error(`Failed to get video IDs: ${error.message}`);
    } finally {
        console.log(`Retrieved video IDs from playlist: ${playlistId}`);
    }
}

/**
 * Get detailed video information for multiple videos
 * @param {string[]} videoIds - Array of video IDs
 * @param {Function} [progressCallback] - Progress callback function
 * @returns {Promise<VideoData[]>} Array of video data
 */
async function getVideoDetails(videoIds, progressCallback = null) {
    try {
        const youtube = getYouTubeClient();

        if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
            return [];
        }

        const videos = [];
        const batchSize = 50; // YouTube API allows up to 50 IDs per request
        const totalBatches = Math.ceil(videoIds.length / batchSize);

        for (let i = 0; i < videoIds.length; i += batchSize) {
            const batchVideoIds = videoIds.slice(i, i + batchSize);
            const currentBatch = Math.floor(i / batchSize) + 1;

            const response = await youtube.videos.list({
                part: ['snippet', 'statistics', 'contentDetails'],
                id: batchVideoIds,
                maxResults: batchSize
            });

            if (response.data.items) {
                const batchVideos = response.data.items.map(parseVideoData);
                videos.push(...batchVideos);
            }

            // Update progress
            if (progressCallback && typeof progressCallback === 'function') {
                const progress = currentBatch / totalBatches;
                progressCallback(progress);
            }

            // Add delay to respect rate limits
            await delay(200);
        }

        return videos;

    } catch (error) {
        console.error('Get video details error:', error);
        if (error.code === 403) {
            throw new Error('YouTube API quota exceeded or invalid API key');
        }
        throw new Error(`Failed to get video details: ${error.message}`);
    } finally {
        console.log(`Retrieved details for ${videoIds.length} videos`);
    }
}

/**
 * Parse raw YouTube video data into our format
 * @param {Object} videoItem - Raw YouTube API video item
 * @returns {VideoData} Parsed video data
 */
function parseVideoData(videoItem) {
    try {
        const snippet = videoItem.snippet || {};
        const statistics = videoItem.statistics || {};
        const contentDetails = videoItem.contentDetails || {};

        return {
            id: videoItem.id || 'unknown',
            title: snippet.title || 'Untitled',
            description: snippet.description || '',
            thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
            videoUrl: `https://www.youtube.com/watch?v=${videoItem.id}`,
            uploadDate: snippet.publishedAt || new Date().toISOString(),
            duration: contentDetails.duration || 'PT0S',
            viewCount: parseInt(statistics.viewCount, 10) || 0,
            likeCount: parseInt(statistics.likeCount, 10) || 0,
            commentCount: parseInt(statistics.commentCount, 10) || 0,
            categoryId: snippet.categoryId || '0'
        };

    } catch (error) {
        console.error('Parse video data error:', error);
        return {
            id: videoItem.id || 'unknown',
            title: 'Error parsing video data',
            description: '',
            thumbnailUrl: '',
            videoUrl: `https://www.youtube.com/watch?v=${videoItem.id || 'unknown'}`,
            uploadDate: new Date().toISOString(),
            duration: 'PT0S',
            viewCount: 0,
            likeCount: 0,
            commentCount: 0,
            categoryId: '0'
        };
    } finally {
        console.log(`Video data parsed for ID: ${videoItem.id}`);
    }
}

module.exports = {
    getAllVideoIds,
    getVideoDetails,
    parseVideoData
};