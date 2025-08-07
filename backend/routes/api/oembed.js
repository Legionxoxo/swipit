/**
 * @fileoverview oEmbed API routes for Instagram post data extraction
 * @author Backend Team
 */

const express = require('express');
const { processOembedRequest } = require('../../functions/route_fns/oembed');

const router = express.Router();

/**
 * @typedef {Object} OembedRequest
 * @property {string} post_url - Instagram post URL
 */

/**
 * @typedef {Object} OembedResponse
 * @property {boolean} success - Success status
 * @property {string} message - Response message
 * @property {Object} [data] - oEmbed data including profile info, caption, hashtags, etc.
 * @property {string} [error] - Error message if failed
 */

/**
 * Process Instagram oEmbed request
 * POST /api/oembed
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.post('/', async (req, res) => {
    try {
        const { post_url } = req.body;

        // Input validation
        if (!post_url) {
            return res.status(400).json({
                success: false,
                message: 'Instagram post URL is required',
                error: 'Missing post_url in request body'
            });
        }

        if (typeof post_url !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Post URL must be a string',
                error: 'Invalid post_url format'
            });
        }

        // Trim and validate URL
        const trimmedUrl = post_url.trim();
        if (!trimmedUrl) {
            return res.status(400).json({
                success: false,
                message: 'Post URL cannot be empty',
                error: 'Empty post_url provided'
            });
        }

        // Validate Instagram URL format
        const instagramUrlPattern = /^https?:\/\/(www\.)?(instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+|instagr\.am\/p\/[A-Za-z0-9_-]+)/i;
        if (!instagramUrlPattern.test(trimmedUrl)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Instagram post URL format',
                error: 'URL must be a valid Instagram post or reel URL'
            });
        }

        // Process oEmbed request
        const oembedResult = await processOembedRequest(trimmedUrl);

        res.status(200).json({
            success: true,
            message: 'Instagram oEmbed data retrieved successfully',
            data: oembedResult
        });

    } catch (error) {
        console.error('oEmbed request error:', error);
        
        // Handle specific error cases
        let statusCode = 500;
        let errorMessage = 'Failed to process oEmbed request';

        if (error.message.includes('private')) {
            statusCode = 403;
            errorMessage = 'Private post - cannot access oEmbed data';
        } else if (error.message.includes('deleted') || error.message.includes('not found')) {
            statusCode = 404;
            errorMessage = 'Post not found or has been deleted';
        } else if (error.message.includes('invalid')) {
            statusCode = 400;
            errorMessage = 'Invalid Instagram URL';
        }

        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.stack : error.message
        });
    } finally {
        console.log(`oEmbed request processed for URL: ${req.body.post_url || 'undefined'} at ${new Date().toISOString()}`);
    }
});

/**
 * Health check endpoint for oEmbed API
 * GET /api/oembed/health
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.get('/health', (req, res) => {
    try {
        res.json({
            success: true,
            message: 'oEmbed API is running',
            timestamp: new Date().toISOString(),
            service: 'Instagram oEmbed API'
        });
    } catch (error) {
        console.error('oEmbed API health check error:', error);
        res.status(500).json({
            success: false,
            message: 'oEmbed API health check failed',
            error: error.message
        });
    } finally {
        console.log(`oEmbed API health check requested at ${new Date().toISOString()}`);
    }
});

module.exports = router;