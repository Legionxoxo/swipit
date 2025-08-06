/**
 * @fileoverview YouTube API service utilities
 * @author Backend Team
 */

const { google } = require('googleapis');

/**
 * @typedef {Object} YouTubeConfig
 * @property {string} apiKey - YouTube API key
 * @property {string} version - API version
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
 * @property {string} uploadsPlaylistId - Uploads playlist ID
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

// Initialize YouTube API client
let youtube = null;

/**
 * Initialize YouTube service
 * @returns {void}
 */
function initializeYouTubeService() {
    try {
        if (!process.env.YOUTUBE_API_KEY) {
            throw new Error('YOUTUBE_API_KEY environment variable is required');
        }

        youtube = google.youtube({
            version: 'v3',
            auth: process.env.YOUTUBE_API_KEY
        });

    } catch (error) {
        console.error('YouTube service initialization error:', error);
        throw error;
    } finally {
        console.log('YouTube service initialized');
    }
}

/**
 * Get channel information
 * @param {string} channelId - YouTube channel ID
 * @returns {Promise<ChannelInfo>} Channel information
 */
async function getChannelInfo(channelId) {
    try {
        if (!youtube) {
            initializeYouTubeService();
        }

        if (!channelId) {
            throw new Error('Channel ID is required');
        }

        const response = await youtube.channels.list({
            part: ['snippet', 'statistics', 'contentDetails'],
            id: [channelId],
            maxResults: 1
        });

        if (!response.data.items || response.data.items.length === 0) {
            throw new Error('Channel not found or not accessible');
        }

        const channel = response.data.items[0];
        const snippet = channel.snippet;
        const statistics = channel.statistics;
        const contentDetails = channel.contentDetails;

        return {
            channelId: channel.id,
            channelName: snippet.title,
            channelUrl: `https://youtube.com/channel/${channel.id}`,
            subscriberCount: parseInt(statistics.subscriberCount, 10) || 0,
            videoCount: parseInt(statistics.videoCount, 10) || 0,
            creationDate: snippet.publishedAt,
            description: snippet.description || '',
            thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
            uploadsPlaylistId: contentDetails.relatedPlaylists.uploads
        };

    } catch (error) {
        console.error('Get channel info error:', error);
        if (error.code === 403) {
            throw new Error('YouTube API quota exceeded or invalid API key');
        }
        throw new Error(`Failed to get channel info: ${error.message}`);
    } finally {
        console.log(`Channel info retrieved for: ${channelId}`);
    }
}

/**
 * Get all video IDs from channel uploads playlist
 * @param {string} playlistId - Uploads playlist ID
 * @returns {Promise<string[]>} Array of video IDs
 */
async function getAllVideoIds(playlistId) {
    try {
        if (!youtube) {
            initializeYouTubeService();
        }

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
                const pageVideoIds = response.data.items.map(item => item.snippet.resourceId.videoId);
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
        if (!youtube) {
            initializeYouTubeService();
        }

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
        const snippet = videoItem.snippet;
        const statistics = videoItem.statistics;
        const contentDetails = videoItem.contentDetails;

        return {
            id: videoItem.id,
            title: snippet.title || 'Untitled',
            description: snippet.description || '',
            thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
            uploadDate: snippet.publishedAt,
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
            uploadDate: new Date().toISOString(),
            duration: 'PT0S',
            viewCount: 0,
            likeCount: 0,
            commentCount: 0,
            categoryId: '0'
        };
    }
}

/**
 * Utility delay function
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test YouTube API connection
 * @returns {Promise<boolean>} Connection status
 */
async function testConnection() {
    try {
        if (!youtube) {
            initializeYouTubeService();
        }

        // Test with a simple API call
        await youtube.channels.list({
            part: ['snippet'],
            id: ['UCuAXFkgsw1L7xaCfnd5JJOw'], // Random public channel ID
            maxResults: 1
        });

        return true;

    } catch (error) {
        console.error('YouTube API connection test failed:', error);
        return false;
    } finally {
        console.log('YouTube API connection tested');
    }
}

module.exports = {
    initializeYouTubeService,
    getChannelInfo,
    getAllVideoIds,
    getVideoDetails,
    parseVideoData,
    testConnection,
    delay
};