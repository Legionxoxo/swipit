/**
 * @fileoverview Video transcription API routes
 * @author Backend Team
 */

const express = require('express');
const transcriptionService = require('../../functions/route_fns/transcription');

const router = express.Router();

/**
 * @typedef {Object} TranscriptionApiResponse
 * @property {boolean} success - Success status
 * @property {string} message - Response message
 * @property {any} [data] - Response data
 * @property {string} [error] - Error message if failed
 */

/**
 * Start video transcription
 * POST /api/transcription
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.post('/', async (req, res) => {
    try {
        const { userId, videoId, platform } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
                error: 'Missing userId in request body'
            });
        }

        if (!videoId) {
            return res.status(400).json({
                success: false,
                message: 'Video ID is required',
                error: 'Missing videoId in request body'
            });
        }

        if (!platform || !['youtube', 'instagram'].includes(platform)) {
            return res.status(400).json({
                success: false,
                message: 'Valid platform is required',
                error: 'Platform must be either "youtube" or "instagram"'
            });
        }

        const result = await transcriptionService.startTranscription({
            userId,
            videoId,
            platform
        });

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }

        res.status(202).json({
            success: true,
            message: 'Transcription job started successfully',
            data: {
                transcriptionId: result.transcriptionId,
                status: 'processing',
                estimatedTime: '2-5 minutes'
            }
        });

    } catch (error) {
        console.error('Start transcription error:', error);
        
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to start transcription',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        console.log(`Transcription start requested for video: ${req.body.videoId} at ${new Date().toISOString()}`);
    }
});

/**
 * Get transcription status and results
 * GET /api/transcription/:id
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Transcription ID is required',
                error: 'Missing transcription ID in URL parameters'
            });
        }

        const result = await transcriptionService.getTranscription(id);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }

        res.json({
            success: true,
            message: 'Transcription retrieved successfully',
            data: result.data
        });

    } catch (error) {
        console.error('Get transcription error:', error);
        
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to retrieve transcription',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        console.log(`Transcription requested for ID: ${req.params.id} at ${new Date().toISOString()}`);
    }
});

/**
 * Get transcription for a specific video
 * GET /api/transcription/video/:videoId/:platform
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.get('/video/:videoId/:platform', async (req, res) => {
    try {
        const { videoId, platform } = req.params;

        if (!videoId) {
            return res.status(400).json({
                success: false,
                message: 'Video ID is required',
                error: 'Missing videoId in URL parameters'
            });
        }

        if (!platform || !['youtube', 'instagram'].includes(platform)) {
            return res.status(400).json({
                success: false,
                message: 'Valid platform is required',
                error: 'Platform must be either "youtube" or "instagram"'
            });
        }

        const result = await transcriptionService.getVideoTranscription(videoId, platform);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }

        res.json({
            success: true,
            message: 'Video transcription retrieved successfully',
            data: result.data
        });

    } catch (error) {
        console.error('Get video transcription error:', error);
        
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to retrieve video transcription',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        console.log(`Video transcription requested for: ${req.params.videoId} on ${req.params.platform} at ${new Date().toISOString()}`);
    }
});

/**
 * Get all transcriptions for a user
 * GET /api/transcription/user/:userId
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { 
            limit = 50, 
            offset = 0,
            status = 'all'
        } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
                error: 'Missing userId in URL parameters'
            });
        }

        const options = {
            limit: parseInt(String(limit), 10) || 50,
            offset: parseInt(String(offset), 10) || 0,
            status: String(status)
        };

        const result = await transcriptionService.getUserTranscriptions(userId, options);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }

        res.json({
            success: true,
            message: 'User transcriptions retrieved successfully',
            data: result.data,
            pagination: {
                limit: options.limit,
                offset: options.offset,
                totalCount: result.data.length
            }
        });

    } catch (error) {
        console.error('Get user transcriptions error:', error);
        
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to retrieve user transcriptions',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        console.log(`User transcriptions requested for: ${req.params.userId} at ${new Date().toISOString()}`);
    }
});

/**
 * Delete transcription
 * DELETE /api/transcription/:id
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Transcription ID is required',
                error: 'Missing transcription ID in URL parameters'
            });
        }

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
                error: 'Missing userId in request body'
            });
        }

        const result = await transcriptionService.deleteTranscription(id, userId);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }

        res.json({
            success: true,
            message: 'Transcription deleted successfully',
            data: result.data
        });

    } catch (error) {
        console.error('Delete transcription error:', error);
        
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to delete transcription',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        console.log(`Transcription deletion requested for ID: ${req.params.id} at ${new Date().toISOString()}`);
    }
});

module.exports = router;