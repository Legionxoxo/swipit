/**
 * @fileoverview Audio uploader for AssemblyAI transcription
 * @author Backend Team
 */

const fs = require('fs').promises;
const path = require('path');
const ytdl = require('@distube/ytdl-core');

/**
 * @typedef {Object} UploadResult
 * @property {boolean} success - Success status
 * @property {string} [uploadUrl] - AssemblyAI upload URL
 * @property {string} [error] - Error message
 * @property {string} [message] - Status message
 */

/**
 * Download audio from YouTube and upload to AssemblyAI
 * @param {string} videoUrl - YouTube video URL
 * @param {string} assemblyApiKey - AssemblyAI API key
 * @returns {Promise<UploadResult>}
 */
async function downloadAndUploadAudio(videoUrl, assemblyApiKey) {
    let tempFilePath = null;
    
    try {
        console.log(`Starting audio download and upload for: ${videoUrl}`);

        if (!assemblyApiKey) {
            return {
                success: false,
                error: 'AssemblyAI API key not provided',
                message: 'Missing API key'
            };
        }

        // Create temp directory if it doesn't exist
        const tempDir = path.join(__dirname, '../../../temp');
        try {
            await fs.access(tempDir);
        } catch {
            await fs.mkdir(tempDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const videoId = ytdl.getVideoID(videoUrl);
        tempFilePath = path.join(tempDir, `audio_${videoId}_${timestamp}.webm`);

        console.log(`Downloading audio to: ${tempFilePath}`);

        // Download audio stream
        await new Promise((resolve, reject) => {
            const audioStream = ytdl(videoUrl, {
                filter: 'audioonly',
                quality: 'highestaudio'
            });

            const writeStream = require('fs').createWriteStream(tempFilePath);
            
            audioStream.pipe(writeStream);
            
            audioStream.on('error', reject);
            writeStream.on('error', reject);
            writeStream.on('finish', () => resolve(undefined));
        });

        console.log('Audio download completed, uploading to AssemblyAI...');

        // Upload to AssemblyAI
        const uploadUrl = await uploadToAssemblyAI(tempFilePath, assemblyApiKey);

        return {
            success: true,
            uploadUrl,
            message: 'Audio uploaded successfully'
        };

    } catch (error) {
        console.error('Download and upload error:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to download and upload audio'
        };
    } finally {
        // Clean up temporary file
        if (tempFilePath) {
            try {
                await fs.unlink(tempFilePath);
                console.log(`Cleaned up temp file: ${tempFilePath}`);
            } catch (cleanupError) {
                console.warn(`Failed to clean up temp file: ${cleanupError.message}`);
            }
        }
        console.log('Audio download and upload process completed');
    }
}

/**
 * Upload audio file to AssemblyAI
 * @param {string} filePath - Path to audio file
 * @param {string} assemblyApiKey - AssemblyAI API key
 * @returns {Promise<string>} Upload URL
 */
async function uploadToAssemblyAI(filePath, assemblyApiKey) {
    try {
        const fileBuffer = await fs.readFile(filePath);
        const fileName = path.basename(filePath);

        console.log(`Uploading ${fileName} (${fileBuffer.length} bytes) to AssemblyAI...`);

        const response = await fetch('https://api.assemblyai.com/v2/upload', {
            method: 'POST',
            headers: {
                'Authorization': assemblyApiKey
            },
            // @ts-ignore
            body: fileBuffer
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AssemblyAI upload failed: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        
        if (!result.upload_url) {
            throw new Error('No upload URL returned from AssemblyAI');
        }

        console.log('Successfully uploaded to AssemblyAI');
        return result.upload_url;

    } catch (error) {
        console.error('AssemblyAI upload error:', error);
        throw new Error(`Failed to upload to AssemblyAI: ${error.message}`);
    } finally {
        console.log('AssemblyAI upload process completed');
    }
}

/**
 * Get audio stream info without downloading
 * @param {string} videoUrl - YouTube video URL
 * @returns {Promise<Object>} Audio stream info
 */
async function getAudioStreamInfo(videoUrl) {
    try {
        const info = await ytdl.getInfo(videoUrl);
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        
        if (audioFormats.length === 0) {
            throw new Error('No audio formats available');
        }

        // Get best audio format
        const bestAudio = audioFormats.reduce((best, format) => {
            return !best || (format.audioBitrate || 0) > (best.audioBitrate || 0) ? format : best;
        });

        return {
            title: info.videoDetails.title,
            duration: parseInt(info.videoDetails.lengthSeconds),
            format: bestAudio.container,
            bitrate: bestAudio.audioBitrate,
            codec: bestAudio.audioCodec,
            size: bestAudio.contentLength
        };

    } catch (error) {
        console.error('Get audio stream info error:', error);
        throw error;
    } finally {
        console.log('Audio stream info retrieval completed');
    }
}

module.exports = {
    downloadAndUploadAudio,
    uploadToAssemblyAI,
    getAudioStreamInfo
};