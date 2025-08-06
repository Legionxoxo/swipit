/**
 * @fileoverview Database tables index - exports all table modules
 * @author Backend Team
 */

const instagramTable = require('./instagramTable');
const youtubeTable = require('./youtubeTable');

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
    initializeAllTables,
    dropAllTables,
    tableNames: {
        instagram: instagramTable.tableName,
        youtube: youtubeTable.tableName
    }
};