/**
 * @fileoverview Instagram data table schema and operations
 * @author Backend Team
 */

/**
 * Get Instagram table creation SQL
 * @returns {string} SQL for creating Instagram data table
 */
function getInstagramTableSQL() {
    return `
        CREATE TABLE IF NOT EXISTS instagram_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            analysis_id TEXT NOT NULL,
            instagram_user_id TEXT NOT NULL,
            
            -- Analysis Job Status
            analysis_status TEXT DEFAULT 'pending',
            analysis_progress INTEGER DEFAULT 0,
            analysis_error TEXT,
            
            -- Profile Information
            profile_username TEXT,
            profile_follower_count INTEGER DEFAULT 0,
            profile_following_count INTEGER DEFAULT 0,
            profile_media_count INTEGER DEFAULT 0,
            profile_is_private BOOLEAN DEFAULT 0,
            profile_pic_url TEXT,
            
            -- Reel Information
            reel_id TEXT,
            reel_shortcode TEXT,
            reel_url TEXT,
            reel_thumbnail_url TEXT,
            reel_caption TEXT,
            reel_likes INTEGER DEFAULT 0,
            reel_comments INTEGER DEFAULT 0,
            reel_views INTEGER DEFAULT 0,
            reel_date_posted TEXT,
            reel_duration INTEGER DEFAULT 0,
            reel_is_video BOOLEAN DEFAULT 1,
            
            -- JSON Fields for Arrays
            reel_hashtags TEXT,
            reel_mentions TEXT,
            
            -- Timestamps
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;
}

/**
 * Get Instagram table indexes SQL
 * @returns {Array<string>} Array of index creation SQL statements
 */
function getInstagramIndexesSQL() {
    return [
        'CREATE INDEX IF NOT EXISTS idx_instagram_analysis_id ON instagram_data(analysis_id)',
        'CREATE INDEX IF NOT EXISTS idx_instagram_user_id ON instagram_data(instagram_user_id)',
        'CREATE INDEX IF NOT EXISTS idx_instagram_username ON instagram_data(profile_username)',
        'CREATE INDEX IF NOT EXISTS idx_instagram_analysis_status ON instagram_data(analysis_status)',
        'CREATE INDEX IF NOT EXISTS idx_instagram_reel_id ON instagram_data(reel_id)',
        'CREATE INDEX IF NOT EXISTS idx_instagram_created_at ON instagram_data(created_at)',
        'CREATE INDEX IF NOT EXISTS idx_instagram_composite_analysis_user ON instagram_data(analysis_id, instagram_user_id)'
    ];
}

/**
 * Initialize Instagram table
 * @param {Object} db - Database connection wrapper
 * @returns {Promise<void>}
 */
async function initializeInstagramTable(db) {
    try {
        // Create table
        await db.run(getInstagramTableSQL());
        console.log('Instagram data table created/verified');

        // Create indexes
        const indexes = getInstagramIndexesSQL();
        for (const indexSQL of indexes) {
            await db.run(indexSQL);
        }
        console.log('Instagram table indexes created/verified');

    } catch (error) {
        console.error('Instagram table initialization error:', error);
        throw new Error(`Failed to initialize Instagram table: ${error.message}`);
    } finally {
        console.log('Instagram table initialization completed');
    }
}

/**
 * Drop Instagram table (for testing/cleanup)
 * @param {Object} db - Database connection wrapper
 * @returns {Promise<void>}
 */
async function dropInstagramTable(db) {
    try {
        await db.run('DROP TABLE IF EXISTS instagram_data');
        console.log('Instagram table dropped');
    } catch (error) {
        console.error('Instagram table drop error:', error);
        throw new Error(`Failed to drop Instagram table: ${error.message}`);
    } finally {
        console.log('Instagram table drop completed');
    }
}

module.exports = {
    getInstagramTableSQL,
    getInstagramIndexesSQL,
    initializeInstagramTable,
    dropInstagramTable,
    tableName: 'instagram_data'
};