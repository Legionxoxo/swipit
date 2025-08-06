/**
 * @fileoverview Video transcription service
 * @author Backend Team
 */

const assemblyService = require('./assemblyService');
const { getDatabase } = require('../../database/connection');
const { generateAnalysisId } = require('../helpers');
const { extractAudioUrl } = require('./videoUrlExtractor');
const { downloadAndUploadAudio } = require('./audioUploader');

/**
 * @typedef {Object} VideoData
 * @property {string} video_id - Video ID
 * @property {string} video_url - Video URL
 * @property {string} video_title - Video title
 * @property {string} video_duration - Video duration
 * @property {string} video_thumbnail_url - Video thumbnail URL
 * @property {string} platform - Platform (youtube/instagram)
 */

/**
 * @typedef {Object} TranscriptionServiceResult
 * @property {boolean} success - Success status
 * @property {string} [transcriptionId] - Generated transcription ID
 * @property {VideoData} [videoData] - Video metadata
 * @property {string} [assemblyJobId] - AssemblyAI job ID
 * @property {Object} [transcriptionData] - Transcription results
 * @property {string} [error] - Error message
 * @property {string} [message] - Status message
 */

/**
 * Get video data from database by video ID and platform
 * @param {string} videoId - Video ID
 * @param {string} platform - Platform (youtube/instagram)
 * @returns {Promise<TranscriptionServiceResult>}
 */
async function getVideoData(videoId, platform) {
    try {
        const db = await getDatabase();
        let videoData = null;

        if (platform === 'youtube') {
            const result = await db.get(`
                SELECT video_id, video_url, video_title, video_duration, video_thumbnail_url
                FROM youtube_data 
                WHERE video_id = ?
            `, [videoId]);
            
            if (result) {
                videoData = {
                    video_id: result.video_id,
                    video_url: result.video_url,
                    video_title: result.video_title,
                    video_duration: result.video_duration,
                    video_thumbnail_url: result.video_thumbnail_url,
                    platform: 'youtube'
                };
            }
        } else if (platform === 'instagram') {
            const result = await db.get(`
                SELECT reel_id as video_id, reel_url as video_url, reel_caption as video_title, 
                       duration as video_duration, thumbnail_url as video_thumbnail_url
                FROM instagram_data 
                WHERE reel_id = ?
            `, [videoId]);
            
            if (result) {
                videoData = {
                    video_id: result.video_id,
                    video_url: result.video_url,
                    video_title: result.video_title || `Instagram Reel ${videoId}`,
                    video_duration: result.video_duration || 'unknown',
                    video_thumbnail_url: result.video_thumbnail_url,
                    platform: 'instagram'
                };
            }
        }

        if (!videoData) {
            return {
                success: false,
                error: `Video not found in database: ${videoId} on ${platform}`,
                message: 'Video data not found'
            };
        }

        return {
            success: true,
            videoData,
            message: 'Video data retrieved successfully'
        };

    } catch (error) {
        console.error('Get video data error:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to retrieve video data'
        };
    } finally {
        console.log(`Video data lookup: ${videoId} on ${platform}`);
    }
}

/**
 * Start transcription process
 * @param {Object} jobData - Job data
 * @param {string} jobData.userId - User ID
 * @param {string} jobData.videoId - Video ID
 * @param {string} jobData.platform - Platform (youtube/instagram)
 * @returns {Promise<TranscriptionServiceResult>}
 */
async function startTranscriptionProcess(jobData) {
    try {
        const { userId, videoId, platform } = jobData;

        const transcriptionId = generateAnalysisId();

        const videoResult = await getVideoData(videoId, platform);
        if (!videoResult.success) {
            return videoResult;
        }

        const { videoData } = videoResult;

        if (!videoData.video_url) {
            return {
                success: false,
                error: 'Video URL not available',
                message: 'Cannot transcribe video without URL'
            };
        }

        let audioUrl;

        if (platform === 'youtube') {
            // For YouTube, download and upload to AssemblyAI to avoid URL access issues
            console.log('Using download-and-upload method for YouTube video...');
            const uploadResult = await downloadAndUploadAudio(videoData.video_url, process.env.ASSEMBLY_API_KEY);
            
            if (!uploadResult.success) {
                return {
                    success: false,
                    error: uploadResult.error || 'Failed to upload audio',
                    message: 'Cannot upload audio to AssemblyAI. The video may be private or unavailable.'
                };
            }
            
            audioUrl = uploadResult.uploadUrl;
        } else {
            // For other platforms, try direct URL extraction
            const audioUrlResult = await extractAudioUrl(videoData.video_url, platform);
            
            if (!audioUrlResult.success) {
                return {
                    success: false,
                    error: audioUrlResult.error || 'Failed to extract audio URL',
                    message: 'Cannot extract audio from video URL. The video may be private or unavailable.'
                };
            }
            
            audioUrl = audioUrlResult.audioUrl;
        }

        const assemblyResult = await assemblyService.submitTranscription(audioUrl, {
            autoHighlights: true,
            speakerLabels: false
        });

        if (!assemblyResult.success) {
            return {
                success: false,
                error: assemblyResult.error,
                message: 'Failed to submit transcription to AssemblyAI'
            };
        }

        return {
            success: true,
            transcriptionId,
            videoData,
            assemblyJobId: assemblyResult.assemblyJobId,
            message: 'Transcription process started successfully'
        };

    } catch (error) {
        console.error('Start transcription process error:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to start transcription process'
        };
    } finally {
        console.log(`Transcription process started for: ${jobData.videoId}`);
    }
}

/**
 * Process transcription with polling
 * @param {string} transcriptionId - Transcription ID
 * @param {string} assemblyJobId - AssemblyAI job ID
 * @param {Function} progressCallback - Progress callback
 * @returns {Promise<TranscriptionServiceResult>}
 */
async function processTranscription(transcriptionId, assemblyJobId, progressCallback) {
    try {
        const result = await assemblyService.pollTranscription(
            assemblyJobId,
            progressCallback,
            5000,
            120
        );

        if (!result.success) {
            return {
                success: false,
                error: result.error,
                message: 'AssemblyAI transcription failed'
            };
        }

        if (result.status !== 'completed') {
            return {
                success: false,
                error: `Unexpected transcription status: ${result.status}`,
                message: 'Transcription did not complete successfully'
            };
        }

        const transcriptionData = {
            rawTranscript: result.text || '',
            formattedTranscript: formatTranscript(result.text || ''),
            languageDetected: result.language || 'unknown',
            confidenceScore: result.confidence || 0,
            words: result.words || []
        };

        return {
            success: true,
            transcriptionData,
            message: 'Transcription completed successfully'
        };

    } catch (error) {
        console.error('Process transcription error:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to process transcription'
        };
    } finally {
        console.log(`Transcription processing completed for: ${transcriptionId}`);
    }
}

/**
 * Format transcript text with proper punctuation and paragraphs
 * @param {string} rawText - Raw transcript text
 * @returns {string} Formatted transcript
 */
function formatTranscript(rawText) {
    try {
        if (!rawText || typeof rawText !== 'string') {
            return '';
        }

        let formatted = rawText;

        // Basic cleaning
        formatted = formatted.trim();

        // Remove excessive whitespace
        formatted = formatted.replace(/\s+/g, ' ');

        // Add proper sentence spacing
        formatted = formatted.replace(/([.!?])\s*([A-Z])/g, '$1 $2');

        // Create paragraphs at longer pauses or topic changes
        formatted = formatted.replace(/\.\s+([A-Z][a-z]{2,})/g, '.\n\n$1');

        // Fix common transcript issues
        formatted = formatted.replace(/\b(um|uh|ah)\b,?\s*/gi, '');
        formatted = formatted.replace(/\s*,\s*,\s*/g, ', ');
        formatted = formatted.replace(/\s*\.\s*\.\s*/g, '. ');

        // Ensure proper capitalization at sentence starts
        formatted = formatted.replace(/(^|[.!?]\s+)([a-z])/g, (match, p1, p2) => {
            return p1 + p2.toUpperCase();
        });

        // Clean up multiple line breaks
        formatted = formatted.replace(/\n{3,}/g, '\n\n');

        return formatted.trim();

    } catch (error) {
        console.error('Format transcript error:', error);
        return rawText || '';
    } finally {
        console.log('Transcript formatting completed');
    }
}

/**
 * Calculate processing time estimate
 * @param {string} duration - Video duration
 * @returns {number} Estimated processing time in seconds
 */
function calculateProcessingEstimate(duration) {
    try {
        if (!duration || duration === 'unknown') {
            return 180;
        }

        const parts = duration.split(':');
        let totalSeconds = 0;

        if (parts.length === 3) {
            totalSeconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
        } else if (parts.length === 2) {
            totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        } else {
            totalSeconds = parseInt(duration) || 180;
        }

        return Math.max(60, Math.min(totalSeconds * 0.5, 600));

    } catch (error) {
        console.error('Calculate processing estimate error:', error);
        return 180;
    } finally {
        console.log(`Processing estimate calculated for duration: ${duration}`);
    }
}

module.exports = {
    getVideoData,
    startTranscriptionProcess,
    processTranscription,
    formatTranscript,
    calculateProcessingEstimate
};