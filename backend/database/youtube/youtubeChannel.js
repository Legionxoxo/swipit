/**
 * @fileoverview YouTube channel data management
 * @author Backend Team
 */

const { getDatabase } = require('../connection');

/**
 * @typedef {Object} YouTubeChannelData
 * @property {string} analysisId - Analysis ID
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
 * Store YouTube channel data in database
 * @param {string} analysisId - Analysis ID
 * @param {Object} channelData - Channel data object
 * @returns {Promise<Object>} Storage result
 */
async function storeChannelData(analysisId, channelData) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        if (!channelData || typeof channelData !== 'object') {
            throw new Error('Channel data object is required');
        }

        const {
            youtubeChannelId,
            channelName,
            channelUrl,
            subscriberCount = 0,
            videoCount = 0,
            creationDate,
            description,
            thumbnailUrl,
            uploadsPlaylistId
        } = channelData;

        if (!youtubeChannelId) {
            throw new Error('YouTube channel ID is required');
        }

        const db = await getDatabase();

        const result = await db.run(
            `UPDATE youtube_data 
             SET channel_name = ?, channel_subscriber_count = ?, channel_video_count = ?, 
                 channel_creation_date = ?, channel_description = ?, channel_thumbnail_url = ?,
                 channel_uploads_playlist_id = ?, updated_at = CURRENT_TIMESTAMP
             WHERE analysis_id = ? AND youtube_channel_id = ? AND video_id IS NULL`,
            [
                channelName, subscriberCount, videoCount, creationDate, description,
                thumbnailUrl, uploadsPlaylistId, analysisId, youtubeChannelId
            ]
        );

        return {
            success: result.changes > 0,
            changes: result.changes
        };

    } catch (error) {
        console.error('Store YouTube channel data error:', error);
        throw new Error(`Failed to store YouTube channel data: ${error.message}`);
    } finally {
        console.log(`YouTube channel data storage attempted for analysis: ${analysisId}`);
    }
}

/**
 * Get YouTube channel data by analysis ID
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<Object|null>} Channel data or null if not found
 */
async function getChannelData(analysisId) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        const db = await getDatabase();

        const channel = await db.get(
            `SELECT youtube_channel_id, channel_name, channel_url, channel_subscriber_count,
                    channel_video_count, channel_creation_date, channel_description,
                    channel_thumbnail_url, channel_uploads_playlist_id, created_at, updated_at
             FROM youtube_data 
             WHERE analysis_id = ? AND video_id IS NULL`,
            [analysisId]
        );

        if (!channel) {
            return null;
        }

        return {
            youtubeChannelId: channel.youtube_channel_id,
            channelName: channel.channel_name,
            channelUrl: channel.channel_url,
            subscriberCount: channel.channel_subscriber_count || 0,
            videoCount: channel.channel_video_count || 0,
            creationDate: channel.channel_creation_date,
            description: channel.channel_description,
            thumbnailUrl: channel.channel_thumbnail_url,
            uploadsPlaylistId: channel.channel_uploads_playlist_id,
            createdAt: new Date(channel.created_at),
            updatedAt: new Date(channel.updated_at)
        };

    } catch (error) {
        console.error('Get YouTube channel data error:', error);
        throw new Error(`Failed to get YouTube channel data: ${error.message}`);
    } finally {
        console.log(`YouTube channel data retrieval attempted for analysis: ${analysisId}`);
    }
}

module.exports = {
    storeChannelData,
    getChannelData
};