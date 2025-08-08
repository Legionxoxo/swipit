/**
 * @fileoverview Database connection management utility
 * @author Backend Team
 */

const path = require('path');
const fs = require('fs').promises;
const { createDatabaseWrapper } = require('./dbWrapper');

// Import all table modules
const { initializeAllTables } = require('./tables/index');

/**
 * @typedef {Object} DatabaseConnection
 * @property {Function} get - Execute SELECT query returning single row
 * @property {Function} all - Execute SELECT query returning all rows
 * @property {Function} run - Execute INSERT/UPDATE/DELETE/CREATE commands
 * @property {Function} close - Close database connection
 */

// Database configuration
const DB_CONFIG = {
    filename: path.join(__dirname, 'swipit.db'),
    directory: path.dirname(path.join(__dirname, 'swipit.db'))
};

let databaseConnection = null;

/**
 * Initialize database directory and file
 * @returns {Promise<void>}
 */
async function initializeDatabaseDirectory() {
    try {
        // Create data directory if it doesn't exist
        await fs.mkdir(DB_CONFIG.directory, { recursive: true });
        
        // Check if database file exists
        try {
            await fs.access(DB_CONFIG.filename);
            // Database file exists
        } catch {
            // Database file will be created
        }

    } catch (error) {
        console.error('Database directory initialization error:', error);
        throw new Error(`Failed to initialize database directory: ${error.message}`);
    } finally {
        // Database directory prepared
    }
}

/**
 * Initialize database tables (delegated to tables/index.js)
 * @param {DatabaseConnection} db - Database connection
 * @returns {Promise<void>}
 */
async function initializeTables(db) {
    return await initializeAllTables(db);
}

/**
 * Get database connection (singleton pattern)
 * @returns {Promise<DatabaseConnection>} Database connection
 */
async function getDatabase() {
    try {
        // Return existing connection if available
        if (databaseConnection) {
            return databaseConnection;
        }

        // Initialize database directory
        await initializeDatabaseDirectory();

        // Create database wrapper
        databaseConnection = await createDatabaseWrapper(DB_CONFIG.filename);

        // Initialize all tables
        await initializeTables(databaseConnection);

        // Database connection established
        return databaseConnection;

    } catch (error) {
        console.error('Database connection error:', error);
        throw new Error(`Failed to get database connection: ${error.message}`);
    } finally {
        // Database connection process completed
    }
}

/**
 * Close database connection
 * @returns {Promise<void>}
 */
async function closeDatabase() {
    try {
        if (databaseConnection) {
            await databaseConnection.close();
            databaseConnection = null;
            // Database connection closed
        }
    } catch (error) {
        console.error('Database close error:', error);
        throw new Error(`Failed to close database: ${error.message}`);
    } finally {
        // Database close process completed
    }
}

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection test result
 */
async function testDatabaseConnection() {
    try {
        const db = await getDatabase();
        
        // Test query
        const testResult = await db.get('SELECT 1 as test');
        
        if (testResult && testResult.test === 1) {
            // Database connection test passed
            return true;
        } else {
            throw new Error('Database connection test failed');
        }

    } catch (error) {
        console.error('Database connection test error:', error);
        return false;
    } finally {
        // Database connection test completed
    }
}

/**
 * Execute database health check
 * @returns {Promise<Object>} Health check result
 */
async function databaseHealthCheck() {
    try {
        const startTime = Date.now();
        const db = await getDatabase();
        
        // Check table existence efficiently
        const tablesCheck = await db.all(
            "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('instagram_data', 'youtube_data')"
        );
        
        const existingTables = tablesCheck.map(table => table.name);
        const instagramExists = existingTables.includes('instagram_data');
        const youtubeExists = existingTables.includes('youtube_data');
        
        const responseTime = Date.now() - startTime;
        
        return {
            status: 'healthy',
            responseTime: `${responseTime}ms`,
            tables: {
                instagram: {
                    exists: instagramExists
                },
                youtube: {
                    exists: youtubeExists
                }
            },
            databaseFile: DB_CONFIG.filename,
            totalTables: existingTables.length
        };

    } catch (error) {
        console.error('Database health check error:', error);
        return {
            status: 'unhealthy',
            error: error.message,
            databaseFile: DB_CONFIG.filename
        };
    } finally {
        // Database health check completed
    }
}

module.exports = {
    getDatabase,
    closeDatabase,
    testDatabaseConnection,
    databaseHealthCheck
};