/**
 * @fileoverview YouTube API routes for data queries
 * @author Backend Team
 */

const express = require('express');
const youtubeService = require('../../utils/youtube/youtubeService');

const router = express.Router();

/**
 * @typedef {Object} YouTubeApiResponse
 * @property {boolean} success - Success status
 * @property {string} message - Response message
 * @property {any} [data] - Response data
 * @property {string} [error] - Error message if failed
 */

/**
 * Get YouTube analysis by ID
 * GET /api/youtube/analysis/:id
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.get('/analysis/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Analysis ID is required',
                error: 'Missing analysis ID in URL parameters'
            });
        }

        const result = await youtubeService.getAnalysis(id);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }

        res.json({
            success: true,
            message: 'YouTube analysis retrieved successfully',
            data: result.data
        });

    } catch (error) {
        console.error('Get YouTube analysis error:', error);
        
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to retrieve YouTube analysis',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        console.log(`YouTube analysis requested for ID: ${req.params.id} at ${new Date().toISOString()}`);
    }
});

/**
 * Get YouTube analysis summary by ID
 * GET /api/youtube/analysis/:id/summary
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.get('/analysis/:id/summary', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Analysis ID is required',
                error: 'Missing analysis ID in URL parameters'
            });
        }

        const result = await youtubeService.getAnalysisSummary(id);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }

        res.json({
            success: true,
            message: 'YouTube analysis summary retrieved successfully',
            data: result.data
        });

    } catch (error) {
        console.error('Get YouTube analysis summary error:', error);
        
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to retrieve YouTube analysis summary',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        console.log(`YouTube analysis summary requested for ID: ${req.params.id} at ${new Date().toISOString()}`);
    }
});

/**
 * Get YouTube videos by analysis ID
 * GET /api/youtube/analysis/:id/videos
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.get('/analysis/:id/videos', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            limit = 100, 
            offset = 0, 
            sortBy = 'video_view_count', 
            sortOrder = 'DESC' 
        } = req.query;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Analysis ID is required',
                error: 'Missing analysis ID in URL parameters'
            });
        }

        const options = {
            limit: parseInt(String(limit), 10) || 100,
            offset: parseInt(String(offset), 10) || 0,
            sortBy: String(sortBy || 'video_view_count'),
            sortOrder: String(sortOrder || 'DESC')
        };

        const result = await youtubeService.getVideos(id, options);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }

        res.json({
            success: true,
            message: 'YouTube videos retrieved successfully',
            data: result.data,
            pagination: {
                limit: options.limit,
                offset: options.offset,
                totalCount: result.data.length
            }
        });

    } catch (error) {
        console.error('Get YouTube videos error:', error);
        
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to retrieve YouTube videos',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        console.log(`YouTube videos requested for ID: ${req.params.id} at ${new Date().toISOString()}`);
    }
});

/**
 * Delete YouTube analysis by ID
 * DELETE /api/youtube/analysis/:id
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.delete('/analysis/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Analysis ID is required',
                error: 'Missing analysis ID in URL parameters'
            });
        }

        const result = await youtubeService.deleteAnalysis(id);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }

        res.json({
            success: true,
            message: 'YouTube analysis deleted successfully',
            data: result.data
        });

    } catch (error) {
        console.error('Delete YouTube analysis error:', error);
        
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to delete YouTube analysis',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        console.log(`YouTube analysis deletion requested for ID: ${req.params.id} at ${new Date().toISOString()}`);
    }
});

module.exports = router;