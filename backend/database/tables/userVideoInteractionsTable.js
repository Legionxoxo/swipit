/**
 * @fileoverview User video interactions table schema and operations
 * @author Backend Team
 */

/**
 * Get user video interactions table creation SQL
 * @returns {string} SQL for creating user video interactions table
 */
function getUserVideoInteractionsTableSQL() {
    return `
        CREATE TABLE IF NOT EXISTS user_video_interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            video_id TEXT NOT NULL,
            platform TEXT NOT NULL,
            
            -- User interaction features
            star_rating INTEGER DEFAULT 0,
            comment TEXT,
            is_favorite BOOLEAN DEFAULT FALSE,
            
            -- Timestamps
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            
            -- Ensure one interaction record per user per video
            UNIQUE(user_id, video_id, platform)
        )
    `;
}

/**
 * Get user video interactions table indexes SQL
 * @returns {Array<string>} Array of index creation SQL statements
 */
function getUserVideoInteractionsIndexesSQL() {
    return [
        'CREATE INDEX IF NOT EXISTS idx_user_video_interactions_user ON user_video_interactions(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_video_interactions_video ON user_video_interactions(video_id, platform)',
        'CREATE INDEX IF NOT EXISTS idx_user_video_interactions_starred ON user_video_interactions(user_id, star_rating)',
        'CREATE INDEX IF NOT EXISTS idx_user_video_interactions_favorites ON user_video_interactions(user_id, is_favorite)',
        'CREATE INDEX IF NOT EXISTS idx_user_video_interactions_platform ON user_video_interactions(platform)',
        'CREATE INDEX IF NOT EXISTS idx_user_video_interactions_updated ON user_video_interactions(updated_at DESC)',
        'CREATE INDEX IF NOT EXISTS idx_user_video_interactions_composite ON user_video_interactions(user_id, platform, is_favorite)'
    ];
}

/**
 * Initialize user video interactions table
 * @param {Object} db - Database connection wrapper
 * @returns {Promise<void>}
 */
async function initializeUserVideoInteractionsTable(db) {
    try {
        // Create table
        await db.run(getUserVideoInteractionsTableSQL());
        console.log('User video interactions table created/verified');

        // Create indexes
        const indexes = getUserVideoInteractionsIndexesSQL();
        for (const indexSQL of indexes) {
            await db.run(indexSQL);
        }
        console.log('User video interactions table indexes created/verified');

    } catch (error) {
        console.error('User video interactions table initialization error:', error);
        throw new Error(`Failed to initialize user video interactions table: ${error.message}`);
    } finally {
        console.log('User video interactions table initialization completed');
    }
}

/**
 * Drop user video interactions table (for testing/cleanup)
 * @param {Object} db - Database connection wrapper
 * @returns {Promise<void>}
 */
async function dropUserVideoInteractionsTable(db) {
    try {
        await db.run('DROP TABLE IF EXISTS user_video_interactions');
        console.log('User video interactions table dropped');
    } catch (error) {
        console.error('User video interactions table drop error:', error);
        throw new Error(`Failed to drop user video interactions table: ${error.message}`);
    } finally {
        console.log('User video interactions table drop completed');
    }
}

module.exports = {
    getUserVideoInteractionsTableSQL,
    getUserVideoInteractionsIndexesSQL,
    initializeUserVideoInteractionsTable,
    dropUserVideoInteractionsTable,
    tableName: 'user_video_interactions'
};