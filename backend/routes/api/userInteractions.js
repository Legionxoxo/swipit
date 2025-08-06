/**
 * @fileoverview User interactions API routes for video stars, comments, favorites, and hubs
 * @author Backend Team
 */

const express = require('express');
const userInteractionsService = require('../../functions/route_fns/userInteractions');

const router = express.Router();

/**
 * @typedef {Object} UserInteractionResponse
 * @property {boolean} success - Success status
 * @property {string} message - Response message
 * @property {any} [data] - Response data
 * @property {string} [error] - Error message if failed
 */

/**
 * Get user video interactions (stars, comments, favorites)
 * GET /api/user-interactions/videos/:userId
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.get('/videos/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
                error: 'Missing user ID in URL parameters'
            });
        }

        const result = await userInteractionsService.getUserVideoInteractions(userId);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }

        res.json({
            success: true,
            message: 'User video interactions retrieved successfully',
            data: result.data
        });

    } catch (error) {
        console.error('Get user video interactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user video interactions',
            error: error.message
        });
    } finally {
        console.log(`Get user video interactions completed at ${new Date().toISOString()}`);
    }
});

/**
 * Update user video interaction (star, comment, favorite)
 * PUT /api/user-interactions/videos
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.put('/videos', async (req, res) => {
    try {
        const { userId, videoId, platform, starRating, comment, isFavorite } = req.body;

        if (!userId || !videoId || !platform) {
            return res.status(400).json({
                success: false,
                message: 'User ID, video ID, and platform are required',
                error: 'Missing required fields in request body'
            });
        }

        const result = await userInteractionsService.updateVideoInteraction(
            userId, videoId, platform, { starRating, comment, isFavorite }
        );

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }

        res.json({
            success: true,
            message: 'Video interaction updated successfully',
            data: result.data
        });

    } catch (error) {
        console.error('Update video interaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update video interaction',
            error: error.message
        });
    } finally {
        console.log(`Update video interaction completed at ${new Date().toISOString()}`);
    }
});

/**
 * Get user creator interactions (favorites, hub assignments)
 * GET /api/user-interactions/creators/:userId
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.get('/creators/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
                error: 'Missing user ID in URL parameters'
            });
        }

        const result = await userInteractionsService.getUserCreatorInteractions(userId);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }

        res.json({
            success: true,
            message: 'User creator interactions retrieved successfully',
            data: result.data
        });

    } catch (error) {
        console.error('Get user creator interactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user creator interactions',
            error: error.message
        });
    } finally {
        console.log(`Get user creator interactions completed at ${new Date().toISOString()}`);
    }
});

/**
 * Update user creator interaction (favorite, hub assignment)
 * PUT /api/user-interactions/creators
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.put('/creators', async (req, res) => {
    try {
        const { userId, creatorId, isFavorite, hubId, channelName, channelId, thumbnailUrl, platform } = req.body;

        if (!userId || !creatorId || !channelName || !platform) {
            return res.status(400).json({
                success: false,
                message: 'User ID, creator ID, channel name, and platform are required',
                error: 'Missing required fields in request body'
            });
        }

        const result = await userInteractionsService.updateCreatorInteraction(
            userId, creatorId, { isFavorite, hubId, channelName, channelId, thumbnailUrl, platform }
        );

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }

        res.json({
            success: true,
            message: 'Creator interaction updated successfully',
            data: result.data
        });

    } catch (error) {
        console.error('Update creator interaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update creator interaction',
            error: error.message
        });
    } finally {
        console.log(`Update creator interaction completed at ${new Date().toISOString()}`);
    }
});

/**
 * Get user hubs
 * GET /api/user-interactions/hubs/:userId
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.get('/hubs/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
                error: 'Missing user ID in URL parameters'
            });
        }

        const result = await userInteractionsService.getUserHubs(userId);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }

        res.json({
            success: true,
            message: 'User hubs retrieved successfully',
            data: result.data
        });

    } catch (error) {
        console.error('Get user hubs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user hubs',
            error: error.message
        });
    } finally {
        console.log(`Get user hubs completed at ${new Date().toISOString()}`);
    }
});

/**
 * Create user hub
 * POST /api/user-interactions/hubs
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.post('/hubs', async (req, res) => {
    try {
        const { userId, name } = req.body;

        if (!userId || !name) {
            return res.status(400).json({
                success: false,
                message: 'User ID and hub name are required',
                error: 'Missing required fields in request body'
            });
        }

        const result = await userInteractionsService.createHub(userId, name);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }

        res.json({
            success: true,
            message: 'Hub created successfully',
            data: result.data
        });

    } catch (error) {
        console.error('Create hub error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create hub',
            error: error.message
        });
    } finally {
        console.log(`Create hub completed at ${new Date().toISOString()}`);
    }
});

/**
 * Delete user hub
 * DELETE /api/user-interactions/hubs/:hubId
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.delete('/hubs/:hubId', async (req, res) => {
    try {
        const { hubId } = req.params;
        const { userId } = req.body;

        if (!hubId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Hub ID and user ID are required',
                error: 'Missing required parameters'
            });
        }

        const result = await userInteractionsService.deleteHub(userId, hubId);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }

        res.json({
            success: true,
            message: 'Hub deleted successfully',
            data: result.data
        });

    } catch (error) {
        console.error('Delete hub error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete hub',
            error: error.message
        });
    } finally {
        console.log(`Delete hub completed at ${new Date().toISOString()}`);
    }
});

module.exports = router;