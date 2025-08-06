/**
 * @fileoverview API routes for YouTube Channel Analyzer
 * @author Backend Team
 */

const express = require('express');
const analyzeRoutes = require('./analyze');
const exportRoutes = require('./export');

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
            message: 'YouTube Channel Analyzer API',
            version: '1.0.0',
            endpoints: {
                analyze: '/api/analyze',
                analysis: '/api/analysis/:id',
                export: '/api/export/:id/:format'
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

module.exports = router;