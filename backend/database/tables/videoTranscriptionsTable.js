/**
 * @fileoverview Video transcriptions table schema and operations
 * @author Backend Team
 */

/**
 * Get video transcriptions table creation SQL
 * @returns {string} SQL for creating video transcriptions table
 */
function getVideoTranscriptionsTableSQL() {
    return `
        CREATE TABLE IF NOT EXISTS video_transcriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transcription_id TEXT NOT NULL UNIQUE,
            initiated_by_user TEXT NOT NULL,
            
            -- Video reference (unique per video+platform)
            video_id TEXT NOT NULL,
            video_url TEXT NOT NULL,
            platform TEXT NOT NULL,
            
            -- Transcription job status
            status TEXT DEFAULT 'pending',
            progress INTEGER DEFAULT 0,
            error_message TEXT,
            
            -- Video metadata
            video_title TEXT,
            video_duration TEXT,
            video_thumbnail_url TEXT,
            
            -- Transcription data
            raw_transcript TEXT,
            formatted_transcript TEXT,
            language_detected TEXT,
            confidence_score REAL,
            
            -- Processing details
            processing_started_at DATETIME,
            processing_completed_at DATETIME,
            processing_time_seconds INTEGER,
            
            -- Timestamps
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;
}

/**
 * Get video transcriptions table indexes SQL
 * @returns {Array<string>} Array of index creation SQL statements
 */
function getVideoTranscriptionsIndexesSQL() {
    return [
        'CREATE INDEX IF NOT EXISTS idx_video_transcriptions_transcription_id ON video_transcriptions(transcription_id)',
        'CREATE INDEX IF NOT EXISTS idx_video_transcriptions_initiated_by ON video_transcriptions(initiated_by_user)',
        'CREATE INDEX IF NOT EXISTS idx_video_transcriptions_video_id ON video_transcriptions(video_id, platform)',
        'CREATE INDEX IF NOT EXISTS idx_video_transcriptions_status ON video_transcriptions(status)',
        'CREATE INDEX IF NOT EXISTS idx_video_transcriptions_platform ON video_transcriptions(platform)',
        'CREATE INDEX IF NOT EXISTS idx_video_transcriptions_created_at ON video_transcriptions(created_at DESC)',
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_video_transcriptions_unique_video ON video_transcriptions(video_id, platform)',
        'CREATE INDEX IF NOT EXISTS idx_video_transcriptions_processing_time ON video_transcriptions(processing_completed_at DESC)'
    ];
}

/**
 * Initialize video transcriptions table
 * @param {Object} db - Database connection wrapper
 * @returns {Promise<void>}
 */
async function initializeVideoTranscriptionsTable(db) {
    try {
        // Create table
        await db.run(getVideoTranscriptionsTableSQL());
        console.log('Video transcriptions table created/verified');

        // Create indexes
        const indexes = getVideoTranscriptionsIndexesSQL();
        for (const indexSQL of indexes) {
            await db.run(indexSQL);
        }
        console.log('Video transcriptions table indexes created/verified');

    } catch (error) {
        console.error('Video transcriptions table initialization error:', error);
        throw new Error(`Failed to initialize video transcriptions table: ${error.message}`);
    } finally {
        console.log('Video transcriptions table initialization completed');
    }
}

/**
 * Drop video transcriptions table (for testing/cleanup)
 * @param {Object} db - Database connection wrapper
 * @returns {Promise<void>}
 */
async function dropVideoTranscriptionsTable(db) {
    try {
        await db.run('DROP TABLE IF EXISTS video_transcriptions');
        console.log('Video transcriptions table dropped');
    } catch (error) {
        console.error('Video transcriptions table drop error:', error);
        throw new Error(`Failed to drop video transcriptions table: ${error.message}`);
    } finally {
        console.log('Video transcriptions table drop completed');
    }
}

module.exports = {
    getVideoTranscriptionsTableSQL,
    getVideoTranscriptionsIndexesSQL,
    initializeVideoTranscriptionsTable,
    dropVideoTranscriptionsTable,
    tableName: 'video_transcriptions'
};