/**
 * @fileoverview Instagram data processing and analysis utilities
 * @author Backend Team
 */

const { getAnalysisJob, getAnalysisResults } = require('../../../database/instagram/index');

/**
 * Get Instagram analysis status and results
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<Object|null>} Analysis data with results
 */
async function getInstagramAnalysisStatus(analysisId) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        // Get job status
        const job = await getAnalysisJob(analysisId);
        
        if (!job) {
            return null;
        }

        // If completed, get full results including reels
        if (job.status === 'completed') {
            const fullResults = await getAnalysisResults(analysisId);
            
            if (fullResults) {
                return {
                    analysisId: fullResults.analysisId,
                    status: fullResults.status,
                    progress: fullResults.progress,
                    profile: fullResults.profile,
                    reels: fullResults.reels,
                    totalReels: fullResults.totalReels,
                    processingTime: Math.round((fullResults.updatedAt.getTime() - fullResults.createdAt.getTime()) / 1000),
                    createdAt: fullResults.createdAt,
                    updatedAt: fullResults.updatedAt
                };
            }
        }

        // Return job status for pending/processing/failed
        return {
            analysisId: job.analysisId,
            status: job.status,
            progress: job.progress,
            error: job.error,
            profile: job.instagramUserId ? {
                username: job.username,
                instagramUserId: job.instagramUserId
            } : null,
            reels: [],
            totalReels: 0,
            processingTime: Math.round((job.updatedAt.getTime() - job.createdAt.getTime()) / 1000),
            createdAt: job.createdAt,
            updatedAt: job.updatedAt
        };

    } catch (error) {
        console.error('Get Instagram analysis status error:', error);
        throw new Error(`Failed to get Instagram analysis status: ${error.message}`);
    } finally {
        console.log(`Instagram analysis status requested for: ${analysisId}`);
    }
}

/**
 * Segment Instagram reels by engagement levels (similar to YouTube video segments)
 * @param {Array} reels - Array of reel data
 * @returns {Object} Segmented reels by engagement
 */
function segmentReelsByEngagement(reels) {
    try {
        const segments = {
            low: [],        // 0-1,000 likes
            medium: [],     // 1,001-10,000 likes
            high: [],       // 10,001-100,000 likes
            veryHigh: [],   // 100,001-1,000,000 likes
            viral: []       // 1,000,001+ likes
        };

        if (!reels || !Array.isArray(reels)) {
            return segments;
        }

        reels.forEach(reel => {
            const likeCount = reel.likes || 0;
            
            if (likeCount <= 1000) {
                segments.low.push(reel);
            } else if (likeCount <= 10000) {
                segments.medium.push(reel);
            } else if (likeCount <= 100000) {
                segments.high.push(reel);
            } else if (likeCount <= 1000000) {
                segments.veryHigh.push(reel);
            } else {
                segments.viral.push(reel);
            }
        });

        return segments;

    } catch (error) {
        console.error('Segment reels error:', error);
        throw new Error(`Failed to segment reels: ${error.message}`);
    } finally {
        console.log(`Reels segmented: ${reels ? reels.length : 0} total reels`);
    }
}

/**
 * Calculate processing time for analysis
 * @param {Date} startTime - Analysis start time
 * @param {Date} endTime - Analysis end time
 * @returns {number} Processing time in seconds
 */
function calculateProcessingTime(startTime, endTime) {
    try {
        if (!startTime || !endTime) {
            return 0;
        }
        
        return Math.round((endTime.getTime() - startTime.getTime()) / 1000);
    } catch (error) {
        console.error('Calculate processing time error:', error);
        return 0;
    }
}

module.exports = {
    getInstagramAnalysisStatus,
    segmentReelsByEngagement,
    calculateProcessingTime
};