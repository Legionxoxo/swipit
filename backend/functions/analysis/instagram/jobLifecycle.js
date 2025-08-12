/**
 * @fileoverview Instagram analysis job lifecycle management
 * @author Backend Team
 */

// Import type definitions
require('../../../types/common');

const { 
    createAnalysisJob, 
    updateAnalysisStatus, 
    storeProfileData, 
    storeReelData, 
    getAnalysisJob, 
    getAnalysisResults 
} = require('../../../database/instagram/index');

// const { executeInstagramScraper } = require('../../../utils/python/pythonExecutor'); // Disabled - converted to Node.js
const { generateAnalysisId } = require('../../../utils/helpers');

/**
 * @typedef {Object} InstagramAnalysisJob
 * @property {string} analysisId - Unique analysis ID
 * @property {string} username - Instagram username
 * @property {string} instagramUserId - Instagram user ID
 * @property {string} status - Current status (pending, processing, completed, failed)
 * @property {number} progress - Progress percentage (0-100)
 * @property {Date} startTime - Analysis start time
 * @property {Date} [endTime] - Analysis end time
 * @property {Object} [profileData] - Profile information
 * @property {Array} [reelsData] - Reels data
 * @property {number} [totalReels] - Total number of reels
 * @property {string} [error] - Error message if failed
 */

/**
 * Start Instagram profile analysis
 * @param {string} username - Instagram username
 * @param {string} [sessionId] - Optional extension session ID for cookie sharing
 * @returns {Promise<{analysisId: string, estimatedTime: string}>} Analysis job info
 */
async function startInstagramAnalysis(username, sessionId = null) {
    try {
        if (!username) {
            throw new Error('Username is required');
        }

        // Clean username (remove @ if present)
        const cleanUsername = username.replace('@', '').trim();
        
        if (!cleanUsername) {
            throw new Error('Valid username is required');
        }

        // Generate unique analysis ID
        const analysisId = generateAnalysisId();
        
        // Create initial job in database with pending status
        // Note: We don't have Instagram user ID yet, will be updated during processing
        await createAnalysisJob(analysisId, 'unknown', cleanUsername);
        
        // Start background processing
        processInstagramAnalysis(analysisId, cleanUsername, sessionId).catch(error => {
            console.error(`Instagram analysis ${analysisId} failed:`, error);
            updateAnalysisStatus(analysisId, 'failed', 0, error.message);
        });

        return {
            analysisId,
            estimatedTime: '1-5 minutes depending on profile size'
        };

    } catch (error) {
        console.error('Start Instagram analysis error:', error);
        throw new Error(`Failed to start Instagram analysis: ${error.message}`);
    } finally {
        console.log(`Instagram analysis started for username: ${username}`);
    }
}

/**
 * Process Instagram analysis in background with database storage
 * @param {string} analysisId - Analysis ID
 * @param {string} username - Instagram username
 * @param {string} [sessionId] - Optional extension session ID for cookie sharing
 * @returns {Promise<void>}
 */
async function processInstagramAnalysis(analysisId, username, sessionId = null) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        if (!username) {
            throw new Error('Username is required');
        }

        // Update status to processing
        await updateAnalysisStatus(analysisId, 'processing', 10);

        // Get extension cookies if session ID provided
        let extensionCookies = null;
        if (sessionId) {
            try {
                const { getSessionCookies } = require('../../../routes/api/extension');
                extensionCookies = getSessionCookies(sessionId, 'instagram');
                if (extensionCookies) {
                    console.log(`🍪 Using extension cookies for Instagram analysis: ${analysisId}`);
                } else {
                    console.log(`⚠️ No extension cookies found for session: ${sessionId}`);
                }
            } catch (cookieError) {
                console.error('Failed to get extension cookies:', cookieError);
                // Continue without cookies - don't fail the analysis
            }
        }

        // Execute Python scraper with progress tracking
        const progressCallback = async (progressData) => {
            try {
                if (progressData.progress !== undefined) {
                    // Map Python progress to our system (10-90% range)
                    const mappedProgress = Math.max(10, Math.min(90, progressData.progress));
                    await updateAnalysisStatus(analysisId, 'processing', mappedProgress);
                }
            } catch (progressError) {
                console.error('Progress update error:', progressError);
                // Don't fail the whole process for progress update errors
            }
        };

        // Instagram scraper functionality disabled - Python server removed
        throw new Error('Instagram profile scraping is temporarily disabled. Please use the oEmbed functionality instead.');

    } catch (error) {
        console.error(`Process Instagram analysis ${analysisId} error:`, error);
        await updateAnalysisStatus(analysisId, 'failed', 0, error.message);
        throw error;
    } finally {
        console.log(`Instagram analysis processing completed for: ${analysisId}`);
    }
}

/**
 * Update Instagram analysis progress (for external use)
 * @param {string} analysisId - Analysis ID
 * @param {string} status - Status (pending, processing, completed, failed)
 * @param {number} progress - Progress percentage (0-100)
 * @param {string} [errorMessage] - Error message if failed
 * @returns {Promise<Object>} Update result
 */
async function updateInstagramAnalysisStatus(analysisId, status, progress, errorMessage = null) {
    try {
        return await updateAnalysisStatus(analysisId, status, progress, errorMessage);
    } catch (error) {
        console.error('Update Instagram analysis status error:', error);
        throw new Error(`Failed to update Instagram analysis status: ${error.message}`);
    } finally {
        console.log(`Instagram analysis status update: ${analysisId} -> ${status} (${progress}%)`);
    }
}

/**
 * Get all active Instagram analysis jobs (for monitoring)
 * @returns {Promise<Array>} Array of active jobs
 */
async function getAllActiveInstagramJobs() {
    try {
        // This would require a more complex query to get all active jobs
        // For now, return empty array as this is mainly for monitoring
        return [];
    } catch (error) {
        console.error('Get all active Instagram jobs error:', error);
        return [];
    } finally {
        console.log('Active Instagram jobs retrieved');
    }
}

module.exports = {
    startInstagramAnalysis,
    processInstagramAnalysis,
    updateInstagramAnalysisStatus,
    getAllActiveInstagramJobs
};