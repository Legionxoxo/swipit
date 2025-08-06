/**
 * @fileoverview Video transcription route functions
 * @author Backend Team
 */

const { getDatabase } = require('../../database/connection');
const transcriptionService = require('../../utils/transcription/transcriptionService');
const { generateAnalysisId } = require('../../utils/helpers');

/**
 * @typedef {Object} TranscriptionJob
 * @property {string} transcriptionId - Unique transcription ID
 * @property {string} userId - User ID
 * @property {string} videoId - Video ID
 * @property {string} videoUrl - Video URL
 * @property {string} platform - Platform (youtube/instagram)
 * @property {string} status - Job status
 * @property {number} progress - Progress percentage
 * @property {string} [assemblyJobId] - AssemblyAI job ID
 */

/**
 * @typedef {Object} RouteResult
 * @property {boolean} success - Success status
 * @property {string} [transcriptionId] - Transcription ID
 * @property {any} [data] - Result data
 * @property {string} [error] - Error message
 * @property {string} [message] - Status message
 */

const transcriptionJobs = new Map();

/**
 * Start video transcription
 * @param {Object} jobData - Job data
 * @param {string} jobData.userId - User ID
 * @param {string} jobData.videoId - Video ID
 * @param {string} jobData.platform - Platform (youtube/instagram)
 * @returns {Promise<RouteResult>}
 */
async function startTranscription(jobData) {
    try {
        const { userId, videoId, platform } = jobData;

        if (!userId || !videoId || !platform) {
            return {
                success: false,
                error: 'Missing required fields: userId, videoId, platform',
                message: 'Invalid request data'
            };
        }

        // Check if transcription already exists for this video+platform
        const db = await getDatabase();
        const existing = await db.get(`
            SELECT * FROM video_transcriptions 
            WHERE video_id = ? AND platform = ?
        `, [videoId, platform]);

        if (existing) {
            return {
                success: true,
                transcriptionId: existing.transcription_id,
                message: existing.status === 'completed' 
                    ? 'Transcription already exists and is completed'
                    : 'Transcription already in progress'
            };
        }

        const transcriptionId = generateAnalysisId();

        const serviceResult = await transcriptionService.startTranscriptionProcess({
            userId,
            videoId,
            platform
        });

        if (!serviceResult.success) {
            return serviceResult;
        }

        const { videoData, assemblyJobId } = serviceResult;

        const jobRecord = {
            transcriptionId,
            userId,
            videoId: videoData.video_id,
            videoUrl: videoData.video_url,
            platform,
            status: 'processing',
            progress: 0,
            assemblyJobId,
            createdAt: new Date().toISOString()
        };

        transcriptionJobs.set(transcriptionId, jobRecord);

        await storeTranscriptionJob(transcriptionId, {
            initiatedBy: userId,
            videoId: videoData.video_id,
            videoUrl: videoData.video_url,
            platform,
            videoTitle: videoData.video_title,
            videoDuration: videoData.video_duration,
            videoThumbnailUrl: videoData.video_thumbnail_url,
            assemblyJobId
        });

        processTranscriptionBackground(transcriptionId, assemblyJobId).catch(async (error) => {
            console.error(`Background transcription failed for ${transcriptionId}:`, error);
            await updateTranscriptionStatus(transcriptionId, 'failed', 0, error.message);
        });

        return {
            success: true,
            transcriptionId,
            message: 'Transcription job started successfully'
        };

    } catch (error) {
        console.error('Start transcription error:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to start transcription'
        };
    } finally {
        console.log(`Transcription start completed for user: ${jobData.userId}`);
    }
}

/**
 * Get transcription by ID
 * @param {string} transcriptionId - Transcription ID
 * @returns {Promise<RouteResult>}
 */
async function getTranscription(transcriptionId) {
    try {
        if (!transcriptionId) {
            return {
                success: false,
                error: 'Transcription ID is required',
                message: 'Invalid request'
            };
        }

        const db = await getDatabase();
        
        const transcriptionData = await db.get(`
            SELECT * FROM video_transcriptions 
            WHERE transcription_id = ?
        `, [transcriptionId]);

        if (!transcriptionData) {
            return {
                success: false,
                error: 'Transcription not found',
                message: 'Transcription does not exist'
            };
        }

        const jobFromMemory = transcriptionJobs.get(transcriptionId);
        if (jobFromMemory && transcriptionData.status === 'processing') {
            transcriptionData.progress = jobFromMemory.progress || transcriptionData.progress;
        }

        return {
            success: true,
            data: {
                transcriptionId: transcriptionData.transcription_id,
                initiatedBy: transcriptionData.initiated_by_user,
                videoId: transcriptionData.video_id,
                videoUrl: transcriptionData.video_url,
                platform: transcriptionData.platform,
                status: transcriptionData.status,
                progress: transcriptionData.progress,
                videoTitle: transcriptionData.video_title,
                videoDuration: transcriptionData.video_duration,
                videoThumbnailUrl: transcriptionData.video_thumbnail_url,
                rawTranscript: transcriptionData.raw_transcript,
                formattedTranscript: transcriptionData.formatted_transcript,
                languageDetected: transcriptionData.language_detected,
                confidenceScore: transcriptionData.confidence_score,
                processingStartedAt: transcriptionData.processing_started_at,
                processingCompletedAt: transcriptionData.processing_completed_at,
                processingTimeSeconds: transcriptionData.processing_time_seconds,
                errorMessage: transcriptionData.error_message,
                createdAt: transcriptionData.created_at,
                updatedAt: transcriptionData.updated_at
            },
            message: 'Transcription retrieved successfully'
        };

    } catch (error) {
        console.error('Get transcription error:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to retrieve transcription'
        };
    } finally {
        console.log(`Transcription get completed for ID: ${transcriptionId}`);
    }
}

/**
 * Get transcription for a specific video
 * @param {string} videoId - Video ID
 * @param {string} platform - Platform (youtube/instagram)
 * @returns {Promise<RouteResult>}
 */
async function getVideoTranscription(videoId, platform) {
    try {
        if (!videoId || !platform) {
            return {
                success: false,
                error: 'Video ID and platform are required',
                message: 'Invalid request'
            };
        }

        const db = await getDatabase();
        
        const transcriptionData = await db.get(`
            SELECT * FROM video_transcriptions 
            WHERE video_id = ? AND platform = ?
        `, [videoId, platform]);

        if (!transcriptionData) {
            return {
                success: false,
                error: 'Transcription not found',
                message: 'No transcription exists for this video'
            };
        }

        const jobFromMemory = transcriptionJobs.get(transcriptionData.transcription_id);
        if (jobFromMemory && transcriptionData.status === 'processing') {
            transcriptionData.progress = jobFromMemory.progress || transcriptionData.progress;
        }

        return {
            success: true,
            data: {
                transcriptionId: transcriptionData.transcription_id,
                initiatedBy: transcriptionData.initiated_by_user,
                videoId: transcriptionData.video_id,
                videoUrl: transcriptionData.video_url,
                platform: transcriptionData.platform,
                status: transcriptionData.status,
                progress: transcriptionData.progress,
                videoTitle: transcriptionData.video_title,
                videoDuration: transcriptionData.video_duration,
                videoThumbnailUrl: transcriptionData.video_thumbnail_url,
                rawTranscript: transcriptionData.raw_transcript,
                formattedTranscript: transcriptionData.formatted_transcript,
                languageDetected: transcriptionData.language_detected,
                confidenceScore: transcriptionData.confidence_score,
                processingStartedAt: transcriptionData.processing_started_at,
                processingCompletedAt: transcriptionData.processing_completed_at,
                processingTimeSeconds: transcriptionData.processing_time_seconds,
                errorMessage: transcriptionData.error_message,
                createdAt: transcriptionData.created_at,
                updatedAt: transcriptionData.updated_at
            },
            message: 'Transcription retrieved successfully'
        };

    } catch (error) {
        console.error('Get video transcription error:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to retrieve video transcription'
        };
    } finally {
        console.log(`Video transcription get completed for: ${videoId} on ${platform}`);
    }
}

/**
 * Get user transcriptions
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<RouteResult>}
 */
async function getUserTranscriptions(userId, options = {}) {
    try {
        if (!userId) {
            return {
                success: false,
                error: 'User ID is required',
                message: 'Invalid request'
            };
        }

        const { limit = 50, offset = 0, status = 'all' } = options;
        const db = await getDatabase();
        
        let query = `
            SELECT * FROM video_transcriptions 
            WHERE user_id = ?
        `;
        const params = [userId];

        if (status !== 'all') {
            query += ` AND status = ?`;
            params.push(status);
        }

        query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const transcriptions = await db.all(query, params);

        const formattedTranscriptions = transcriptions.map(t => ({
            transcriptionId: t.transcription_id,
            initiatedBy: t.initiated_by_user,
            videoId: t.video_id,
            videoUrl: t.video_url,
            platform: t.platform,
            status: t.status,
            progress: t.progress,
            videoTitle: t.video_title,
            videoDuration: t.video_duration,
            videoThumbnailUrl: t.video_thumbnail_url,
            languageDetected: t.language_detected,
            confidenceScore: t.confidence_score,
            processingCompletedAt: t.processing_completed_at,
            processingTimeSeconds: t.processing_time_seconds,
            createdAt: t.created_at,
            updatedAt: t.updated_at,
            hasTranscript: !!(t.raw_transcript || t.formatted_transcript)
        }));

        return {
            success: true,
            data: formattedTranscriptions,
            message: 'User transcriptions retrieved successfully'
        };

    } catch (error) {
        console.error('Get user transcriptions error:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to retrieve user transcriptions'
        };
    } finally {
        console.log(`User transcriptions get completed for user: ${userId}`);
    }
}

/**
 * Delete transcription
 * @param {string} transcriptionId - Transcription ID
 * @param {string} userId - User ID (for ownership validation)
 * @returns {Promise<RouteResult>}
 */
async function deleteTranscription(transcriptionId, userId) {
    try {
        if (!transcriptionId || !userId) {
            return {
                success: false,
                error: 'Transcription ID and User ID are required',
                message: 'Invalid request'
            };
        }

        const db = await getDatabase();
        
        const existing = await db.get(`
            SELECT * FROM video_transcriptions 
            WHERE transcription_id = ? AND initiated_by_user = ?
        `, [transcriptionId, userId]);

        if (!existing) {
            return {
                success: false,
                error: 'Transcription not found or access denied (only creator can delete)',
                message: 'Cannot delete transcription'
            };
        }

        await db.run(`
            DELETE FROM video_transcriptions 
            WHERE transcription_id = ?
        `, [transcriptionId]);

        transcriptionJobs.delete(transcriptionId);

        return {
            success: true,
            data: { transcriptionId },
            message: 'Transcription deleted successfully'
        };

    } catch (error) {
        console.error('Delete transcription error:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to delete transcription'
        };
    } finally {
        console.log(`Transcription delete completed for ID: ${transcriptionId}`);
    }
}

/**
 * Store transcription job in database
 * @param {string} transcriptionId - Transcription ID
 * @param {Object} jobData - Job data
 * @returns {Promise<void>}
 */
async function storeTranscriptionJob(transcriptionId, jobData) {
    try {
        const db = await getDatabase();
        
        await db.run(`
            INSERT INTO video_transcriptions (
                transcription_id, initiated_by_user, video_id, video_url, platform,
                video_title, video_duration, video_thumbnail_url,
                status, progress, processing_started_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'processing', 0, CURRENT_TIMESTAMP)
        `, [
            transcriptionId,
            jobData.initiatedBy,
            jobData.videoId,
            jobData.videoUrl,
            jobData.platform,
            jobData.videoTitle,
            jobData.videoDuration,
            jobData.videoThumbnailUrl
        ]);

    } catch (error) {
        console.error('Store transcription job error:', error);
        throw error;
    } finally {
        console.log(`Transcription job stored: ${transcriptionId}`);
    }
}

/**
 * Update transcription status
 * @param {string} transcriptionId - Transcription ID
 * @param {string} status - Status
 * @param {number} progress - Progress percentage
 * @param {string} [errorMessage] - Error message
 * @returns {Promise<void>}
 */
async function updateTranscriptionStatus(transcriptionId, status, progress, errorMessage = null) {
    try {
        const db = await getDatabase();
        
        let query = `
            UPDATE video_transcriptions 
            SET status = ?, progress = ?, updated_at = CURRENT_TIMESTAMP
        `;
        let params = [status, progress];

        if (errorMessage) {
            query += `, error_message = ?`;
            params.push(errorMessage);
        }

        if (status === 'completed') {
            query += `, processing_completed_at = CURRENT_TIMESTAMP`;
        }

        query += ` WHERE transcription_id = ?`;
        params.push(transcriptionId);

        await db.run(query, params);

        const jobFromMemory = transcriptionJobs.get(transcriptionId);
        if (jobFromMemory) {
            jobFromMemory.status = status;
            jobFromMemory.progress = progress;
            if (errorMessage) jobFromMemory.errorMessage = errorMessage;
        }

    } catch (error) {
        console.error('Update transcription status error:', error);
        throw error;
    } finally {
        console.log(`Transcription status updated: ${transcriptionId} -> ${status} (${progress}%)`);
    }
}

/**
 * Background transcription processing
 * @param {string} transcriptionId - Transcription ID
 * @param {string} assemblyJobId - AssemblyAI job ID
 * @returns {Promise<void>}
 */
async function processTranscriptionBackground(transcriptionId, assemblyJobId) {
    try {
        const progressCallback = async (progress) => {
            await updateTranscriptionStatus(transcriptionId, 'processing', progress);
        };

        const startTime = Date.now();
        
        const result = await transcriptionService.processTranscription(
            transcriptionId,
            assemblyJobId,
            progressCallback
        );

        if (!result.success) {
            await updateTranscriptionStatus(transcriptionId, 'failed', 0, result.error);
            return;
        }

        const processingTime = Math.floor((Date.now() - startTime) / 1000);
        const { transcriptionData } = result;

        const db = await getDatabase();
        await db.run(`
            UPDATE video_transcriptions 
            SET status = 'completed', progress = 100, 
                raw_transcript = ?, formatted_transcript = ?,
                language_detected = ?, confidence_score = ?,
                processing_completed_at = CURRENT_TIMESTAMP,
                processing_time_seconds = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE transcription_id = ?
        `, [
            transcriptionData.rawTranscript,
            transcriptionData.formattedTranscript,
            transcriptionData.languageDetected,
            transcriptionData.confidenceScore,
            processingTime,
            transcriptionId
        ]);

        transcriptionJobs.delete(transcriptionId);

    } catch (error) {
        console.error('Background transcription processing error:', error);
        await updateTranscriptionStatus(transcriptionId, 'failed', 0, error.message);
    } finally {
        console.log(`Background transcription processing completed: ${transcriptionId}`);
    }
}

module.exports = {
    startTranscription,
    getTranscription,
    getVideoTranscription,
    getUserTranscriptions,
    deleteTranscription
};