/**
 * @fileoverview YouTube API client initialization and connection testing
 * @author Backend Team
 */

const { google } = require('googleapis');

/**
 * @typedef {Object} YouTubeConfig
 * @property {string} apiKey - YouTube API key
 * @property {string} version - API version
 */

// Global YouTube API client
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
 * Get YouTube API client instance
 * @returns {Object} YouTube API client
 */
function getYouTubeClient() {
    try {
        if (!youtube) {
            initializeYouTubeService();
        }
        return youtube;
    } catch (error) {
        console.error('Get YouTube client error:', error);
        throw error;
    } finally {
        console.log('YouTube client retrieved');
    }
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

        // Test with a simple API call using a known public channel
        await youtube.channels.list({
            part: ['snippet'],
            id: ['UCuAXFkgsw1L7xaCfnd5JJOw'],
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

/**
 * Utility delay function for rate limiting
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function delay(ms) {
    try {
        if (typeof ms !== 'number' || ms < 0) {
            throw new Error('Delay time must be a positive number');
        }
        return new Promise(resolve => setTimeout(resolve, ms));
    } catch (error) {
        console.error('Delay function error:', error);
        return Promise.resolve();
    } finally {
        console.log(`Delay set for ${ms}ms`);
    }
}

module.exports = {
    initializeYouTubeService,
    getYouTubeClient,
    testConnection,
    delay
};