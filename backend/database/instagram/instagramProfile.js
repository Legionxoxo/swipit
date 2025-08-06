/**
 * @fileoverview Instagram profile data management
 * @author Backend Team
 */

const { getDatabase } = require('../connection');

/**
 * Store Instagram profile data
 * @param {string} analysisId - Analysis ID
 * @param {Object} profileData - Profile data from Python scraper
 * @returns {Promise<Object>} Storage result
 */
async function storeProfileData(analysisId, profileData) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        if (!profileData) {
            throw new Error('Profile data is required');
        }

        const db = await getDatabase();

        const result = await db.run(
            `UPDATE instagram_data 
             SET instagram_user_id = ?, profile_username = ?, 
                 profile_follower_count = ?, profile_following_count = ?, 
                 profile_media_count = ?, profile_is_private = ?, profile_pic_url = ?
             WHERE analysis_id = ? AND reel_id IS NULL`,
            [
                profileData.instagram_user_id,
                profileData.username,
                profileData.follower_count || 0,
                profileData.following_count || 0,
                profileData.media_count || 0,
                profileData.is_private ? 1 : 0,
                profileData.profile_pic_url || '',
                analysisId
            ]
        );

        return {
            success: result.changes > 0,
            changes: result.changes
        };

    } catch (error) {
        console.error('Store profile data error:', error);
        throw new Error(`Failed to store profile data: ${error.message}`);
    } finally {
        console.log(`Profile data storage attempted: ${analysisId}`);
    }
}

/**
 * Get Instagram profile data for analysis
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<Object|null>} Profile data or null if not found
 */
async function getProfileData(analysisId) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        const db = await getDatabase();

        const profile = await db.get(
            `SELECT instagram_user_id, profile_username, profile_follower_count, 
                    profile_following_count, profile_media_count, profile_is_private, 
                    profile_pic_url, created_at, updated_at
             FROM instagram_data 
             WHERE analysis_id = ? AND reel_id IS NULL`,
            [analysisId]
        );

        if (!profile) {
            return null;
        }

        return {
            instagramUserId: profile.instagram_user_id,
            username: profile.profile_username,
            followerCount: profile.profile_follower_count,
            followingCount: profile.profile_following_count,
            mediaCount: profile.profile_media_count,
            isPrivate: Boolean(profile.profile_is_private),
            profilePicUrl: profile.profile_pic_url,
            createdAt: new Date(profile.created_at),
            updatedAt: new Date(profile.updated_at)
        };

    } catch (error) {
        console.error('Get profile data error:', error);
        throw new Error(`Failed to get profile data: ${error.message}`);
    } finally {
        console.log(`Profile data retrieval attempted: ${analysisId}`);
    }
}

module.exports = {
    storeProfileData,
    getProfileData
};