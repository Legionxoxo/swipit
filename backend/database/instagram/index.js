/**
 * @fileoverview Instagram database operations - main exports
 * @author Backend Team
 */

// Import all Instagram database modules
const { createAnalysisJob, updateAnalysisStatus, getAnalysisJob, deleteAnalysisJob } = require('./instagramJobs');
const { storeProfileData, getProfileData } = require('./instagramProfile');
const { storeReelData, getReelsByAnalysis, getReelCount } = require('./instagramReels');
const { getAnalysisResults, getAnalysisSummary } = require('./instagramResults');

// Re-export all functions for backward compatibility
module.exports = {
    // Job management
    createAnalysisJob,
    updateAnalysisStatus,
    getAnalysisJob,
    deleteAnalysisJob,
    
    // Profile management
    storeProfileData,
    getProfileData,
    
    // Reel management
    storeReelData,
    getReelsByAnalysis,
    getReelCount,
    
    // Results aggregation
    getAnalysisResults,
    getAnalysisSummary
};