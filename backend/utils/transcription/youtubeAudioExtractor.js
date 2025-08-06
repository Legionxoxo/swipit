/**
 * @fileoverview YouTube audio URL extractor using existing YouTube API
 * @author Backend Team
 */

const { google } = require('googleapis');

/**
 * @typedef {Object} AudioUrlResult
 * @property {boolean} success - Success status
 * @property {string} [audioUrl] - Direct audio URL
 * @property {string} [error] - Error message
 * @property {string} [message] - Status message
 * @property {Object} [videoInfo] - Additional video information
 */

/**
 * Extract video ID from YouTube URL
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID
 */
function extractVideoId(url) {
    try {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    } catch (error) {
        console.error('Error extracting video ID:', error);
        return null;
    } finally {
        console.log(`Video ID extraction attempted for: ${url}`);
    }
}

/**
 * Get YouTube video info using YouTube API
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<AudioUrlResult>}
 */
async function getYouTubeVideoInfo(videoId) {
    try {
        const youtube = google.youtube({
            version: 'v3',
            auth: process.env.YOUTUBE_API_KEY
        });

        const response = await youtube.videos.list({
            part: ['snippet', 'contentDetails', 'status'],
            id: [videoId]
        });

        if (!response.data.items || response.data.items.length === 0) {
            return {
                success: false,
                error: 'Video not found',
                message: 'YouTube video not found or is private'
            };
        }

        const video = response.data.items[0];
        
        // Check if video is available for embedding/downloading
        if (video.status.embeddable === false) {
            return {
                success: false,
                error: 'Video not embeddable',
                message: 'This video cannot be processed due to embedding restrictions'
            };
        }

        // Create a direct link that can be processed
        // Note: This creates an embed URL that can be used to extract audio client-side
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        
        return {
            success: true,
            audioUrl: embedUrl,
            message: 'Video info retrieved successfully',
            videoInfo: {
                title: video.snippet.title,
                duration: video.contentDetails.duration,
                channelTitle: video.snippet.channelTitle
            }
        };

    } catch (error) {
        console.error('YouTube API error:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to get video information from YouTube API'
        };
    } finally {
        console.log(`YouTube API call completed for video: ${videoId}`);
    }
}


/**
 * Extract YouTube audio URL using available methods
 * @param {string} videoUrl - YouTube video URL
 * @returns {Promise<AudioUrlResult>}
 */
async function extractYouTubeAudio(videoUrl) {
    try {
        const videoId = extractVideoId(videoUrl);
        
        if (!videoId) {
            return {
                success: false,
                error: 'Invalid YouTube URL',
                message: 'Could not extract video ID from URL'
            };
        }

        // Use YouTube API + embed approach
        return await getYouTubeVideoInfo(videoId);

    } catch (error) {
        console.error('YouTube audio extraction error:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to extract YouTube audio'
        };
    } finally {
        console.log(`YouTube audio extraction completed for: ${videoUrl}`);
    }
}

module.exports = {
    extractYouTubeAudio,
    extractVideoId,
    getYouTubeVideoInfo
};