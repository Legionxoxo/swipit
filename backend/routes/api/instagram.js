/**
 * @fileoverview Instagram API routes for profile and reel analysis
 * @author Backend Team
 */

const express = require('express');
const { analyzeInstagram, getInstagramAnalysisStatus } = require('../../functions/route_fns/analyzeInstagram');
const { getAllCompletedAnalyses } = require('../../database/instagram/instagramJobs');

const router = express.Router();

/**
 * @typedef {Object} InstagramAnalyzeRequest
 * @property {string} username - Instagram username
 */

/**
 * @typedef {Object} InstagramAnalysisResponse
 * @property {boolean} success - Success status
 * @property {string} message - Response message
 * @property {string} analysisId - Analysis ID for tracking
 * @property {string} status - Analysis status (pending, processing, completed, failed)
 * @property {number} [progress] - Progress percentage
 * @property {Object} [profile] - Profile information
 * @property {Array} [reels] - Reels data
 * @property {Object} [reelSegments] - Reels segmented by engagement
 * @property {number} [totalReels] - Total number of reels
 * @property {string} [error] - Error message if failed
 */

/**
 * Start Instagram profile analysis
 * POST /api/instagram/analyze
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.post('/analyze', async (req, res) => {
    try {
        const { username, sessionId } = req.body;

        // Input validation
        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username is required',
                error: 'Missing username in request body'
            });
        }

        if (typeof username !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Username must be a string',
                error: 'Invalid username format'
            });
        }

        // Trim and validate username length
        const trimmedUsername = username.trim();
        if (!trimmedUsername) {
            return res.status(400).json({
                success: false,
                message: 'Username cannot be empty',
                error: 'Empty username provided'
            });
        }

        if (trimmedUsername.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Username is too long',
                error: 'Username must be 50 characters or less'
            });
        }

        // Start Instagram analysis with optional session cookies
        const analysisResult = await analyzeInstagram(trimmedUsername, sessionId);

        res.status(202).json({
            success: true,
            message: 'Instagram analysis started successfully',
            analysisId: analysisResult.analysisId,
            status: 'processing',
            progress: 0,
            estimatedTime: analysisResult.estimatedTime
        });

    } catch (error) {
        console.error('Start Instagram analysis error:', error);
        
        const statusCode = error.message.includes('Invalid username') ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to start Instagram analysis',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        console.log(`Instagram analysis request processed at ${new Date().toISOString()}`);
    }
});

/**
 * Get Instagram analysis status and results
 * GET /api/instagram/analysis/:id
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.get('/analysis/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Input validation
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Analysis ID is required',
                error: 'Missing analysis ID in URL parameters'
            });
        }

        if (typeof id !== 'string' || id.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid analysis ID format',
                error: 'Analysis ID must be a non-empty string'
            });
        }

        // Get Instagram analysis status
        const analysisData = await getInstagramAnalysisStatus(id.trim());

        if (!analysisData) {
            return res.status(404).json({
                success: false,
                message: 'Analysis not found',
                error: `No Instagram analysis found with ID: ${id}`
            });
        }

        res.json({
            success: true,
            message: 'Instagram analysis data retrieved successfully',
            analysisId: analysisData.analysisId,
            status: analysisData.status,
            progress: analysisData.progress,
            profile: analysisData.profile,
            reels: analysisData.reels,
            reelSegments: analysisData.reelSegments,
            totalReels: analysisData.totalReels,
            error: analysisData.error
        });

    } catch (error) {
        console.error('Get Instagram analysis status error:', error);
        
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to retrieve Instagram analysis status',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        console.log(`Instagram analysis status requested for ID: ${req.params.id} at ${new Date().toISOString()}`);
    }
});

/**
 * Health check endpoint for Instagram API
 * GET /api/instagram/health
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.get('/health', (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Instagram API is running',
            timestamp: new Date().toISOString(),
            service: 'Instagram Analysis API'
        });
    } catch (error) {
        console.error('Instagram API health check error:', error);
        res.status(500).json({
            success: false,
            message: 'Instagram API health check failed',
            error: error.message
        });
    } finally {
        console.log(`Instagram API health check requested at ${new Date().toISOString()}`);
    }
});

/**
 * Get all completed Instagram analyses
 * GET /api/instagram/analyses
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.get('/analyses', async (req, res) => {
    try {
        const { 
            limit = 100, 
            offset = 0 
        } = req.query;

        const options = {
            limit: parseInt(String(limit), 10) || 100,
            offset: parseInt(String(offset), 10) || 0
        };

        const analyses = await getAllCompletedAnalyses(options);

        res.json({
            success: true,
            message: 'Instagram analyses retrieved successfully',
            data: analyses
        });

    } catch (error) {
        console.error('Get all Instagram analyses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve Instagram analyses',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        console.log(`Instagram analyses requested at ${new Date().toISOString()}`);
    }
});

module.exports = router;