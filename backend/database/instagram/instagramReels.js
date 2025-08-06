/**
 * @fileoverview Instagram reel data management
 * @author Backend Team
 */

const { getDatabase } = require('../connection');

/**
 * @typedef {Object} InstagramReelData
 * @property {string} analysisId - Analysis ID
 * @property {string} instagramUserId - Instagram user ID
 * @property {string} username - Instagram username
 * @property {string} reelId - Instagram reel ID
 * @property {string} shortcode - Instagram shortcode
 * @property {string} url - Reel URL
 * @property {string} thumbnailUrl - Thumbnail URL
 * @property {string} caption - Reel caption
 * @property {number} likes - Like count
 * @property {number} comments - Comment count
 * @property {number} views - View count
 * @property {string} datePosted - Upload date
 * @property {number} duration - Video duration
 * @property {Array<string>} hashtags - Hashtag array
 * @property {Array<string>} mentions - Mentions array
 */

/**
 * Store Instagram reel data
 * @param {string} analysisId - Analysis ID
 * @param {string} instagramUserId - Instagram user ID
 * @param {string} username - Username
 * @param {Array<Object>} reelsData - Reels data from Python scraper
 * @returns {Promise<Object>} Storage result
 */
async function storeReelData(analysisId, instagramUserId, username, reelsData) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        if (!instagramUserId) {
            throw new Error('Instagram user ID is required');
        }

        if (!Array.isArray(reelsData)) {
            throw new Error('Reels data must be an array');
        }

        const db = await getDatabase();
        let insertedCount = 0;

        for (const reel of reelsData) {
            try {
                const result = await db.run(
                    `INSERT INTO instagram_data 
                     (analysis_id, instagram_user_id, profile_username, analysis_status, analysis_progress,
                      reel_id, reel_shortcode, reel_url, reel_thumbnail_url, reel_caption,
                      reel_likes, reel_comments, reel_views, reel_date_posted, reel_duration,
                      reel_is_video, reel_hashtags, reel_mentions) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        analysisId,
                        instagramUserId,
                        username,
                        'completed',
                        100,
                        reel.reel_id,
                        reel.shortcode,
                        reel.url,
                        reel.thumbnail_url,
                        reel.caption || '',
                        reel.likes || 0,
                        reel.comments || 0,
                        reel.views || 0,
                        reel.date_posted,
                        reel.duration || 0,
                        reel.is_video ? 1 : 0,
                        JSON.stringify(reel.hashtags || []),
                        JSON.stringify(reel.mentions || [])
                    ]
                );

                if (result.lastID) {
                    insertedCount++;
                }

            } catch (reelError) {
                console.error(`Error storing reel ${reel.reel_id}:`, reelError);
                continue;
            }
        }

        return {
            success: insertedCount > 0,
            insertedCount: insertedCount,
            totalReels: reelsData.length
        };

    } catch (error) {
        console.error('Store reel data error:', error);
        throw new Error(`Failed to store reel data: ${error.message}`);
    } finally {
        console.log(`Reel data storage attempted: ${analysisId} (${reelsData.length} reels)`);
    }
}

/**
 * Get all reels for an analysis
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<Array<Object>>} Array of reel data
 */
async function getReelsByAnalysis(analysisId) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        const db = await getDatabase();

        const reels = await db.all(
            `SELECT reel_id, reel_shortcode, reel_url, reel_thumbnail_url, reel_caption,
                    reel_likes, reel_comments, reel_views, reel_date_posted, reel_duration,
                    reel_is_video, reel_hashtags, reel_mentions
             FROM instagram_data 
             WHERE analysis_id = ? AND reel_id IS NOT NULL
             ORDER BY reel_date_posted DESC`,
            [analysisId]
        );

        return reels.map(reel => ({
            id: reel.reel_id,
            shortcode: reel.reel_shortcode,
            url: reel.reel_url,
            thumbnailUrl: reel.reel_thumbnail_url,
            caption: reel.reel_caption,
            likes: reel.reel_likes,
            comments: reel.reel_comments,
            views: reel.reel_views,
            datePosted: reel.reel_date_posted,
            duration: reel.reel_duration,
            isVideo: reel.reel_is_video === 1,
            hashtags: JSON.parse(reel.reel_hashtags || '[]'),
            mentions: JSON.parse(reel.reel_mentions || '[]')
        }));

    } catch (error) {
        console.error('Get reels by analysis error:', error);
        throw new Error(`Failed to get reels by analysis: ${error.message}`);
    } finally {
        console.log(`Reels retrieval attempted: ${analysisId}`);
    }
}

/**
 * Get reel count for an analysis
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<number>} Number of reels
 */
async function getReelCount(analysisId) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        const db = await getDatabase();

        const result = await db.get(
            'SELECT COUNT(*) as count FROM instagram_data WHERE analysis_id = ? AND reel_id IS NOT NULL',
            [analysisId]
        );

        return result.count || 0;

    } catch (error) {
        console.error('Get reel count error:', error);
        throw new Error(`Failed to get reel count: ${error.message}`);
    } finally {
        console.log(`Reel count retrieval attempted: ${analysisId}`);
    }
}

module.exports = {
    storeReelData,
    getReelsByAnalysis,
    getReelCount
};