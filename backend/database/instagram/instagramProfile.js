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

/**
 * Save Instagram profile to database (for CSV import)
 * @param {Object} db - Database connection
 * @param {Object} profile - Profile data
 * @returns {Promise<void>}
 */
async function saveInstagramProfile(db, profile) {
    try {
        const { instagram_user_id, username, full_name, profile_pic_url } = profile;
        
        // Check if profile exists in instagram_data table
        const existing = await db.get(
            `SELECT analysis_id FROM instagram_data 
             WHERE instagram_user_id = ? AND reel_id IS NULL LIMIT 1`,
            [instagram_user_id]
        );
        
        if (!existing) {
            // Create new profile entry
            const analysisId = `csv_${instagram_user_id}_${Date.now()}`;
            await db.run(
                `INSERT INTO instagram_data (
                    analysis_id, instagram_user_id, profile_username, 
                    profile_pic_url, status
                ) VALUES (?, ?, ?, ?, 'completed')`,
                [analysisId, instagram_user_id, username, profile_pic_url]
            );
        }
        
    } catch (error) {
        console.error('Error saving Instagram profile:', error);
    }
}

/**
 * Save Instagram reel to database (for CSV import)
 * @param {Object} db - Database connection
 * @param {Object} reel - Reel data
 * @returns {Promise<void>}
 */
async function saveInstagramReel(db, reel) {
    try {
        const {
            reel_id,
            instagram_user_id,
            username,
            code,
            caption,
            thumbnail_url,
            media_url
        } = reel;
        
        // Check if reel exists
        const existing = await db.get(
            `SELECT analysis_id FROM instagram_data WHERE reel_id = ? LIMIT 1`,
            [reel_id]
        );
        
        if (!existing) {
            // Create new reel entry
            const analysisId = `csv_reel_${reel_id}_${Date.now()}`;
            await db.run(
                `INSERT INTO instagram_data (
                    analysis_id, reel_id, instagram_user_id, 
                    profile_username, reel_code, reel_caption, 
                    reel_thumbnail_url, reel_media_url, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
                [
                    analysisId, reel_id, instagram_user_id,
                    username, code, caption,
                    thumbnail_url, media_url
                ]
            );
        }
        
    } catch (error) {
        console.error('Error saving Instagram reel:', error);
    }
}

module.exports = {
    storeProfileData,
    getProfileData,
    saveInstagramProfile,
    saveInstagramReel
};