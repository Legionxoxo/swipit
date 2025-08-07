/**
 * @fileoverview API routes for BuzzHunt
 * @author Backend Team
 */

const express = require('express');
const analyzeRoutes = require('./analyze');
const exportRoutes = require('./export');
const instagramRoutes = require('./instagram');
const youtubeRoutes = require('./youtube');
const userInteractionsRoutes = require('./userInteractions');
const transcriptionRoutes = require('./transcription');
const oembedRoutes = require('./oembed');
const { router: extensionRoutes } = require('./extension');

const router = express.Router();

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Success status
 * @property {string} message - Response message
 * @property {any} [data] - Response data
 */

/**
 * API welcome endpoint
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.get('/', (req, res) => {
    try {
        res.json({
            success: true,
            message: 'BuzzHunt API',
            version: '1.0.0',
            endpoints: {
                analyze: '/api/analyze',
                analysis: '/api/analysis/:id',
                export: '/api/export/:id/:format',
                instagram: '/api/instagram',
                youtube: '/api/youtube',
                userInteractions: '/api/user-interactions',
                transcription: '/api/transcription',
                oembed: '/api/oembed',
                extension: '/api/extension'
            }
        });
    } catch (error) {
        console.error('API welcome error:', error);
        res.status(500).json({
            success: false,
            message: 'API error',
            error: error.message
        });
    } finally {
        console.log(`API welcome accessed at ${new Date().toISOString()}`);
    }
});


// Mount route modules
router.use('/analyze', analyzeRoutes);
router.use('/analysis', analyzeRoutes);
router.use('/export', exportRoutes);
router.use('/instagram', instagramRoutes);
router.use('/youtube', youtubeRoutes);
router.use('/user-interactions', userInteractionsRoutes);
router.use('/transcription', transcriptionRoutes);
router.use('/oembed', oembedRoutes);
router.use('/extension', extensionRoutes);

module.exports = router;