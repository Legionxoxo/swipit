/**
 * @fileoverview YouTube service - consolidated exports
 * @author Backend Team
 */

// Import YouTube service modules
const { initializeYouTubeService, testConnection, delay } = require('./youtube/apiClient');
const { getChannelInfo } = require('./youtube/channelService');
const { getAllVideoIds, getVideoDetails, parseVideoData } = require('./youtube/videoService');

/**
 * Re-export all YouTube service functions for backward compatibility
 */
module.exports = {
    initializeYouTubeService,
    getChannelInfo,
    getAllVideoIds,
    getVideoDetails,
    parseVideoData,
    testConnection,
    delay
};