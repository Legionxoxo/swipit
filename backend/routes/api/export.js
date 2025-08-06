/**
 * @fileoverview Export routes for downloading analysis results
 * @author Backend Team
 */

const express = require('express');
const { generateExport } = require('../../functions/route_fns/exportData');

const router = express.Router();

/**
 * @typedef {Object} ExportResponse
 * @property {boolean} success - Success status
 * @property {string} message - Response message
 * @property {string} [downloadUrl] - Download URL for the file
 */

/**
 * Export analysis results
 * GET /api/export/:id/:format
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.get('/:id/:format', async (req, res) => {
    try {
        const { id, format } = req.params;

        // Input validation
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Analysis ID is required',
                error: 'Missing analysis ID in URL parameters'
            });
        }

        if (!format) {
            return res.status(400).json({
                success: false,
                message: 'Export format is required',
                error: 'Missing format in URL parameters'
            });
        }

        // Validate format
        const validFormats = ['csv', 'json'];
        if (!validFormats.includes(format.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid export format',
                error: `Format must be one of: ${validFormats.join(', ')}`
            });
        }

        // Generate export file
        const exportResult = await generateExport(id, format.toLowerCase());

        if (!exportResult) {
            return res.status(404).json({
                success: false,
                message: 'Analysis not found or no data available',
                error: `No analysis data found with ID: ${id}`
            });
        }

        // Set appropriate headers for file download
        const filename = `channel_analysis_${id}.${format.toLowerCase()}`;
        const contentType = format.toLowerCase() === 'csv' ? 'text/csv' : 'application/json';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Cache-Control', 'no-cache');

        // Send file content
        res.send(exportResult.fileContent);

    } catch (error) {
        console.error('Export error:', error);
        
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to export analysis data',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        console.log(`Export requested for ID: ${req.params.id}, format: ${req.params.format} at ${new Date().toISOString()}`);
    }
});

/**
 * Get available export formats
 * GET /api/export/:id
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

        res.json({
            success: true,
            message: 'Available export formats',
            analysisId: id,
            availableFormats: [
                {
                    format: 'csv',
                    description: 'Comma-separated values format',
                    endpoint: `/api/export/${id}/csv`
                },
                {
                    format: 'json',
                    description: 'JSON format with complete data',
                    endpoint: `/api/export/${id}/json`
                }
            ]
        });

    } catch (error) {
        console.error('Get export formats error:', error);
        
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve export formats',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        console.log(`Export formats requested for ID: ${req.params.id} at ${new Date().toISOString()}`);
    }
});

module.exports = router;