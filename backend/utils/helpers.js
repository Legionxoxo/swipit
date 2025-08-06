/**
 * @fileoverview Helper utility functions
 * @author Backend Team
 */

const { v4: uuidv4 } = require('uuid');

/**
 * @typedef {Object} ChannelParseResult
 * @property {string} channelId - YouTube channel ID
 * @property {string} channelType - Type of channel URL (id, username, handle)
 * @property {string} originalUrl - Original URL provided
 */

/**
 * Generate unique analysis ID
 * @returns {string} Unique analysis ID
 */
function generateAnalysisId() {
    try {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substr(2, 9);
        return `analysis_${timestamp}_${randomPart}`;
    } catch (error) {
        console.error('Generate analysis ID error:', error);
        return `analysis_${Date.now()}_${Math.random()}`;
    }
}

/**
 * Parse YouTube channel URL to extract channel ID
 * @param {string} channelUrl - YouTube channel URL
 * @returns {Promise<ChannelParseResult>} Parsed channel information
 */
async function parseChannelUrl(channelUrl) {
    try {
        if (!channelUrl) {
            throw new Error('Channel URL is required');
        }

        const url = channelUrl.trim();
        
        // Direct channel ID format: https://youtube.com/channel/UCxxxxx
        const channelIdMatch = url.match(/(?:youtube\.com\/channel\/)([a-zA-Z0-9_-]{24})/);
        if (channelIdMatch) {
            return {
                channelId: channelIdMatch[1],
                channelType: 'id',
                originalUrl: url
            };
        }

        // Handle format: https://youtube.com/@username
        const handleMatch = url.match(/(?:youtube\.com\/@)([a-zA-Z0-9_.-]+)/);
        if (handleMatch) {
            // For handles, we need to resolve them to channel ID using the API
            const channelId = await resolveHandleToChannelId(handleMatch[1]);
            return {
                channelId: channelId,
                channelType: 'handle',
                originalUrl: url
            };
        }

        // Legacy username format: https://youtube.com/user/username
        const userMatch = url.match(/(?:youtube\.com\/user\/)([a-zA-Z0-9_.-]+)/);
        if (userMatch) {
            const channelId = await resolveUsernameToChannelId(userMatch[1]);
            return {
                channelId: channelId,
                channelType: 'username',
                originalUrl: url
            };
        }

        // Custom URL format: https://youtube.com/c/customname
        const customMatch = url.match(/(?:youtube\.com\/c\/)([a-zA-Z0-9_.-]+)/);
        if (customMatch) {
            const channelId = await resolveCustomUrlToChannelId(customMatch[1]);
            return {
                channelId: channelId,
                channelType: 'custom',
                originalUrl: url
            };
        }

        throw new Error('Invalid YouTube channel URL format. Supported formats: /channel/ID, /@handle, /user/username, /c/customname');

    } catch (error) {
        console.error('Parse channel URL error:', error);
        throw new Error(`Failed to parse channel URL: ${error.message}`);
    } finally {
        console.log(`Channel URL parsed: ${channelUrl}`);
    }
}

/**
 * Resolve YouTube handle to channel ID
 * @param {string} handle - YouTube handle (without @)
 * @returns {Promise<string>} Channel ID
 */
async function resolveHandleToChannelId(handle) {
    try {
        const { google } = require('googleapis');
        const youtube = google.youtube({
            version: 'v3',
            auth: process.env.YOUTUBE_API_KEY
        });

        // Try to search for the channel by handle
        const searchResponse = await youtube.search.list({
            part: ['snippet'],
            q: `@${handle}`,
            type: 'channel',
            maxResults: 1
        });

        if (searchResponse.data.items && searchResponse.data.items.length > 0) {
            return searchResponse.data.items[0].snippet.channelId;
        }

        throw new Error(`Could not resolve handle @${handle} to channel ID`);

    } catch (error) {
        console.error('Resolve handle error:', error);
        throw new Error(`Failed to resolve handle @${handle}: ${error.message}`);
    }
}

/**
 * Resolve YouTube username to channel ID
 * @param {string} username - YouTube username
 * @returns {Promise<string>} Channel ID
 */
async function resolveUsernameToChannelId(username) {
    try {
        const { google } = require('googleapis');
        const youtube = google.youtube({
            version: 'v3',
            auth: process.env.YOUTUBE_API_KEY
        });

        const response = await youtube.channels.list({
            part: ['snippet'],
            forUsername: username,
            maxResults: 1
        });

        if (response.data.items && response.data.items.length > 0) {
            return response.data.items[0].id;
        }

        throw new Error(`Could not resolve username ${username} to channel ID`);

    } catch (error) {
        console.error('Resolve username error:', error);
        throw new Error(`Failed to resolve username ${username}: ${error.message}`);
    }
}

/**
 * Resolve custom URL to channel ID
 * @param {string} customName - Custom URL name
 * @returns {Promise<string>} Channel ID
 */
async function resolveCustomUrlToChannelId(customName) {
    try {
        const { google } = require('googleapis');
        const youtube = google.youtube({
            version: 'v3',
            auth: process.env.YOUTUBE_API_KEY
        });

        // Search for the custom name
        const searchResponse = await youtube.search.list({
            part: ['snippet'],
            q: customName,
            type: 'channel',
            maxResults: 10
        });

        if (searchResponse.data.items) {
            // Try to find exact match by custom URL
            for (const item of searchResponse.data.items) {
                const channelResponse = await youtube.channels.list({
                    part: ['snippet'],
                    id: [item.snippet.channelId]
                });

                if (channelResponse.data.items && channelResponse.data.items.length > 0) {
                    const channel = channelResponse.data.items[0];
                    const customUrl = channel.snippet.customUrl;
                    
                    if (customUrl && customUrl.toLowerCase().includes(customName.toLowerCase())) {
                        return channel.id;
                    }
                }
            }
        }

        throw new Error(`Could not resolve custom URL ${customName} to channel ID`);

    } catch (error) {
        console.error('Resolve custom URL error:', error);
        throw new Error(`Failed to resolve custom URL ${customName}: ${error.message}`);
    }
}

/**
 * Validate YouTube API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} Whether the API key format is valid
 */
function validateApiKeyFormat(apiKey) {
    try {
        if (!apiKey || typeof apiKey !== 'string') {
            return false;
        }

        // YouTube API keys are typically 39 characters long and start with "AIza"
        const apiKeyPattern = /^AIza[0-9A-Za-z_-]{35}$/;
        return apiKeyPattern.test(apiKey);

    } catch (error) {
        console.error('Validate API key format error:', error);
        return false;
    }
}

/**
 * Format duration from YouTube API format (PT1H2M3S) to readable format
 * @param {string} isoDuration - ISO 8601 duration string
 * @returns {string} Formatted duration (e.g., "1:02:03")
 */
function formatDuration(isoDuration) {
    try {
        if (!isoDuration || typeof isoDuration !== 'string') {
            return '0:00';
        }

        const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) {
            return '0:00';
        }

        const hours = parseInt(match[1], 10) || 0;
        const minutes = parseInt(match[2], 10) || 0;
        const seconds = parseInt(match[3], 10) || 0;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

    } catch (error) {
        console.error('Format duration error:', error);
        return '0:00';
    }
}

/**
 * Format large numbers with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
function formatNumber(num) {
    try {
        if (typeof num !== 'number' || isNaN(num)) {
            return '0';
        }

        return num.toLocaleString();

    } catch (error) {
        console.error('Format number error:', error);
        return String(num);
    }
}

/**
 * Sanitize filename for safe file system usage
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
    try {
        if (!filename || typeof filename !== 'string') {
            return 'untitled';
        }

        // Remove or replace invalid characters
        return filename
            .replace(/[<>:"/\\|?*]/g, '_')
            .replace(/\s+/g, '_')
            .substring(0, 100)
            .toLowerCase();

    } catch (error) {
        console.error('Sanitize filename error:', error);
        return 'untitled';
    }
}

module.exports = {
    generateAnalysisId,
    parseChannelUrl,
    resolveHandleToChannelId,
    resolveUsernameToChannelId,
    resolveCustomUrlToChannelId,
    validateApiKeyFormat,
    formatDuration,
    formatNumber,
    sanitizeFilename
};