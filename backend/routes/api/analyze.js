/**
 * @fileoverview Analysis routes for YouTube channel processing
 * @author Backend Team
 */

const express = require('express');
const { startAnalysis, getAnalysisStatus } = require('../../functions/route_fns/analyzeChannel');

const router = express.Router();

/**
 * @typedef {Object} AnalyzeRequest
 * @property {string} channelUrl - YouTube channel URL
 */

/**
 * @typedef {Object} AnalysisResponse
 * @property {boolean} success - Success status
 * @property {string} message - Response message
 * @property {string} analysisId - Analysis ID for tracking
 * @property {string} status - Analysis status (processing, completed, error)
 * @property {number} [progress] - Progress percentage
 * @property {VideoData[]} [data] - Analysis results
 */

/**
 * @typedef {Object} VideoData
 * @property {string} id - Video ID
 * @property {string} title - Video title
 * @property {string} description - Video description
 * @property {string} thumbnailUrl - Thumbnail URL
 * @property {string} uploadDate - Upload date
 * @property {string} duration - Video duration
 * @property {number} viewCount - View count
 * @property {number} likeCount - Like count
 * @property {number} commentCount - Comment count
 * @property {string} categoryId - Category ID
 */

/**
 * Start channel analysis
 * POST /api/analyze
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.post('/', async (req, res) => {
    try {
        const { channelUrl } = req.body;

        // Input validation
        if (!channelUrl) {
            return res.status(400).json({
                success: false,
                message: 'Channel URL is required',
                error: 'Missing channelUrl in request body'
            });
        }

        // Validate URL format
        const urlPattern = /^https?:\/\/(www\.)?(youtube\.com\/(channel\/|c\/|user\/|@)|youtu\.be\/)/;
        if (!urlPattern.test(channelUrl)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid YouTube channel URL format',
                error: 'URL must be a valid YouTube channel URL'
            });
        }

        // Start analysis process
        const analysisResult = await startAnalysis(channelUrl);

        res.status(202).json({
            success: true,
            message: 'Analysis started successfully',
            analysisId: analysisResult.analysisId,
            status: 'processing',
            progress: 0,
            estimatedTime: analysisResult.estimatedTime
        });

    } catch (error) {
        console.error('Start analysis error:', error);
        
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to start channel analysis',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        console.log(`Analysis request processed at ${new Date().toISOString()}`);
    }
});

/**
 * Get analysis status and results
 * GET /api/analysis/:id
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.get('/:id', async (req, res) => {
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

        // Get analysis status
        const analysisData = await getAnalysisStatus(id);

        if (!analysisData) {
            return res.status(404).json({
                success: false,
                message: 'Analysis not found',
                error: `No analysis found with ID: ${id}`
            });
        }

        res.json({
            success: true,
            message: 'Analysis data retrieved successfully',
            analysisId: id,
            status: analysisData.status,
            progress: analysisData.progress,
            data: analysisData.data,
            channelInfo: analysisData.channelInfo,
            videoSegments: analysisData.videoSegments,
            totalVideos: analysisData.totalVideos,
            processingTime: analysisData.processingTime
        });

    } catch (error) {
        console.error('Get analysis status error:', error);
        
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to retrieve analysis status',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        console.log(`Analysis status requested for ID: ${req.params.id} at ${new Date().toISOString()}`);
    }
});

module.exports = router;