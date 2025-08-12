/**
 * @fileoverview ID generation utilities - DEPRECATED
 * @author Backend Team
 * @deprecated Use /utils/analysisIdGenerator.js instead
 */

const { globalGenerator } = require('./analysisIdGenerator');

/**
 * Generate unique analysis ID
 * @deprecated Use globalGenerator.generateMainAnalysisId() instead
 * @returns {Promise<string>} Unique analysis ID
 */
async function generateAnalysisId() {
    try {
        console.warn('DEPRECATED: generateAnalysisId() is deprecated. Use globalGenerator.generateMainAnalysisId() instead');
        return await globalGenerator.generateMainAnalysisId();
    } catch (error) {
        console.error('Generate analysis ID error:', error);
        throw error;
    } finally {
        console.log('Analysis ID generated');
    }
}

module.exports = {
    generateAnalysisId
};