/**
 * @fileoverview User interactions service functions
 * @author Backend Team
 */

const { getDatabase } = require('../../database/connection');

/**
 * Get user video interactions with full video details
 * @param {string} userId - User ID
 * @param {number} [page=1] - Page number for pagination
 * @param {number} [limit=20] - Number of items per page
 * @param {string} [filter] - Filter type ('favorites', 'starred', or undefined for all)
 * @returns {Promise<Object>} Service response with video interactions data including full video details
 */
async function getUserVideoInteractions(userId, page = 1, limit = 20, filter = null) {
    try {
        const db = await getDatabase();
        const offset = (page - 1) * limit;
        
        // Build WHERE clause based on filter
        let whereClause = 'WHERE uvi.user_id = ?';
        let queryParams = [userId];
        
        if (filter === 'favorites') {
            whereClause += ' AND uvi.is_favorite = 1';
        } else if (filter === 'starred') {
            whereClause += ' AND uvi.star_rating > 0';
        }
        
        // Get total count for pagination - simplified since we don't need JOINs for count
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM user_video_interactions uvi
            ${whereClause}
        `;
        const totalResult = await db.get(countQuery, queryParams);
        const totalCount = totalResult.total;
        
        // Get paginated results with proper LEFT JOINs for both platforms
        const interactions = await db.all(`
            SELECT 
                uvi.*,
                CASE 
                    WHEN uvi.platform = 'youtube' THEN yd.video_title 
                    WHEN uvi.platform = 'instagram' THEN id.reel_caption 
                    ELSE NULL 
                END as title,
                CASE 
                    WHEN uvi.platform = 'youtube' THEN yd.video_description 
                    WHEN uvi.platform = 'instagram' THEN id.reel_caption 
                    ELSE NULL 
                END as description,
                CASE 
                    WHEN uvi.platform = 'youtube' THEN yd.video_thumbnail_url 
                    WHEN uvi.platform = 'instagram' THEN id.reel_thumbnail_url 
                    ELSE NULL 
                END as thumbnail_url,
                CASE 
                    WHEN uvi.platform = 'youtube' THEN yd.video_url 
                    WHEN uvi.platform = 'instagram' THEN id.reel_url 
                    ELSE NULL 
                END as video_url,
                CASE 
                    WHEN uvi.platform = 'youtube' THEN yd.video_upload_date 
                    WHEN uvi.platform = 'instagram' THEN id.reel_date_posted 
                    ELSE NULL 
                END as upload_date,
                CASE 
                    WHEN uvi.platform = 'youtube' THEN yd.video_duration 
                    WHEN uvi.platform = 'instagram' THEN id.reel_duration 
                    ELSE NULL 
                END as duration,
                CASE 
                    WHEN uvi.platform = 'youtube' THEN yd.video_view_count 
                    WHEN uvi.platform = 'instagram' THEN id.reel_views 
                    ELSE 0 
                END as view_count,
                CASE 
                    WHEN uvi.platform = 'youtube' THEN yd.video_like_count 
                    WHEN uvi.platform = 'instagram' THEN id.reel_likes 
                    ELSE 0 
                END as like_count,
                CASE 
                    WHEN uvi.platform = 'youtube' THEN yd.video_comment_count 
                    WHEN uvi.platform = 'instagram' THEN id.reel_comments 
                    ELSE 0 
                END as comment_count,
                CASE 
                    WHEN uvi.platform = 'youtube' THEN yd.video_category_id 
                    ELSE NULL 
                END as category_id,
                CASE 
                    WHEN uvi.platform = 'youtube' THEN yd.channel_name 
                    WHEN uvi.platform = 'instagram' THEN id.profile_username 
                    ELSE 'Unknown Channel' 
                END as channel_name,
                CASE 
                    WHEN uvi.platform = 'youtube' THEN yd.channel_thumbnail_url 
                    WHEN uvi.platform = 'instagram' THEN id.profile_pic_url 
                    ELSE NULL 
                END as channel_thumbnail_url,
                CASE 
                    WHEN uvi.platform = 'youtube' THEN yd.channel_subscriber_count 
                    WHEN uvi.platform = 'instagram' THEN id.profile_follower_count 
                    ELSE 0 
                END as subscriber_count,
                -- Additional Instagram fields for compatibility
                CASE 
                    WHEN uvi.platform = 'instagram' THEN id.reel_url 
                    ELSE NULL 
                END as post_link,
                CASE 
                    WHEN uvi.platform = 'instagram' THEN id.reel_url 
                    ELSE NULL 
                END as embed_link,
                uvi.created_at,
                uvi.updated_at
            FROM user_video_interactions uvi
            LEFT JOIN youtube_data yd ON (uvi.video_id = yd.video_id AND uvi.platform = 'youtube')
            LEFT JOIN instagram_data id ON (
                (uvi.video_id = id.reel_id OR uvi.video_id = id.reel_shortcode OR uvi.video_id = id.analysis_id) 
                AND uvi.platform = 'instagram'
            )
            ${whereClause}
            ORDER BY uvi.updated_at DESC
            LIMIT ? OFFSET ?
        `, [...queryParams, limit, offset]);

        return {
            success: true,
            message: 'User video interactions retrieved successfully',
            data: interactions,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalCount,
                hasNextPage: page < Math.ceil(totalCount / limit),
                hasPreviousPage: page > 1,
                limit
            }
        };

    } catch (error) {
        console.error('Get user video interactions error:', error);
        return {
            success: false,
            message: 'Failed to get user video interactions',
            error: error.message
        };
    } finally {
        console.log('Get user video interactions service completed');
    }
}

/**
 * Update video interaction (star, comment, favorite)
 * @param {string} userId - User ID
 * @param {string} videoId - Video ID
 * @param {string} platform - Platform ('youtube' or 'instagram')
 * @param {Object} interaction - Interaction data
 * @param {number} [interaction.starRating] - Star rating (1-5)
 * @param {string} [interaction.comment] - Comment text
 * @param {boolean} [interaction.isFavorite] - Is favorite
 * @returns {Promise<Object>} Service response
 */
async function updateVideoInteraction(userId, videoId, platform, interaction) {
    try {
        const db = await getDatabase();
        
        const { starRating, comment, isFavorite } = interaction;
        
        // First, check if record exists
        const existingRecord = await db.get(`
            SELECT * FROM user_video_interactions 
            WHERE user_id = ? AND video_id = ? AND platform = ?
        `, [userId, videoId, platform]);
        
        if (existingRecord) {
            // Update existing record - only update fields that are provided
            const updates = [];
            const values = [];
            
            if (starRating !== undefined) {
                updates.push('star_rating = ?');
                values.push(starRating);
            }
            
            if (comment !== undefined) {
                updates.push('comment = ?');
                values.push(comment);
            }
            
            if (isFavorite !== undefined) {
                updates.push('is_favorite = ?');
                values.push(isFavorite);
            }
            
            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(userId, videoId, platform);
            
            const result = await db.run(`
                UPDATE user_video_interactions 
                SET ${updates.join(', ')}
                WHERE user_id = ? AND video_id = ? AND platform = ?
            `, values);
            
            return {
                success: true,
                message: 'Video interaction updated successfully',
                data: { id: existingRecord.id }
            };
        } else {
            // Insert new record
            const result = await db.run(`
                INSERT INTO user_video_interactions 
                (user_id, video_id, platform, star_rating, comment, is_favorite, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
                userId, 
                videoId, 
                platform, 
                starRating || 0, 
                comment || null, 
                isFavorite || false
            ]);
            
            return {
                success: true,
                message: 'Video interaction created successfully',
                data: { id: result.lastID }
            };
        }

    } catch (error) {
        console.error('Update video interaction error:', error);
        return {
            success: false,
            message: 'Failed to update video interaction',
            error: error.message
        };
    } finally {
        console.log('Update video interaction service completed');
    }
}

/**
 * Get user creator interactions
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Service response with creator interactions data
 */
async function getUserCreatorInteractions(userId) {
    try {
        const db = await getDatabase();
        
        const interactions = await db.all(`
            SELECT * FROM user_creator_interactions 
            WHERE user_id = ? 
            ORDER BY updated_at DESC
        `, [userId]);

        return {
            success: true,
            message: 'User creator interactions retrieved successfully',
            data: interactions
        };

    } catch (error) {
        console.error('Get user creator interactions error:', error);
        return {
            success: false,
            message: 'Failed to get user creator interactions',
            error: error.message
        };
    } finally {
        console.log('Get user creator interactions service completed');
    }
}

/**
 * Update creator interaction (favorite, hub assignment)
 * @param {string} userId - User ID
 * @param {string} creatorId - Creator ID (analysis ID)
 * @param {Object} interaction - Interaction data
 * @param {boolean} [interaction.isFavorite] - Is favorite
 * @param {string} [interaction.hubId] - Hub ID
 * @param {string} interaction.channelName - Channel name
 * @param {string} [interaction.channelId] - Channel ID
 * @param {string} [interaction.thumbnailUrl] - Thumbnail URL
 * @param {string} interaction.platform - Platform
 * @returns {Promise<Object>} Service response
 */
async function updateCreatorInteraction(userId, creatorId, interaction) {
    try {
        const db = await getDatabase();
        
        const { isFavorite, hubId, channelName, channelId, thumbnailUrl, platform } = interaction;
        
        // First, check if record exists
        const existingRecord = await db.get(`
            SELECT * FROM user_creator_interactions 
            WHERE user_id = ? AND creator_id = ?
        `, [userId, creatorId]);
        
        if (existingRecord) {
            // Update existing record - only update fields that are provided
            const updates = [];
            const values = [];
            
            if (isFavorite !== undefined) {
                updates.push('is_favorite = ?');
                values.push(isFavorite);
            }
            
            if (hubId !== undefined) {
                updates.push('hub_id = ?');
                values.push(hubId);
            }
            
            if (channelName !== undefined) {
                updates.push('channel_name = ?');
                values.push(channelName);
            }
            
            if (channelId !== undefined) {
                updates.push('channel_id = ?');
                values.push(channelId);
            }
            
            if (thumbnailUrl !== undefined) {
                updates.push('thumbnail_url = ?');
                values.push(thumbnailUrl);
            }
            
            if (platform !== undefined) {
                updates.push('platform = ?');
                values.push(platform);
            }
            
            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(userId, creatorId);
            
            const result = await db.run(`
                UPDATE user_creator_interactions 
                SET ${updates.join(', ')}
                WHERE user_id = ? AND creator_id = ?
            `, values);
            
            return {
                success: true,
                message: 'Creator interaction updated successfully',
                data: { id: existingRecord.id }
            };
        } else {
            // Insert new record
            const result = await db.run(`
                INSERT INTO user_creator_interactions 
                (user_id, creator_id, is_favorite, hub_id, channel_name, channel_id, thumbnail_url, platform, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
                userId, 
                creatorId, 
                isFavorite || false, 
                hubId || null,
                channelName,
                channelId || null,
                thumbnailUrl || null,
                platform
            ]);
            
            return {
                success: true,
                message: 'Creator interaction created successfully',
                data: { id: result.lastID }
            };
        }

    } catch (error) {
        console.error('Update creator interaction error:', error);
        return {
            success: false,
            message: 'Failed to update creator interaction',
            error: error.message
        };
    } finally {
        console.log('Update creator interaction service completed');
    }
}

/**
 * Get user hubs
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Service response with hubs data
 */
async function getUserHubs(userId) {
    try {
        const db = await getDatabase();
        
        // Get hubs with creator counts
        const hubs = await db.all(`
            SELECT 
                h.id,
                h.name,
                h.created_at,
                COUNT(ci.creator_id) as creator_count
            FROM user_hubs h
            LEFT JOIN user_creator_interactions ci ON (h.id = ci.hub_id AND ci.user_id = h.user_id)
            WHERE h.user_id = ?
            GROUP BY h.id, h.name, h.created_at
            ORDER BY h.created_at DESC
        `, [userId]);

        // Get creator IDs for each hub (to match your frontend CreatorHub type)
        for (const hub of hubs) {
            const creators = await db.all(`
                SELECT creator_id FROM user_creator_interactions 
                WHERE user_id = ? AND hub_id = ?
            `, [userId, hub.id]);
            
            hub.creatorIds = creators.map(c => c.creator_id);
        }

        return {
            success: true,
            message: 'User hubs retrieved successfully',
            data: hubs
        };

    } catch (error) {
        console.error('Get user hubs error:', error);
        return {
            success: false,
            message: 'Failed to get user hubs',
            error: error.message
        };
    } finally {
        console.log('Get user hubs service completed');
    }
}

/**
 * Create user hub
 * @param {string} userId - User ID
 * @param {string} name - Hub name
 * @returns {Promise<Object>} Service response
 */
async function createHub(userId, name) {
    try {
        const db = await getDatabase();
        
        // Generate hub ID (following your frontend pattern)
        const hubId = `hub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        await db.run(`
            INSERT INTO user_hubs (id, user_id, name)
            VALUES (?, ?, ?)
        `, [hubId, userId, name]);

        const newHub = {
            id: hubId,
            name: name,
            createdAt: new Date().toISOString(),
            creatorIds: []
        };

        return {
            success: true,
            message: 'Hub created successfully',
            data: newHub
        };

    } catch (error) {
        console.error('Create hub error:', error);
        return {
            success: false,
            message: 'Failed to create hub',
            error: error.message
        };
    } finally {
        console.log('Create hub service completed');
    }
}

/**
 * Delete user hub
 * @param {string} userId - User ID
 * @param {string} hubId - Hub ID
 * @returns {Promise<Object>} Service response
 */
async function deleteHub(userId, hubId) {
    try {
        const db = await getDatabase();
        
        // First remove hub assignments from creators
        await db.run(`
            UPDATE user_creator_interactions 
            SET hub_id = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND hub_id = ?
        `, [userId, hubId]);
        
        // Then delete the hub
        const result = await db.run(`
            DELETE FROM user_hubs 
            WHERE id = ? AND user_id = ?
        `, [hubId, userId]);

        return {
            success: true,
            message: 'Hub deleted successfully',
            data: { deletedRows: result.changes }
        };

    } catch (error) {
        console.error('Delete hub error:', error);
        return {
            success: false,
            message: 'Failed to delete hub',
            error: error.message
        };
    } finally {
        console.log('Delete hub service completed');
    }
}

module.exports = {
    getUserVideoInteractions,
    updateVideoInteraction,
    getUserCreatorInteractions,
    updateCreatorInteraction,
    getUserHubs,
    createHub,
    deleteHub
};