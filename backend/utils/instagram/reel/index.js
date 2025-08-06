/**
 * @fileoverview Instagram reel utilities - main exports
 * @author Backend Team
 */

// Import all reel utility modules
const { calculateReelEngagementStats, findTopPerformingReels } = require('./reelStats');
const { analyzeHashtagUsage, analyzeMentionUsage } = require('./reelAnalysis');
const { performReelAnalysis, formatReelsForExport } = require('./reelFormatting');

// Re-export all functions for backward compatibility
module.exports = {
    // Statistical calculations
    calculateReelEngagementStats,
    findTopPerformingReels,
    
    // Content analysis
    analyzeHashtagUsage,
    analyzeMentionUsage,
    
    // Comprehensive analysis and formatting
    performReelAnalysis,
    formatReelsForExport
};