/**
 * @fileoverview Instagram service - main orchestrator for Instagram operations
 * @author Backend Team
 */

const { startInstagramAnalysis, getInstagramAnalysisStatus } = require('../../functions/analysis/instagramJobManager');
const { validateInstagramUsername } = require('./profileResolver');
const { segmentReelsByEngagement } = require('../../functions/analysis/instagramJobManager');

/**
 * @typedef {Object} InstagramAnalysisResult
 * @property {string} analysisId - Analysis ID
 * @property {string} status - Analysis status
 * @property {number} progress - Progress percentage
 * @property {Object} [profile] - Profile information
 * @property {Array} [reels] - Reels data
 * @property {Object} [reelSegments] - Reels segmented by engagement
 * @property {number} [totalReels] - Total number of reels
 * @property {Object} [pagination] - Pagination information
 * @property {string} [error] - Error message if failed
 */

/**
 * Start Instagram profile analysis
 * @param {string} username - Instagram username
 * @param {string} [sessionId] - Optional extension session ID for cookie sharing
 * @returns {Promise<{analysisId: string, estimatedTime: string}>} Analysis job info
 */
async function analyzeInstagramProfile(username, sessionId = null) {
    try {
        if (!username) {
            throw new Error('Username is required');
        }

        // Validate username format
        const validationResult = validateInstagramUsername(username);
        if (!validationResult.valid) {
            throw new Error(`Invalid username: ${validationResult.error}`);
        }

        // Start analysis using job manager
        const result = await startInstagramAnalysis(validationResult.cleanUsername, sessionId);

        return {
            analysisId: result.analysisId,
            estimatedTime: result.estimatedTime,
        };

    } catch (error) {
        console.error('Analyze Instagram profile error:', error);
        throw new Error(`Failed to analyze Instagram profile: ${error.message}`);
    } finally {
        console.log(`Instagram profile analysis requested: ${username}`);
    }
}

/**
 * Get Instagram analysis status and results
 * @param {string} analysisId - Analysis ID
 * @param {number} [page=1] - Page number for pagination
 * @param {number} [limit=50] - Items per page
 * @returns {Promise<InstagramAnalysisResult|null>} Analysis results
 */
async function getInstagramAnalysis(analysisId, page = 1, limit = 50) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        // Get analysis status from job manager with pagination
        const analysisData = await getInstagramAnalysisStatus(analysisId, page, limit);
        
        if (!analysisData) {
            return null;
        }

        // If completed, segment reels by engagement
        let reelSegments = null;
        if (analysisData.status === 'completed' && analysisData.reels) {
            reelSegments = segmentReelsByEngagement(analysisData.reels);
        }

        return {
            analysisId: analysisData.analysisId,
            status: analysisData.status,
            progress: analysisData.progress,
            profile: analysisData.profile,
            reels: analysisData.reels || [],
            reelSegments: reelSegments,
            totalReels: analysisData.totalReels || 0,
            pagination: analysisData.pagination,
            error: analysisData.error,
        };

    } catch (error) {
        console.error('Get Instagram analysis error:', error);
        throw new Error(`Failed to get Instagram analysis: ${error.message}`);
    } finally {
        console.log(`Instagram analysis status requested: ${analysisId}, page: ${page}, limit: ${limit}`);
    }
}

/**
 * Get Instagram analysis results for export
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<Object|null>} Export-ready analysis data
 */
async function getInstagramAnalysisForExport(analysisId) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        const analysisData = await getInstagramAnalysis(analysisId);
        
        if (!analysisData || analysisData.status !== 'completed') {
            return null;
        }

        // Format data for export
        return {
            analysisId: analysisData.analysisId,
            profile: analysisData.profile,
            reels: analysisData.reels,
            reelSegments: analysisData.reelSegments,
            summary: {
                totalReels: analysisData.totalReels,
                    analyzedAt: new Date().toISOString(),
                username: analysisData.profile?.username
            }
        };

    } catch (error) {
        console.error('Get Instagram analysis for export error:', error);
        throw new Error(`Failed to get Instagram analysis for export: ${error.message}`);
    } finally {
        console.log(`Instagram analysis export data requested: ${analysisId}`);
    }
}

/**
 * Validate if analysis is ready for export
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<boolean>} Whether analysis is ready for export
 */
async function isAnalysisReadyForExport(analysisId) {
    try {
        if (!analysisId) {
            return false;
        }

        const analysisData = await getInstagramAnalysis(analysisId);
        return analysisData && analysisData.status === 'completed';

    } catch (error) {
        console.error('Check analysis ready for export error:', error);
        return false;
    } finally {
        console.log(`Instagram analysis export readiness checked: ${analysisId}`);
    }
}

module.exports = {
    analyzeInstagramProfile,
    getInstagramAnalysis,
    getInstagramAnalysisForExport,
    isAnalysisReadyForExport
};