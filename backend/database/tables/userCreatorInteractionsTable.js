/**
 * @fileoverview User creator interactions table schema and operations
 * @author Backend Team
 */

/**
 * Get user creator interactions table creation SQL
 * @returns {string} SQL for creating user creator interactions table
 */
function getUserCreatorInteractionsTableSQL() {
    return `
        CREATE TABLE IF NOT EXISTS user_creator_interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            creator_id TEXT NOT NULL,
            
            -- User interaction features
            is_favorite BOOLEAN DEFAULT FALSE,
            hub_id TEXT,
            
            -- Creator metadata for quick display
            channel_name TEXT NOT NULL,
            channel_id TEXT,
            thumbnail_url TEXT,
            platform TEXT NOT NULL,
            
            -- Timestamps
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            
            -- Ensure one interaction record per user per creator
            UNIQUE(user_id, creator_id)
        )
    `;
}

/**
 * Get user creator interactions table indexes SQL
 * @returns {Array<string>} Array of index creation SQL statements
 */
function getUserCreatorInteractionsIndexesSQL() {
    return [
        'CREATE INDEX IF NOT EXISTS idx_user_creator_interactions_user ON user_creator_interactions(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_creator_interactions_creator ON user_creator_interactions(creator_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_creator_interactions_favorites ON user_creator_interactions(user_id, is_favorite)',
        'CREATE INDEX IF NOT EXISTS idx_user_creator_interactions_hub ON user_creator_interactions(user_id, hub_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_creator_interactions_platform ON user_creator_interactions(platform)',
        'CREATE INDEX IF NOT EXISTS idx_user_creator_interactions_channel ON user_creator_interactions(channel_name)',
        'CREATE INDEX IF NOT EXISTS idx_user_creator_interactions_updated ON user_creator_interactions(updated_at DESC)',
        'CREATE INDEX IF NOT EXISTS idx_user_creator_interactions_composite ON user_creator_interactions(user_id, platform, is_favorite)'
    ];
}

/**
 * Initialize user creator interactions table
 * @param {Object} db - Database connection wrapper
 * @returns {Promise<void>}
 */
async function initializeUserCreatorInteractionsTable(db) {
    try {
        // Create table
        await db.run(getUserCreatorInteractionsTableSQL());
        console.log('User creator interactions table created/verified');

        // Create indexes
        const indexes = getUserCreatorInteractionsIndexesSQL();
        for (const indexSQL of indexes) {
            await db.run(indexSQL);
        }
        console.log('User creator interactions table indexes created/verified');

    } catch (error) {
        console.error('User creator interactions table initialization error:', error);
        throw new Error(`Failed to initialize user creator interactions table: ${error.message}`);
    } finally {
        console.log('User creator interactions table initialization completed');
    }
}

/**
 * Drop user creator interactions table (for testing/cleanup)
 * @param {Object} db - Database connection wrapper
 * @returns {Promise<void>}
 */
async function dropUserCreatorInteractionsTable(db) {
    try {
        await db.run('DROP TABLE IF EXISTS user_creator_interactions');
        console.log('User creator interactions table dropped');
    } catch (error) {
        console.error('User creator interactions table drop error:', error);
        throw new Error(`Failed to drop user creator interactions table: ${error.message}`);
    } finally {
        console.log('User creator interactions table drop completed');
    }
}

module.exports = {
    getUserCreatorInteractionsTableSQL,
    getUserCreatorInteractionsIndexesSQL,
    initializeUserCreatorInteractionsTable,
    dropUserCreatorInteractionsTable,
    tableName: 'user_creator_interactions'
};