/**
 * @fileoverview YouTube channel service functions
 * @author Backend Team
 */

const { getYouTubeClient } = require('./apiClient');

/**
 * @typedef {Object} ChannelInfo
 * @property {string} youtubeChannelId - YouTube channel ID
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
 * Get channel information
 * @param {string} channelId - YouTube channel ID
 * @returns {Promise<ChannelInfo>} Channel information
 */
async function getChannelInfo(channelId) {
    try {
        const youtube = getYouTubeClient();

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
        const snippet = channel.snippet || {};
        const statistics = channel.statistics || {};
        const contentDetails = channel.contentDetails || {};

        return {
            youtubeChannelId: channel.id,
            channelName: snippet.title || 'Unknown Channel',
            channelUrl: `https://youtube.com/channel/${channel.id}`,
            subscriberCount: parseInt(statistics.subscriberCount, 10) || 0,
            videoCount: parseInt(statistics.videoCount, 10) || 0,
            creationDate: snippet.publishedAt || new Date().toISOString(),
            description: snippet.description || '',
            thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
            uploadsPlaylistId: contentDetails.relatedPlaylists?.uploads || ''
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

module.exports = {
    getChannelInfo
};