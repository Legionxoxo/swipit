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
let connectionPool = null;

/**
 * Connection state tracking for debugging
 * @type {Object}
 */
let connectionState = {
    isConnected: false,
    createdAt: null,
    lastHealthCheck: null,
    optimizationsApplied: false
};

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
 * Get database connection (singleton pattern with optimization)
 * @returns {Promise<DatabaseConnection>} Database connection
 */
async function getDatabase() {
    try {
        // Return existing connection if available and healthy
        if (databaseConnection) {
            try {
                // Test connection health with lightweight query
                await databaseConnection.get('SELECT 1');
                return databaseConnection;
            } catch (healthError) {
                console.warn('Database connection unhealthy, reconnecting...', healthError.message);
                // Properly close the unhealthy connection
                try {
                    await databaseConnection.close();
                } catch (closeError) {
                    console.warn('Error closing unhealthy connection:', closeError.message);
                }
                databaseConnection = null; // Force reconnection
            }
        }

        // Initialize database directory
        await initializeDatabaseDirectory();

        // Create single database wrapper with optimized settings applied
        console.log('Creating database connection with optimizations...');
        databaseConnection = await createDatabaseWrapper(DB_CONFIG.filename, true);

        // Update connection state tracking
        connectionState.isConnected = true;
        connectionState.createdAt = new Date();
        connectionState.optimizationsApplied = true;

        // Initialize all tables using the same connection
        await initializeTables(databaseConnection);

        console.log('Database connection established with optimizations ✓');
        return databaseConnection;

    } catch (error) {
        console.error('Database connection error:', error);
        
        // Clean up any partial connection on error
        if (databaseConnection) {
            try {
                await databaseConnection.close();
            } catch (closeError) {
                console.warn('Error closing connection during cleanup:', closeError.message);
            }
            databaseConnection = null;
        }
        
        // Reset connection state on error
        connectionState.isConnected = false;
        connectionState.createdAt = null;
        connectionState.optimizationsApplied = false;
        
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
            
            // Reset connection state
            connectionState.isConnected = false;
            connectionState.createdAt = null;
            connectionState.lastHealthCheck = null;
            connectionState.optimizationsApplied = false;
            
            console.log('Database connection closed successfully');
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

/**
 * Get current connection state for debugging
 * @returns {Object} Connection state information
 */
function getConnectionState() {
    try {
        return {
            ...connectionState,
            hasActiveConnection: Boolean(databaseConnection),
            dbPath: DB_CONFIG.filename,
            timestamp: new Date()
        };
    } catch (error) {
        console.error('Error getting connection state:', error);
        return {
            error: error.message,
            timestamp: new Date()
        };
    } finally {
        // Connection state retrieved
    }
}

/**
 * Validate database connection integrity
 * @returns {Promise<Object>} Validation results
 */
async function validateConnection() {
    try {
        const validation = {
            singleConnection: true,
            optimizationsApplied: connectionState.optimizationsApplied,
            tablesInitialized: false,
            validationTime: new Date(),
            issues: []
        };

        // Check if connection exists
        if (!databaseConnection) {
            validation.issues.push('No active database connection');
            validation.singleConnection = false;
            return validation;
        }

        // Test basic functionality
        const testResult = await databaseConnection.get('SELECT 1 as test');
        if (!testResult || testResult.test !== 1) {
            validation.issues.push('Basic query test failed');
            validation.singleConnection = false;
        }

        // Check if tables exist (validates initialization worked)
        const tables = await databaseConnection.all(
            "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('instagram_data', 'youtube_data')"
        );
        validation.tablesInitialized = tables.length >= 2;
        
        if (!validation.tablesInitialized) {
            validation.issues.push('Core tables not found - initialization may have failed');
        }

        // Check WAL mode (validates optimizations were applied)
        const walMode = await databaseConnection.get('PRAGMA journal_mode');
        if (walMode && walMode.journal_mode !== 'wal') {
            validation.issues.push('WAL mode not enabled - optimizations may not have been applied');
            validation.optimizationsApplied = false;
        }

        return validation;

    } catch (error) {
        console.error('Connection validation error:', error);
        return {
            singleConnection: false,
            optimizationsApplied: false,
            tablesInitialized: false,
            validationTime: new Date(),
            issues: [`Validation error: ${error.message}`]
        };
    } finally {
        // Connection validation completed
    }
}

module.exports = {
    getDatabase,
    closeDatabase,
    testDatabaseConnection,
    databaseHealthCheck,
    getConnectionState,
    validateConnection
};