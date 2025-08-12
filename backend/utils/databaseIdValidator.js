/**
 * @fileoverview Database-aware ID validation utilities
 * @author Backend Team
 */

const { getDatabase } = require('../database/connection');
const { globalGenerator, generateUniqueIdWithDbCheck } = require('./analysisIdGenerator');

/**
 * Check if analysis ID exists in YouTube database
 * @param {string} analysisId - Analysis ID to check
 * @returns {Promise<boolean>} True if exists, false otherwise
 */
async function checkYouTubeAnalysisIdExists(analysisId) {
    try {
        const db = await getDatabase();
        const result = await db.get(
            'SELECT 1 FROM youtube_data WHERE analysis_id = ? LIMIT 1',
            [analysisId]
        );
        return !!result;
    } catch (error) {
        console.error('YouTube analysis ID check error:', error);
        throw new Error(`Failed to check YouTube analysis ID: ${error.message}`);
    } finally {
        console.log('YouTube analysis ID check completed');
    }
}

/**
 * Check if analysis ID exists in Instagram database
 * @param {string} analysisId - Analysis ID to check
 * @returns {Promise<boolean>} True if exists, false otherwise
 */
async function checkInstagramAnalysisIdExists(analysisId) {
    try {
        const db = await getDatabase();
        const result = await db.get(
            'SELECT 1 FROM instagram_data WHERE analysis_id = ? LIMIT 1',
            [analysisId]
        );
        return !!result;
    } catch (error) {
        console.error('Instagram analysis ID check error:', error);
        throw new Error(`Failed to check Instagram analysis ID: ${error.message}`);
    } finally {
        console.log('Instagram analysis ID check completed');
    }
}

/**
 * Check if analysis ID exists in any database
 * @param {string} analysisId - Analysis ID to check
 * @returns {Promise<boolean>} True if exists, false otherwise
 */
async function checkAnalysisIdExists(analysisId) {
    try {
        const [youtubeExists, instagramExists] = await Promise.all([
            checkYouTubeAnalysisIdExists(analysisId),
            checkInstagramAnalysisIdExists(analysisId)
        ]);
        
        return youtubeExists || instagramExists;
    } catch (error) {
        console.error('Analysis ID existence check error:', error);
        throw new Error(`Failed to check analysis ID existence: ${error.message}`);
    } finally {
        console.log('Analysis ID existence check completed');
    }
}

/**
 * Generate database-unique main analysis ID
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Database-unique analysis ID
 */
async function generateUniqueMainAnalysisId(options = {}) {
    return generateUniqueIdWithDbCheck(
        checkAnalysisIdExists,
        () => globalGenerator.generateMainAnalysisId(options)
    );
}

/**
 * Generate database-unique oEmbed analysis ID
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Database-unique oEmbed analysis ID
 */
async function generateUniqueOEmbedAnalysisId(options = {}) {
    return generateUniqueIdWithDbCheck(
        checkAnalysisIdExists,
        () => globalGenerator.generateOEmbedAnalysisId(options)
    );
}

/**
 * Generate database-unique CSV analysis ID
 * @param {string} username - Username for context
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Database-unique CSV analysis ID
 */
async function generateUniqueCSVAnalysisId(username, options = {}) {
    return generateUniqueIdWithDbCheck(
        checkAnalysisIdExists,
        () => globalGenerator.generateCSVAnalysisId(username, options)
    );
}

/**
 * Generate database-unique Instagram profile ID
 * @param {string} userId - Instagram user ID
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Database-unique Instagram profile ID
 */
async function generateUniqueInstagramProfileId(userId, options = {}) {
    return generateUniqueIdWithDbCheck(
        checkInstagramAnalysisIdExists,
        () => globalGenerator.generateInstagramProfileId(userId, options)
    );
}

/**
 * Generate database-unique Instagram reel ID
 * @param {string} reelId - Instagram reel ID
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Database-unique Instagram reel ID
 */
async function generateUniqueInstagramReelId(reelId, options = {}) {
    return generateUniqueIdWithDbCheck(
        checkInstagramAnalysisIdExists,
        () => globalGenerator.generateInstagramReelId(reelId, options)
    );
}

/**
 * Generate database-unique YouTube creator ID
 * @param {string} channelId - YouTube channel ID
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Database-unique YouTube creator ID
 */
async function generateUniqueYouTubeCreatorId(channelId, options = {}) {
    return generateUniqueIdWithDbCheck(
        checkYouTubeAnalysisIdExists,
        () => globalGenerator.generateYouTubeCreatorId(channelId, options)
    );
}

/**
 * Audit database for duplicate analysis IDs
 * @returns {Promise<Object>} Audit results
 */
async function auditDuplicateAnalysisIds() {
    try {
        const db = await getDatabase();
        
        // Check YouTube duplicates
        const youtubeDuplicates = await db.all(`
            SELECT analysis_id, COUNT(*) as count 
            FROM youtube_data 
            GROUP BY analysis_id 
            HAVING count > 1
            ORDER BY count DESC
        `);
        
        // Check Instagram duplicates
        const instagramDuplicates = await db.all(`
            SELECT analysis_id, COUNT(*) as count 
            FROM instagram_data 
            GROUP BY analysis_id 
            HAVING count > 1
            ORDER BY count DESC
        `);
        
        // Check cross-platform duplicates
        const crossPlatformDuplicates = await db.all(`
            SELECT y.analysis_id, 'cross-platform' as type
            FROM youtube_data y
            INNER JOIN instagram_data i ON y.analysis_id = i.analysis_id
            GROUP BY y.analysis_id
        `);
        
        const auditResults = {
            youtubeDuplicates: youtubeDuplicates.length,
            instagramDuplicates: instagramDuplicates.length,
            crossPlatformDuplicates: crossPlatformDuplicates.length,
            details: {
                youtube: youtubeDuplicates,
                instagram: instagramDuplicates,
                crossPlatform: crossPlatformDuplicates
            },
            timestamp: new Date().toISOString()
        };
        
        console.log('Database duplicate audit completed:', {
            youtube: youtubeDuplicates.length,
            instagram: instagramDuplicates.length,
            crossPlatform: crossPlatformDuplicates.length
        });
        
        return auditResults;
        
    } catch (error) {
        console.error('Database duplicate audit error:', error);
        throw new Error(`Failed to audit duplicate analysis IDs: ${error.message}`);
    } finally {
        console.log('Database duplicate audit process completed');
    }
}

module.exports = {
    checkYouTubeAnalysisIdExists,
    checkInstagramAnalysisIdExists,
    checkAnalysisIdExists,
    generateUniqueMainAnalysisId,
    generateUniqueOEmbedAnalysisId,
    generateUniqueCSVAnalysisId,
    generateUniqueInstagramProfileId,
    generateUniqueInstagramReelId,
    generateUniqueYouTubeCreatorId,
    auditDuplicateAnalysisIds
};