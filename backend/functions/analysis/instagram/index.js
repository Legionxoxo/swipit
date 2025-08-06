/**
 * @fileoverview Instagram analysis functions - main exports
 * @author Backend Team
 */

// Import all Instagram analysis modules
const { startInstagramAnalysis, processInstagramAnalysis, updateInstagramAnalysisStatus, getAllActiveInstagramJobs } = require('./jobLifecycle');
const { getInstagramAnalysisStatus, segmentReelsByEngagement, calculateProcessingTime } = require('./dataProcessor');

// Re-export all functions for backward compatibility
module.exports = {
    // Job lifecycle management
    startInstagramAnalysis,
    processInstagramAnalysis,
    updateInstagramAnalysisStatus,
    getAllActiveInstagramJobs,
    
    // Data processing and analysis
    getInstagramAnalysisStatus,
    segmentReelsByEngagement,
    calculateProcessingTime
};