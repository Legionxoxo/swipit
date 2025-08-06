/**
 * @fileoverview Instagram analysis route functions - consolidated exports
 * @author Backend Team
 */

// Import type definitions
require('../../types/common');

const { analyzeInstagramProfile, getInstagramAnalysis } = require('../../utils/instagram/instagramService');

/**
 * @typedef {Object} InstagramAnalysisJobResponse
 * @property {string} analysisId - Unique analysis ID
 * @property {string} status - Current status (pending, processing, completed, failed)
 * @property {number} progress - Progress percentage (0-100)
 * @property {Object} [profile] - Profile information
 * @property {Array} [reels] - Reels data
 * @property {Object} [reelSegments] - Reels segmented by engagement
 * @property {number} [totalReels] - Total number of reels
 * @property {string} [error] - Error message if failed
 */

/**
 * Start Instagram profile analysis
 * @param {string} username - Instagram username
 * @param {string} [sessionId] - Optional extension session ID for cookie sharing
 * @returns {Promise<{analysisId: string, estimatedTime: string}>} Analysis job info
 */
async function analyzeInstagram(username, sessionId = null) {
    try {
        if (!username) {
            throw new Error('Username is required');
        }

        if (typeof username !== 'string') {
            throw new Error('Username must be a string');
        }

        // Trim and validate username
        const trimmedUsername = username.trim();
        if (!trimmedUsername) {
            throw new Error('Username cannot be empty');
        }

        // Start Instagram analysis using service layer
        const analysisResult = await analyzeInstagramProfile(trimmedUsername, sessionId);

        return {
            analysisId: analysisResult.analysisId,
            estimatedTime: analysisResult.estimatedTime
        };

    } catch (error) {
        console.error('Analyze Instagram error:', error);
        throw new Error(`Failed to start Instagram analysis: ${error.message}`);
    } finally {
        console.log(`Instagram analysis started for username: ${username}`);
    }
}

/**
 * Get Instagram analysis status and results
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<InstagramAnalysisJobResponse|null>} Analysis job data
 */
async function getInstagramAnalysisStatus(analysisId) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        if (typeof analysisId !== 'string') {
            throw new Error('Analysis ID must be a string');
        }

        // Trim and validate analysis ID
        const trimmedAnalysisId = analysisId.trim();
        if (!trimmedAnalysisId) {
            throw new Error('Analysis ID cannot be empty');
        }

        // Get Instagram analysis using service layer
        const analysisData = await getInstagramAnalysis(trimmedAnalysisId);
        
        if (!analysisData) {
            return null;
        }

        return {
            analysisId: analysisData.analysisId,
            status: analysisData.status,
            progress: analysisData.progress,
            profile: analysisData.profile,
            reels: analysisData.reels,
            reelSegments: analysisData.reelSegments,
            totalReels: analysisData.totalReels,
            error: analysisData.error
        };

    } catch (error) {
        console.error('Get Instagram analysis status error:', error);
        throw new Error(`Failed to get Instagram analysis status: ${error.message}`);
    } finally {
        console.log(`Instagram status requested for analysis: ${analysisId}`);
    }
}

/**
 * Validate Instagram username format (for route validation)
 * @param {string} username - Username to validate
 * @returns {Object} Validation result
 */
function validateInstagramUsernameFormat(username) {
    try {
        if (!username || typeof username !== 'string') {
            return {
                valid: false,
                error: 'Username is required and must be a string'
            };
        }

        const trimmedUsername = username.trim();
        
        if (!trimmedUsername) {
            return {
                valid: false,
                error: 'Username cannot be empty'
            };
        }

        if (trimmedUsername.length > 50) {
            return {
                valid: false,
                error: 'Username is too long (max 50 characters)'
            };
        }

        // Basic format check (will be validated more thoroughly in service layer)
        const basicPattern = /^@?[a-zA-Z0-9._]+$/;
        if (!basicPattern.test(trimmedUsername)) {
            return {
                valid: false,
                error: 'Username contains invalid characters'
            };
        }

        return {
            valid: true,
            cleanUsername: trimmedUsername.replace('@', '')
        };

    } catch (error) {
        console.error('Instagram username validation error:', error);
        return {
            valid: false,
            error: 'Username validation failed'
        };
    } finally {
        console.log(`Instagram username format validation attempted: ${username}`);
    }
}

/**
 * Validate analysis ID format (for route validation)
 * @param {string} analysisId - Analysis ID to validate
 * @returns {Object} Validation result
 */
function validateAnalysisIdFormat(analysisId) {
    try {
        if (!analysisId || typeof analysisId !== 'string') {
            return {
                valid: false,
                error: 'Analysis ID is required and must be a string'
            };
        }

        const trimmedId = analysisId.trim();
        
        if (!trimmedId) {
            return {
                valid: false,
                error: 'Analysis ID cannot be empty'
            };
        }

        // Basic UUID format check
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidPattern.test(trimmedId)) {
            return {
                valid: false,
                error: 'Analysis ID must be a valid UUID format'
            };
        }

        return {
            valid: true,
            cleanAnalysisId: trimmedId
        };

    } catch (error) {
        console.error('Analysis ID validation error:', error);
        return {
            valid: false,
            error: 'Analysis ID validation failed'
        };
    } finally {
        console.log(`Analysis ID format validation attempted: ${analysisId}`);
    }
}

/**
 * Re-export Instagram analysis functions for backward compatibility and consistency
 */
module.exports = {
    analyzeInstagram,
    getInstagramAnalysisStatus,
    validateInstagramUsernameFormat,
    validateAnalysisIdFormat
};