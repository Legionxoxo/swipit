/**
 * @fileoverview User hubs table schema and operations
 * @author Backend Team
 */

/**
 * Get user hubs table creation SQL
 * @returns {string} SQL for creating user hubs table
 */
function getUserHubsTableSQL() {
    return `
        CREATE TABLE IF NOT EXISTS user_hubs (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            
            -- Timestamps
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;
}

/**
 * Get user hubs table indexes SQL
 * @returns {Array<string>} Array of index creation SQL statements
 */
function getUserHubsIndexesSQL() {
    return [
        'CREATE INDEX IF NOT EXISTS idx_user_hubs_user ON user_hubs(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_hubs_name ON user_hubs(user_id, name)',
        'CREATE INDEX IF NOT EXISTS idx_user_hubs_created ON user_hubs(created_at DESC)'
    ];
}

/**
 * Initialize user hubs table
 * @param {Object} db - Database connection wrapper
 * @returns {Promise<void>}
 */
async function initializeUserHubsTable(db) {
    try {
        // Create table
        await db.run(getUserHubsTableSQL());
        console.log('User hubs table created/verified');

        // Create indexes
        const indexes = getUserHubsIndexesSQL();
        for (const indexSQL of indexes) {
            await db.run(indexSQL);
        }
        console.log('User hubs table indexes created/verified');

    } catch (error) {
        console.error('User hubs table initialization error:', error);
        throw new Error(`Failed to initialize user hubs table: ${error.message}`);
    } finally {
        console.log('User hubs table initialization completed');
    }
}

/**
 * Drop user hubs table (for testing/cleanup)
 * @param {Object} db - Database connection wrapper
 * @returns {Promise<void>}
 */
async function dropUserHubsTable(db) {
    try {
        await db.run('DROP TABLE IF EXISTS user_hubs');
        console.log('User hubs table dropped');
    } catch (error) {
        console.error('User hubs table drop error:', error);
        throw new Error(`Failed to drop user hubs table: ${error.message}`);
    } finally {
        console.log('User hubs table drop completed');
    }
}

module.exports = {
    getUserHubsTableSQL,
    getUserHubsIndexesSQL,
    initializeUserHubsTable,
    dropUserHubsTable,
    tableName: 'user_hubs'
};