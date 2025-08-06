/**
 * @fileoverview AssemblyAI service for video transcription
 * @author Backend Team
 */

const ASSEMBLY_API_KEY = process.env.ASSEMBLY_API_KEY;

/**
 * @typedef {Object} AssemblyTranscriptJob
 * @property {string} id - AssemblyAI job ID
 * @property {string} status - Job status
 * @property {string} audio_url - Audio URL being processed
 * @property {number} [confidence] - Overall confidence score
 * @property {string} [text] - Transcribed text
 * @property {Array} [words] - Word-level timestamps and confidence
 * @property {string} [language_code] - Detected language
 * @property {string} [error] - Error message if failed
 */

/**
 * @typedef {Object} TranscriptionRequest
 * @property {string} audio_url - URL of audio/video to transcribe
 * @property {boolean} [auto_highlights] - Enable auto highlights
 * @property {boolean} [speaker_labels] - Enable speaker diarization
 * @property {string} [language_code] - Language code (auto-detect if not provided)
 */

/**
 * @typedef {Object} TranscriptionResult
 * @property {boolean} success - Success status
 * @property {string} [assemblyJobId] - AssemblyAI job ID
 * @property {string} [status] - Job status
 * @property {string} [text] - Transcribed text
 * @property {number} [confidence] - Confidence score
 * @property {string} [language] - Detected language
 * @property {Array} [words] - Word-level data
 * @property {string} [error] - Error message
 * @property {string} [message] - Status message
 */

const ASSEMBLY_BASE_URL = 'https://api.assemblyai.com/v2';

/**
 * Submit video/audio URL for transcription
 * @param {string} videoUrl - URL of video to transcribe
 * @param {Object} options - Transcription options
 * @returns {Promise<TranscriptionResult>}
 */
async function submitTranscription(videoUrl, options = {}) {
    try {
        if (!ASSEMBLY_API_KEY) {
            throw new Error('AssemblyAI API key not configured');
        }

        if (!videoUrl) {
            throw new Error('Video URL is required');
        }

        const requestData = {
            audio_url: videoUrl,
            auto_highlights: options.autoHighlights || true,
            speaker_labels: options.speakerLabels || false,
            language_code: options.languageCode || null,
            punctuate: true,
            format_text: true
        };

        const response = await fetch(`${ASSEMBLY_BASE_URL}/transcript`, {
            method: 'POST',
            headers: {
                'Authorization': ASSEMBLY_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`AssemblyAI API error: ${errorData.error || response.statusText}`);
        }

        const result = await response.json();

        return {
            success: true,
            assemblyJobId: result.id,
            message: 'Transcription job submitted successfully'
        };

    } catch (error) {
        console.error('Submit transcription error:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to submit transcription job'
        };
    } finally {
        console.log(`AssemblyAI transcription submitted for: ${videoUrl}`);
    }
}

/**
 * Get transcription status and results
 * @param {string} assemblyJobId - AssemblyAI job ID
 * @returns {Promise<TranscriptionResult>}
 */
async function getTranscriptionStatus(assemblyJobId) {
    try {
        if (!ASSEMBLY_API_KEY) {
            throw new Error('AssemblyAI API key not configured');
        }

        if (!assemblyJobId) {
            throw new Error('AssemblyAI job ID is required');
        }

        const response = await fetch(`${ASSEMBLY_BASE_URL}/transcript/${assemblyJobId}`, {
            method: 'GET',
            headers: {
                'Authorization': ASSEMBLY_API_KEY
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`AssemblyAI API error: ${errorData.error || response.statusText}`);
        }

        const result = await response.json();

        const transcriptionResult = {
            success: true,
            assemblyJobId: result.id,
            status: result.status,
            message: `Transcription status: ${result.status}`
        };

        if (result.status === 'completed') {
            transcriptionResult.text = result.text || '';
            transcriptionResult.confidence = result.confidence || 0;
            transcriptionResult.language = result.language_code || 'unknown';
            transcriptionResult.words = result.words || [];
        } else if (result.status === 'error') {
            transcriptionResult.success = false;
            transcriptionResult.error = result.error || 'Unknown transcription error';
            transcriptionResult.message = 'Transcription failed';
        }

        return transcriptionResult;

    } catch (error) {
        console.error('Get transcription status error:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to get transcription status'
        };
    } finally {
        console.log(`AssemblyAI status checked for job: ${assemblyJobId}`);
    }
}

/**
 * Cancel a transcription job
 * @param {string} assemblyJobId - AssemblyAI job ID
 * @returns {Promise<TranscriptionResult>}
 */
async function cancelTranscription(assemblyJobId) {
    try {
        if (!ASSEMBLY_API_KEY) {
            throw new Error('AssemblyAI API key not configured');
        }

        if (!assemblyJobId) {
            throw new Error('AssemblyAI job ID is required');
        }

        const response = await fetch(`${ASSEMBLY_BASE_URL}/transcript/${assemblyJobId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': ASSEMBLY_API_KEY
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`AssemblyAI API error: ${errorData.error || response.statusText}`);
        }

        return {
            success: true,
            message: 'Transcription job cancelled successfully'
        };

    } catch (error) {
        console.error('Cancel transcription error:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to cancel transcription job'
        };
    } finally {
        console.log(`AssemblyAI job cancelled: ${assemblyJobId}`);
    }
}

/**
 * Poll transcription until completion
 * @param {string} assemblyJobId - AssemblyAI job ID
 * @param {Function} [progressCallback] - Progress callback function
 * @param {number} [pollInterval] - Poll interval in milliseconds
 * @param {number} [maxAttempts] - Maximum polling attempts
 * @returns {Promise<TranscriptionResult>}
 */
async function pollTranscription(assemblyJobId, progressCallback = null, pollInterval = 5000, maxAttempts = 120) {
    try {
        let attempts = 0;

        while (attempts < maxAttempts) {
            const result = await getTranscriptionStatus(assemblyJobId);
            
            if (!result.success) {
                return result;
            }

            if (progressCallback && typeof progressCallback === 'function') {
                let progressPercent = 0;
                if (result.status === 'processing') progressPercent = 50;
                else if (result.status === 'completed') progressPercent = 100;
                else if (result.status === 'error') progressPercent = 0;
                
                await progressCallback(progressPercent);
            }

            if (result.status === 'completed' || result.status === 'error') {
                return result;
            }

            await new Promise(resolve => setTimeout(resolve, pollInterval));
            attempts++;
        }

        return {
            success: false,
            error: 'Transcription polling timeout',
            message: 'Transcription took too long to complete'
        };

    } catch (error) {
        console.error('Poll transcription error:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to poll transcription status'
        };
    } finally {
        console.log(`AssemblyAI polling completed for job: ${assemblyJobId}`);
    }
}

module.exports = {
    submitTranscription,
    getTranscriptionStatus,
    cancelTranscription,
    pollTranscription
};