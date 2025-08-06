/**
 * @fileoverview Instagram reel data formatting and comprehensive analysis
 * @author Backend Team
 */

const { calculateReelEngagementStats, findTopPerformingReels } = require('./reelStats');
const { analyzeHashtagUsage, analyzeMentionUsage } = require('./reelAnalysis');

/**
 * @typedef {Object} ReelPerformanceAnalysis
 * @property {Object} topPerforming - Top performing reels by metric
 * @property {Object} stats - Overall engagement statistics
 * @property {Object} hashtags - Hashtag analysis
 * @property {Object} mentions - Mention analysis
 */

/**
 * Perform comprehensive reel performance analysis
 * @param {Array<Object>} reels - Array of reel data
 * @returns {ReelPerformanceAnalysis} Complete performance analysis
 */
function performReelAnalysis(reels) {
    try {
        if (!reels || !Array.isArray(reels)) {
            throw new Error('Reels data is required and must be an array');
        }

        const stats = calculateReelEngagementStats(reels);
        const topPerforming = findTopPerformingReels(reels);
        const hashtags = analyzeHashtagUsage(reels);
        const mentions = analyzeMentionUsage(reels);

        return {
            topPerforming,
            stats,
            hashtags,
            mentions
        };

    } catch (error) {
        console.error('Perform reel analysis error:', error);
        throw new Error(`Failed to perform reel analysis: ${error.message}`);
    } finally {
        console.log(`Complete reel analysis performed for ${reels ? reels.length : 0} reels`);
    }
}

/**
 * Format reels data for export
 * @param {Array<Object>} reels - Array of reel data
 * @returns {Array<Object>} Export-formatted reels data
 */
function formatReelsForExport(reels) {
    try {
        if (!reels || !Array.isArray(reels)) {
            return [];
        }

        return reels.map(reel => ({
            id: reel.id,
            shortcode: reel.shortcode,
            url: reel.url,
            thumbnailUrl: reel.thumbnailUrl,
            caption: reel.caption,
            likes: reel.likes || 0,
            comments: reel.comments || 0,
            views: reel.views || 0,
            datePosted: reel.datePosted,
            duration: reel.duration || 0,
            hashtags: Array.isArray(reel.hashtags) ? reel.hashtags.join(', ') : '',
            mentions: Array.isArray(reel.mentions) ? reel.mentions.join(', ') : '',
            engagementScore: (reel.likes || 0) + (reel.comments || 0),
            engagementRate: reel.views > 0 ? Math.round(((reel.likes || 0) + (reel.comments || 0)) / reel.views * 100 * 100) / 100 : 0
        }));

    } catch (error) {
        console.error('Format reels for export error:', error);
        throw new Error(`Failed to format reels for export: ${error.message}`);
    } finally {
        console.log(`Reels formatted for export: ${reels ? reels.length : 0} reels`);
    }
}

module.exports = {
    performReelAnalysis,
    formatReelsForExport
};