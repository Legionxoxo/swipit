/**
 * @fileoverview Video URL extractor using ytdl-core
 * @author Backend Team
 */

const ytdl = require('@distube/ytdl-core');

/**
 * @typedef {Object} MediaUrlResult
 * @property {boolean} success - Success status
 * @property {string} [audioUrl] - Direct audio URL
 * @property {string} [error] - Error message
 * @property {string} [message] - Status message
 * @property {Object} [metadata] - Additional metadata
 */

/**
 * Extract direct audio URL from YouTube video using ytdl-core
 * @param {string} videoUrl - YouTube video URL
 * @returns {Promise<MediaUrlResult>}
 */
async function extractYouTubeAudioUrl(videoUrl) {
    try {
        console.log(`Attempting to extract audio from YouTube URL: ${videoUrl}`);
        
        if (!videoUrl) {
            console.log('Error: No video URL provided');
            return {
                success: false,
                error: 'No video URL provided',
                message: 'Video URL is required'
            };
        }

        if (!ytdl.validateURL(videoUrl)) {
            console.log(`Error: Invalid YouTube URL format: ${videoUrl}`);
            return {
                success: false,
                error: 'Invalid YouTube URL',
                message: 'URL must be a valid YouTube video link'
            };
        }

        console.log('YouTube URL validation passed, getting video info...');

        // Get video info
        const info = await ytdl.getInfo(videoUrl);
        console.log(`Video info retrieved: ${info.videoDetails.title} (${info.videoDetails.lengthSeconds}s)`);
        
        // Get audio-only formats
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        console.log(`Found ${audioFormats.length} audio formats`);
        
        if (audioFormats.length === 0) {
            console.log('No audio-only formats found, trying all formats with audio...');
            // Fallback: try formats that have audio (including video+audio)
            const audioAvailableFormats = info.formats.filter(format => format.hasAudio);
            if (audioAvailableFormats.length === 0) {
                return {
                    success: false,
                    error: 'No audio formats available',
                    message: 'This video does not have any audio streams'
                };
            }
            audioFormats.push(...audioAvailableFormats);
        }

        // Sort by quality (highest bitrate first)
        audioFormats.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));

        // Get the best audio format (prefer mp4 with aac, then webm, then any)
        const bestAudio = audioFormats.find(format => 
            format.container === 'mp4' && format.audioCodec === 'aac'
        ) || audioFormats.find(format => 
            format.container === 'webm'
        ) || audioFormats[0]; // fallback to best available

        if (!bestAudio || !bestAudio.url) {
            console.log('Error: No valid audio URL found in formats');
            return {
                success: false,
                error: 'No valid audio URL found',
                message: 'Unable to extract audio stream URL'
            };
        }

        console.log(`Successfully extracted audio URL: format=${bestAudio.container}, bitrate=${bestAudio.audioBitrate}`);

        return {
            success: true,
            audioUrl: bestAudio.url,
            message: 'Audio URL extracted successfully',
            metadata: {
                title: info.videoDetails.title,
                duration: info.videoDetails.lengthSeconds,
                author: info.videoDetails.author.name,
                format: bestAudio.container,
                bitrate: bestAudio.audioBitrate,
                codec: bestAudio.audioCodec
            }
        };

    } catch (error) {
        console.error('YouTube audio URL extraction error:', error);
        
        // Handle specific ytdl-core errors
        if (error.statusCode === 410) {
            return {
                success: false,
                error: 'Video not available',
                message: 'This video is no longer available or has been removed'
            };
        } else if (error.statusCode === 403) {
            return {
                success: false,
                error: 'Access denied',
                message: 'This video is private or restricted'
            };
        } else if (error.message.includes('Sign in to confirm your age')) {
            return {
                success: false,
                error: 'Age restricted',
                message: 'This video requires age verification'
            };
        }

        return {
            success: false,
            error: error.message,
            message: 'Failed to extract YouTube audio URL'
        };
    } finally {
        console.log(`YouTube URL processing completed for: ${videoUrl}`);
    }
}

/**
 * Extract Instagram video URL (fallback to original for now)
 * @param {string} videoUrl - Instagram video URL
 * @returns {Promise<MediaUrlResult>}
 */
async function extractInstagramAudioUrl(videoUrl) {
    try {
        if (!videoUrl || !videoUrl.includes('instagram.com')) {
            return {
                success: false,
                error: 'Invalid Instagram URL',
                message: 'URL must be a valid Instagram link'
            };
        }

        // For now, return the original URL and let AssemblyAI try to process it
        // TODO: Implement proper Instagram video extraction
        return {
            success: true,
            audioUrl: videoUrl,
            message: 'Using original Instagram URL - AssemblyAI may process it directly'
        };

    } catch (error) {
        console.error('Instagram audio URL extraction error:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to process Instagram URL'
        };
    } finally {
        console.log(`Instagram URL processing completed for: ${videoUrl}`);
    }
}

/**
 * Extract audio URL based on platform
 * @param {string} videoUrl - Video URL
 * @param {string} platform - Platform (youtube/instagram)
 * @returns {Promise<MediaUrlResult>}
 */
async function extractAudioUrl(videoUrl, platform) {
    try {
        if (!videoUrl) {
            return {
                success: false,
                error: 'Video URL is required',
                message: 'Missing video URL'
            };
        }

        if (!platform) {
            return {
                success: false,
                error: 'Platform is required',
                message: 'Missing platform information'
            };
        }

        switch (platform.toLowerCase()) {
            case 'youtube':
                return await extractYouTubeAudioUrl(videoUrl);
            case 'instagram':
                return await extractInstagramAudioUrl(videoUrl);
            default:
                return {
                    success: false,
                    error: `Unsupported platform: ${platform}`,
                    message: 'Platform not supported for transcription'
                };
        }

    } catch (error) {
        console.error('Audio URL extraction error:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to extract audio URL'
        };
    } finally {
        console.log(`Audio URL extraction completed for platform: ${platform}`);
    }
}

/**
 * Test if a video URL is valid and accessible
 * @param {string} videoUrl - Video URL to test
 * @param {string} platform - Platform type
 * @returns {Promise<boolean>}
 */
async function testVideoUrl(videoUrl, platform) {
    try {
        if (platform === 'youtube') {
            return ytdl.validateURL(videoUrl);
        }
        
        // For other platforms, basic URL validation
        return videoUrl.includes(`${platform}.com`);
        
    } catch (error) {
        console.error('Video URL test error:', error);
        return false;
    } finally {
        console.log(`Video URL test completed for: ${videoUrl}`);
    }
}

module.exports = {
    extractAudioUrl,
    extractYouTubeAudioUrl,
    extractInstagramAudioUrl,
    testVideoUrl
};