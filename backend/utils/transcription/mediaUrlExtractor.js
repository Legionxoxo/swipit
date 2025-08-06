/**
 * @fileoverview Media URL extractor for video transcription
 * @author Backend Team
 */

const { spawn } = require('child_process');
const path = require('path');

/**
 * @typedef {Object} MediaUrlResult
 * @property {boolean} success - Success status
 * @property {string} [audioUrl] - Direct audio URL
 * @property {string} [error] - Error message
 * @property {string} [message] - Status message
 */

/**
 * Extract direct audio URL from YouTube video using yt-dlp
 * @param {string} videoUrl - YouTube video URL
 * @returns {Promise<MediaUrlResult>}
 */
async function extractYouTubeAudioUrl(videoUrl) {
    try {
        if (!videoUrl || !videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
            return {
                success: false,
                error: 'Invalid YouTube URL',
                message: 'URL must be a valid YouTube link'
            };
        }

        // Use yt-dlp to extract direct audio URL
        const audioUrl = await new Promise((resolve, reject) => {
            const ytdlp = spawn('yt-dlp', [
                '--get-url',
                '--format', 'bestaudio[ext=m4a]/bestaudio[ext=mp3]/bestaudio',
                '--no-playlist',
                videoUrl
            ]);

            let output = '';
            let error = '';

            ytdlp.stdout.on('data', (data) => {
                output += data.toString();
            });

            ytdlp.stderr.on('data', (data) => {
                error += data.toString();
            });

            ytdlp.on('close', (code) => {
                if (code === 0 && output.trim()) {
                    resolve(output.trim());
                } else {
                    reject(new Error(error || 'Failed to extract audio URL'));
                }
            });

            ytdlp.on('error', (err) => {
                reject(err);
            });
        });

        return {
            success: true,
            audioUrl,
            message: 'Audio URL extracted successfully'
        };

    } catch (error) {
        console.error('YouTube audio URL extraction error:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to extract YouTube audio URL'
        };
    } finally {
        console.log(`YouTube URL processing attempted for: ${videoUrl}`);
    }
}

/**
 * Extract direct audio URL from Instagram video
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

        // Use yt-dlp for Instagram as well
        const audioUrl = await new Promise((resolve, reject) => {
            const ytdlp = spawn('yt-dlp', [
                '--get-url',
                '--format', 'bestaudio[ext=m4a]/bestaudio[ext=mp3]/bestaudio',
                '--no-playlist',
                videoUrl
            ]);

            let output = '';
            let error = '';

            ytdlp.stdout.on('data', (data) => {
                output += data.toString();
            });

            ytdlp.stderr.on('data', (data) => {
                error += data.toString();
            });

            ytdlp.on('close', (code) => {
                if (code === 0 && output.trim()) {
                    resolve(output.trim());
                } else {
                    reject(new Error(error || 'Failed to extract audio URL'));
                }
            });

            ytdlp.on('error', (err) => {
                reject(err);
            });
        });

        return {
            success: true,
            audioUrl,
            message: 'Audio URL extracted successfully'
        };

    } catch (error) {
        console.error('Instagram audio URL extraction error:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to extract Instagram audio URL'
        };
    } finally {
        console.log(`Instagram URL processing attempted for: ${videoUrl}`);
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
 * Check if yt-dlp is available
 * @returns {Promise<boolean>}
 */
async function checkYtDlpAvailability() {
    try {
        return await new Promise((resolve) => {
            const ytdlp = spawn('yt-dlp', ['--version']);
            
            ytdlp.on('close', (code) => {
                resolve(code === 0);
            });
            
            ytdlp.on('error', () => {
                resolve(false);
            });
        });
    } catch (error) {
        console.error('yt-dlp availability check error:', error);
        return false;
    } finally {
        console.log('yt-dlp availability check completed');
    }
}

module.exports = {
    extractAudioUrl,
    extractYouTubeAudioUrl,
    extractInstagramAudioUrl,
    checkYtDlpAvailability
};