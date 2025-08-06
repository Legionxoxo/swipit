/**
 * @fileoverview YouTube database connection and operations
 * @author Backend Team
 */

const { getDatabase } = require('./connection');
const youtubeDb = require('./youtube');

/**
 * @typedef {Object} YouTubeDbOperations
 * @property {Function} createAnalysisJob - Create new analysis job
 * @property {Function} updateAnalysisStatus - Update job status and progress
 * @property {Function} getAnalysisJob - Get analysis job by ID
 * @property {Function} deleteAnalysisJob - Delete analysis job
 * @property {Function} storeChannelData - Store channel information
 * @property {Function} getChannelData - Get channel data by analysis ID
 * @property {Function} storeVideoData - Store video data array
 * @property {Function} getVideosByAnalysis - Get videos by analysis ID
 * @property {Function} getVideoCount - Get video count by analysis ID
 * @property {Function} getAnalysisResults - Get complete analysis results
 * @property {Function} getAnalysisSummary - Get analysis summary
 */

// Re-export all YouTube database functions for easy access
module.exports = {
    // Direct database access
    getDatabase,
    
    // Job management functions
    createAnalysisJob: youtubeDb.createAnalysisJob,
    updateAnalysisStatus: youtubeDb.updateAnalysisStatus,
    getAnalysisJob: youtubeDb.getAnalysisJob,
    deleteAnalysisJob: youtubeDb.deleteAnalysisJob,
    getAllCompletedAnalyses: youtubeDb.getAllCompletedAnalyses,
    findExistingAnalysis: youtubeDb.findExistingAnalysis,
    
    // Channel management functions
    storeChannelData: youtubeDb.storeChannelData,
    getChannelData: youtubeDb.getChannelData,
    
    // Video management functions
    storeVideoData: youtubeDb.storeVideoData,
    getVideosByAnalysis: youtubeDb.getVideosByAnalysis,
    getVideoCount: youtubeDb.getVideoCount,
    
    // Results aggregation functions
    getAnalysisResults: youtubeDb.getAnalysisResults,
    getAnalysisSummary: youtubeDb.getAnalysisSummary
};