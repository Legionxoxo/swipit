/**
 * @fileoverview Export data route functions - consolidated exports
 * @author Backend Team
 */

const { getAnalysisStatus } = require('./analyzeChannel');
const { generateCsvExport, escapeCSVField } = require('../export/csvGenerator');
const { generateJsonExport } = require('../export/jsonGenerator');
const { calculateTotalViews, calculateAverageViews, findMostViewedVideo } = require('../export/statisticsCalculator');

/**
 * @typedef {Object} ExportResult
 * @property {string} fileContent - Generated file content
 * @property {string} filename - Suggested filename
 * @property {string} contentType - MIME content type
 */

/**
 * Generate export file for analysis results
 * @param {string} analysisId - Analysis ID
 * @param {string} format - Export format (csv or json)
 * @returns {Promise<ExportResult|null>} Export result
 */
async function generateExport(analysisId, format) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        if (!format) {
            throw new Error('Export format is required');
        }

        // Get analysis data
        const analysisData = await getAnalysisStatus(analysisId);
        
        if (!analysisData || analysisData.status !== 'completed') {
            return null;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `channel_analysis_${analysisId}_${timestamp}`;

        switch (format.toLowerCase()) {
            case 'csv':
                return {
                    fileContent: generateCsvExport(analysisData),
                    filename: `${filename}.csv`,
                    contentType: 'text/csv'
                };
            
            case 'json':
                return {
                    fileContent: generateJsonExport(analysisData),
                    filename: `${filename}.json`,
                    contentType: 'application/json'
                };
            
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }

    } catch (error) {
        console.error('Generate export error:', error);
        throw new Error(`Failed to generate export: ${error.message}`);
    } finally {
        console.log(`Export generated for analysis: ${analysisId}, format: ${format}`);
    }
}

/**
 * Re-export all export functions for backward compatibility
 */
module.exports = {
    generateExport,
    generateCsvExport,
    generateJsonExport,
    escapeCSVField,
    calculateTotalViews,
    calculateAverageViews,
    findMostViewedVideo
};