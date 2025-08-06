/**
 * @fileoverview Validation utilities
 * @author Backend Team
 */

/**
 * Validate YouTube API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} Whether the API key format is valid
 */
function validateApiKeyFormat(apiKey) {
    try {
        if (!apiKey || typeof apiKey !== 'string') {
            return false;
        }

        // YouTube API keys are typically 39 characters long and start with "AIza"
        const apiKeyPattern = /^AIza[0-9A-Za-z_-]{35}$/;
        return apiKeyPattern.test(apiKey);

    } catch (error) {
        console.error('Validate API key format error:', error);
        return false;
    } finally {
        console.log('API key format validation completed');
    }
}

module.exports = {
    validateApiKeyFormat
};