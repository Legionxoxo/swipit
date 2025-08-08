/**
 * @fileoverview Instagram analysis results aggregation
 * @author Backend Team
 */

const { getDatabase } = require('../connection');

/**
 * Get complete analysis results including profile and reels with pagination
 * @param {string} analysisId - Analysis ID
 * @param {number} [page=1] - Page number (1-based)
 * @param {number} [limit=50] - Items per page
 * @returns {Promise<Object|null>} Complete analysis data
 */
async function getAnalysisResults(analysisId, page = 1, limit = 50) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        const db = await getDatabase();

        // Get profile data
        const profile = await db.get(
            `SELECT analysis_id, instagram_user_id, profile_username,
                    profile_follower_count, profile_following_count, profile_media_count,
                    profile_is_private, profile_pic_url, analysis_status, analysis_progress,
                    analysis_error, created_at, updated_at
             FROM instagram_data 
             WHERE analysis_id = ? AND reel_id IS NULL 
             LIMIT 1`,
            [analysisId]
        );

        if (!profile) {
            return null;
        }

        // Get total reel count first (lightweight query)
        const reelCountResult = await db.get(
            `SELECT COUNT(*) as total_reels
             FROM instagram_data 
             WHERE analysis_id = ? AND reel_id IS NOT NULL`,
            [analysisId]
        );

        const totalReels = reelCountResult?.total_reels || 0;
        
        // Calculate pagination  
        const pageSize = Math.min(limit, 100); // Max 100 items per page
        const offset = (page - 1) * pageSize;
        const totalPages = Math.ceil(totalReels / pageSize);
        
        const reels = await db.all(
            `SELECT reel_id, reel_shortcode, reel_url, reel_thumbnail_url, reel_caption,
                    reel_likes, reel_comments, reel_views, reel_date_posted, reel_duration,
                    reel_is_video, reel_hashtags, reel_mentions
             FROM instagram_data 
             WHERE analysis_id = ? AND reel_id IS NOT NULL
             ORDER BY reel_date_posted DESC
             LIMIT ? OFFSET ?`,
            [analysisId, pageSize, offset]
        );

        // Parse JSON fields and format reels
        const formattedReels = reels.map(reel => ({
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

        return {
            analysisId: profile.analysis_id,
            status: profile.analysis_status,
            progress: profile.analysis_progress,
            error: profile.analysis_error,
            profile: {
                instagramUserId: profile.instagram_user_id,
                username: profile.profile_username,
                followerCount: profile.profile_follower_count,
                followingCount: profile.profile_following_count,
                mediaCount: profile.profile_media_count,
                isPrivate: profile.profile_is_private === 1,
                profilePicUrl: profile.profile_pic_url
            },
            reels: formattedReels,
            pagination: {
                page: page,
                pageSize: pageSize,
                totalReels: totalReels,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            },
            createdAt: new Date(profile.created_at),
            updatedAt: new Date(profile.updated_at)
        };

    } catch (error) {
        console.error('Get analysis results error:', error);
        throw new Error(`Failed to get analysis results: ${error.message}`);
    } finally {
        console.log(`Analysis results retrieval attempted: ${analysisId}`);
    }
}

/**
 * Get analysis summary statistics
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<Object|null>} Analysis summary
 */
async function getAnalysisSummary(analysisId) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        const db = await getDatabase();

        // Get basic analysis info
        const analysis = await db.get(
            `SELECT analysis_status, analysis_progress, created_at, updated_at
             FROM instagram_data 
             WHERE analysis_id = ? AND reel_id IS NULL`,
            [analysisId]
        );

        if (!analysis) {
            return null;
        }

        // Get reel statistics
        const reelStats = await db.get(
            `SELECT 
                COUNT(*) as total_reels,
                SUM(reel_likes) as total_likes,
                SUM(reel_comments) as total_comments,
                SUM(reel_views) as total_views,
                AVG(reel_likes) as avg_likes,
                AVG(reel_comments) as avg_comments,
                AVG(reel_views) as avg_views
             FROM instagram_data 
             WHERE analysis_id = ? AND reel_id IS NOT NULL`,
            [analysisId]
        );

        return {
            analysisId,
            status: analysis.analysis_status,
            progress: analysis.analysis_progress,
            createdAt: new Date(analysis.created_at),
            updatedAt: new Date(analysis.updated_at),
            stats: {
                totalReels: reelStats.total_reels || 0,
                totalLikes: reelStats.total_likes || 0,
                totalComments: reelStats.total_comments || 0,
                totalViews: reelStats.total_views || 0,
                averageLikes: Math.round(reelStats.avg_likes || 0),
                averageComments: Math.round(reelStats.avg_comments || 0),
                averageViews: Math.round(reelStats.avg_views || 0)
            }
        };

    } catch (error) {
        console.error('Get analysis summary error:', error);
        throw new Error(`Failed to get analysis summary: ${error.message}`);
    } finally {
        console.log(`Analysis summary retrieval attempted: ${analysisId}`);
    }
}

module.exports = {
    getAnalysisResults,
    getAnalysisSummary
};