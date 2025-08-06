/**
 * @fileoverview YouTube database operations - main exports
 * @author Backend Team
 */

// Import all YouTube database modules
const { createAnalysisJob, updateAnalysisStatus, getAnalysisJob, deleteAnalysisJob, getAllCompletedAnalyses, findExistingAnalysis } = require('./youtubeJobs');
const { storeChannelData, getChannelData } = require('./youtubeChannel');
const { storeVideoData, getVideosByAnalysis, getVideoCount } = require('./youtubeVideos');
const { getAnalysisResults, getAnalysisSummary } = require('./youtubeResults');

// Re-export all functions for backward compatibility
module.exports = {
    // Job management
    createAnalysisJob,
    updateAnalysisStatus,
    getAnalysisJob,
    deleteAnalysisJob,
    getAllCompletedAnalyses,
    findExistingAnalysis,
    
    // Channel management
    storeChannelData,
    getChannelData,
    
    // Video management
    storeVideoData,
    getVideosByAnalysis,
    getVideoCount,
    
    // Results aggregation
    getAnalysisResults,
    getAnalysisSummary
};