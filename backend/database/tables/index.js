/**
 * @fileoverview Database tables index - exports all table modules
 * @author Backend Team
 */

const instagramTable = require('./instagramTable');
const youtubeTable = require('./youtubeTable');
const userVideoInteractionsTable = require('./userVideoInteractionsTable');
const userCreatorInteractionsTable = require('./userCreatorInteractionsTable');
const userHubsTable = require('./userHubsTable');
const videoTranscriptionsTable = require('./videoTranscriptionsTable');

/**
 * Initialize all database tables
 * @param {Object} db - Database connection wrapper
 * @returns {Promise<void>}
 */
async function initializeAllTables(db) {
    try {
        console.log('Starting database table initialization...');

        // Initialize Instagram table
        await instagramTable.initializeInstagramTable(db);

        // Initialize YouTube table
        await youtubeTable.initializeYouTubeTable(db);

        // Initialize user interaction tables
        await userVideoInteractionsTable.initializeUserVideoInteractionsTable(db);
        await userCreatorInteractionsTable.initializeUserCreatorInteractionsTable(db);
        await userHubsTable.initializeUserHubsTable(db);

        // Initialize video transcriptions table
        await videoTranscriptionsTable.initializeVideoTranscriptionsTable(db);

        console.log('All database tables initialized successfully');

    } catch (error) {
        console.error('Database table initialization error:', error);
        throw new Error(`Failed to initialize database tables: ${error.message}`);
    } finally {
        console.log('Database table initialization process completed');
    }
}

/**
 * Drop all database tables (for testing/cleanup)
 * @param {Object} db - Database connection wrapper
 * @returns {Promise<void>}
 */
async function dropAllTables(db) {
    try {
        console.log('Starting database table cleanup...');

        // Drop user interaction tables first (foreign key dependencies)
        await userCreatorInteractionsTable.dropUserCreatorInteractionsTable(db);
        await userVideoInteractionsTable.dropUserVideoInteractionsTable(db);
        await userHubsTable.dropUserHubsTable(db);

        // Drop video transcriptions table
        await videoTranscriptionsTable.dropVideoTranscriptionsTable(db);

        // Drop Instagram table
        await instagramTable.dropInstagramTable(db);

        // Drop YouTube table  
        await youtubeTable.dropYouTubeTable(db);

        console.log('All database tables dropped successfully');

    } catch (error) {
        console.error('Database table cleanup error:', error);
        throw new Error(`Failed to drop database tables: ${error.message}`);
    } finally {
        console.log('Database table cleanup process completed');
    }
}

module.exports = {
    instagramTable,
    youtubeTable,
    userVideoInteractionsTable,
    userCreatorInteractionsTable,
    userHubsTable,
    videoTranscriptionsTable,
    initializeAllTables,
    dropAllTables,
    tableNames: {
        instagram: instagramTable.tableName,
        youtube: youtubeTable.tableName,
        userVideoInteractions: userVideoInteractionsTable.tableName,
        userCreatorInteractions: userCreatorInteractionsTable.tableName,
        userHubs: userHubsTable.tableName,
        videoTranscriptions: videoTranscriptionsTable.tableName
    }
};