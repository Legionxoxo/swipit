/**
 * @fileoverview YouTube channel resolution utilities
 * @author Backend Team
 */

const { google } = require('googleapis');

/**
 * @typedef {Object} ChannelParseResult
 * @property {string} channelId - YouTube channel ID
 * @property {string} channelType - Type of channel URL (id, username, handle)
 * @property {string} originalUrl - Original URL provided
 */

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
        const youtube = google.youtube({
            version: 'v3',
            auth: process.env.YOUTUBE_API_KEY
        });

        const searchResponse = await youtube.search.list({
            part: 'snippet',
            q: `@${handle}`,
            type: 'channel',
            maxResults: 1
        });

        if (searchResponse.data && searchResponse.data.items && searchResponse.data.items.length > 0) {
            const channelId = searchResponse.data.items[0].snippet?.channelId;
            if (channelId) {
                return channelId;
            }
        }

        throw new Error(`Could not resolve handle @${handle} to channel ID`);

    } catch (error) {
        console.error('Resolve handle error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to resolve handle @${handle}: ${errorMessage}`);
    } finally {
        console.log(`Handle resolution attempted for @${handle}`);
    }
}

/**
 * Resolve YouTube username to channel ID
 * @param {string} username - YouTube username
 * @returns {Promise<string>} Channel ID
 */
async function resolveUsernameToChannelId(username) {
    try {
        const youtube = google.youtube({
            version: 'v3',
            auth: process.env.YOUTUBE_API_KEY
        });

        const response = await youtube.channels.list({
            part: 'snippet',
            forUsername: username,
            maxResults: 1
        });

        if (response.data && response.data.items && response.data.items.length > 0) {
            const channelId = response.data.items[0].id;
            if (channelId) {
                return channelId;
            }
        }

        throw new Error(`Could not resolve username ${username} to channel ID`);

    } catch (error) {
        console.error('Resolve username error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to resolve username ${username}: ${errorMessage}`);
    } finally {
        console.log(`Username resolution attempted for ${username}`);
    }
}

/**
 * Resolve custom URL to channel ID
 * @param {string} customName - Custom URL name
 * @returns {Promise<string>} Channel ID
 */
async function resolveCustomUrlToChannelId(customName) {
    try {
        const youtube = google.youtube({
            version: 'v3',
            auth: process.env.YOUTUBE_API_KEY
        });

        const searchResponse = await youtube.search.list({
            part: 'snippet',
            q: customName,
            type: 'channel',
            maxResults: 10
        });

        if (searchResponse.data && searchResponse.data.items) {
            for (const item of searchResponse.data.items) {
                if (item.snippet?.channelId) {
                    const channelResponse = await youtube.channels.list({
                        part: 'snippet',
                        id: item.snippet.channelId
                    });

                    if (channelResponse.data && channelResponse.data.items && channelResponse.data.items.length > 0) {
                        const channel = channelResponse.data.items[0];
                        const customUrl = channel.snippet?.customUrl;
                        
                        if (customUrl && customUrl.toLowerCase().includes(customName.toLowerCase())) {
                            const channelId = channel.id;
                            if (channelId) {
                                return channelId;
                            }
                        }
                    }
                }
            }
        }

        throw new Error(`Could not resolve custom URL ${customName} to channel ID`);

    } catch (error) {
        console.error('Resolve custom URL error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to resolve custom URL ${customName}: ${errorMessage}`);
    } finally {
        console.log(`Custom URL resolution attempted for ${customName}`);
    }
}

module.exports = {
    parseChannelUrl,
    resolveHandleToChannelId,
    resolveUsernameToChannelId,
    resolveCustomUrlToChannelId
};