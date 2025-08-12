/**
 * @fileoverview YouTube data table schema and operations
 * @author Backend Team
 */

/**
 * Get YouTube table creation SQL
 * @returns {string} SQL for creating YouTube data table
 */
function getYouTubeTableSQL() {
    return `
        CREATE TABLE IF NOT EXISTS youtube_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            analysis_id TEXT NOT NULL,
            youtube_channel_id TEXT NOT NULL,
            
            -- Analysis Job Status
            analysis_status TEXT DEFAULT 'pending',
            analysis_progress INTEGER DEFAULT 0,
            analysis_error TEXT,
            
            -- Channel Information
            channel_name TEXT,
            channel_url TEXT,
            channel_subscriber_count INTEGER DEFAULT 0,
            channel_video_count INTEGER DEFAULT 0,
            channel_creation_date TEXT,
            channel_description TEXT,
            channel_thumbnail_url TEXT,
            channel_uploads_playlist_id TEXT,
            
            -- Video Information
            video_id TEXT,
            video_title TEXT,
            video_description TEXT,
            video_thumbnail_url TEXT,
            video_url TEXT,
            video_upload_date TEXT,
            video_duration TEXT,
            video_view_count INTEGER DEFAULT 0,
            video_like_count INTEGER DEFAULT 0,
            video_comment_count INTEGER DEFAULT 0,
            video_category_id TEXT,
            
            -- Timestamps
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;
}

/**
 * Get YouTube table indexes SQL
 * @returns {Array<string>} Array of index creation SQL statements
 */
function getYouTubeIndexesSQL() {
    return [
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_youtube_analysis_video_unique ON youtube_data(analysis_id, video_id)',
        'CREATE INDEX IF NOT EXISTS idx_youtube_channel_id ON youtube_data(youtube_channel_id)',
        'CREATE INDEX IF NOT EXISTS idx_youtube_analysis_status ON youtube_data(analysis_status)',
        'CREATE INDEX IF NOT EXISTS idx_youtube_video_id ON youtube_data(video_id)',
        'CREATE INDEX IF NOT EXISTS idx_youtube_created_at ON youtube_data(created_at)',
        'CREATE INDEX IF NOT EXISTS idx_youtube_composite_analysis_channel ON youtube_data(analysis_id, youtube_channel_id)',
        'CREATE INDEX IF NOT EXISTS idx_youtube_video_views ON youtube_data(video_view_count)'
    ];
}

/**
 * Initialize YouTube table
 * @param {Object} db - Database connection wrapper
 * @returns {Promise<void>}
 */
async function initializeYouTubeTable(db) {
    try {
        // Create table
        await db.run(getYouTubeTableSQL());
        console.log('YouTube data table created/verified');

        // Create indexes
        const indexes = getYouTubeIndexesSQL();
        for (const indexSQL of indexes) {
            await db.run(indexSQL);
        }
        console.log('YouTube table indexes created/verified');

    } catch (error) {
        console.error('YouTube table initialization error:', error);
        throw new Error(`Failed to initialize YouTube table: ${error.message}`);
    } finally {
        console.log('YouTube table initialization completed');
    }
}

/**
 * Drop YouTube table (for testing/cleanup)
 * @param {Object} db - Database connection wrapper
 * @returns {Promise<void>}
 */
async function dropYouTubeTable(db) {
    try {
        await db.run('DROP TABLE IF EXISTS youtube_data');
        console.log('YouTube table dropped');
    } catch (error) {
        console.error('YouTube table drop error:', error);
        throw new Error(`Failed to drop YouTube table: ${error.message}`);
    } finally {
        console.log('YouTube table drop completed');
    }
}

module.exports = {
    getYouTubeTableSQL,
    getYouTubeIndexesSQL,
    initializeYouTubeTable,
    dropYouTubeTable,
    tableName: 'youtube_data'
};