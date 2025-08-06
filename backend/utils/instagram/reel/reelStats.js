/**
 * @fileoverview Instagram reel statistical calculations
 * @author Backend Team
 */

/**
 * @typedef {Object} ReelEngagementStats
 * @property {number} totalLikes - Total likes across all reels
 * @property {number} totalComments - Total comments across all reels
 * @property {number} totalViews - Total views across all reels
 * @property {number} averageLikes - Average likes per reel
 * @property {number} averageComments - Average comments per reel
 * @property {number} averageViews - Average views per reel
 * @property {number} engagementRate - Overall engagement rate
 */

/**
 * Calculate engagement statistics for reels
 * @param {Array<Object>} reels - Array of reel data
 * @returns {ReelEngagementStats} Engagement statistics
 */
function calculateReelEngagementStats(reels) {
    try {
        if (!reels || !Array.isArray(reels) || reels.length === 0) {
            return {
                totalLikes: 0,
                totalComments: 0,
                totalViews: 0,
                averageLikes: 0,
                averageComments: 0,
                averageViews: 0,
                engagementRate: 0
            };
        }

        let totalLikes = 0;
        let totalComments = 0;
        let totalViews = 0;

        reels.forEach(reel => {
            totalLikes += reel.likes || 0;
            totalComments += reel.comments || 0;
            totalViews += reel.views || 0;
        });

        const reelCount = reels.length;
        const averageLikes = reelCount > 0 ? Math.round(totalLikes / reelCount) : 0;
        const averageComments = reelCount > 0 ? Math.round(totalComments / reelCount) : 0;
        const averageViews = reelCount > 0 ? Math.round(totalViews / reelCount) : 0;

        // Calculate engagement rate (likes + comments) / views * 100
        const totalEngagement = totalLikes + totalComments;
        const engagementRate = totalViews > 0 ? Math.round((totalEngagement / totalViews) * 100 * 100) / 100 : 0;

        return {
            totalLikes,
            totalComments,
            totalViews,
            averageLikes,
            averageComments,
            averageViews,
            engagementRate
        };

    } catch (error) {
        console.error('Calculate reel engagement stats error:', error);
        throw new Error(`Failed to calculate engagement stats: ${error.message}`);
    } finally {
        console.log(`Reel engagement stats calculated for ${reels ? reels.length : 0} reels`);
    }
}

/**
 * Find top performing reels by different metrics
 * @param {Array<Object>} reels - Array of reel data
 * @param {number} topCount - Number of top reels to return (default: 5)
 * @returns {Object} Top performing reels by various metrics
 */
function findTopPerformingReels(reels, topCount = 5) {
    try {
        if (!reels || !Array.isArray(reels) || reels.length === 0) {
            return {
                byLikes: [],
                byComments: [],
                byViews: [],
                byEngagement: []
            };
        }

        const sortedByLikes = [...reels]
            .sort((a, b) => (b.likes || 0) - (a.likes || 0))
            .slice(0, topCount);

        const sortedByComments = [...reels]
            .sort((a, b) => (b.comments || 0) - (a.comments || 0))
            .slice(0, topCount);

        const sortedByViews = [...reels]
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, topCount);

        // Calculate engagement score for each reel (likes + comments)
        const reelsWithEngagement = reels.map(reel => ({
            ...reel,
            engagementScore: (reel.likes || 0) + (reel.comments || 0)
        }));

        const sortedByEngagement = reelsWithEngagement
            .sort((a, b) => b.engagementScore - a.engagementScore)
            .slice(0, topCount);

        return {
            byLikes: sortedByLikes,
            byComments: sortedByComments,
            byViews: sortedByViews,
            byEngagement: sortedByEngagement
        };

    } catch (error) {
        console.error('Find top performing reels error:', error);
        throw new Error(`Failed to find top performing reels: ${error.message}`);
    } finally {
        console.log(`Top performing reels analysis completed for ${reels ? reels.length : 0} reels`);
    }
}

module.exports = {
    calculateReelEngagementStats,
    findTopPerformingReels
};