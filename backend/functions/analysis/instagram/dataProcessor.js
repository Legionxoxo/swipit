/**
 * @fileoverview Instagram data processing and analysis utilities
 * @author Backend Team
 */

const { getAnalysisJob, getAnalysisResults } = require('../../../database/instagram/index');
const { getDatabase } = require('../../../database/connection');

/**
 * Get creator-based analysis status from database posts
 * @param {string} username - Instagram username
 * @param {number} [limit] - Optional limit for pagination
 * @param {number} [offset] - Optional offset for pagination
 * @returns {Promise<Object|null>} Creator analysis data
 */
async function getCreatorAnalysisStatus(username, limit = null, offset = 0) {
    try {
        const db = await getDatabase();
        
        // First get total count
        const countResult = await db.get(
            `SELECT COUNT(*) as total
             FROM instagram_data 
             WHERE profile_username = ? AND analysis_status = 'completed'`,
            [username]
        );
        
        const totalCount = countResult.total;
        
        // Get posts for this creator with optional pagination
        const query = `SELECT analysis_id, instagram_user_id, profile_username, 
                    reel_id, reel_shortcode, reel_url, reel_thumbnail_url, 
                    reel_caption, reel_likes, reel_comments, reel_views, 
                    reel_date_posted, reel_duration, reel_hashtags, reel_mentions,
                    profile_link, created_at, updated_at
             FROM instagram_data 
             WHERE profile_username = ? AND analysis_status = 'completed'
             ORDER BY created_at DESC
             ${limit ? 'LIMIT ? OFFSET ?' : ''}`;
        
        const params = limit ? [username, limit, offset] : [username];
        const posts = await db.all(query, params);

        if (posts.length === 0) {
            return null;
        }

        const firstPost = posts[0];
        
        // Transform posts to reels format
        const reels = posts.map(post => ({
            reel_id: post.reel_id || post.analysis_id,
            reel_shortcode: post.reel_shortcode || post.analysis_id,
            reel_url: post.reel_url || post.profile_link,
            reel_thumbnail_url: post.reel_thumbnail_url,
            reel_caption: post.reel_caption,
            reel_likes: post.reel_likes || 0,
            reel_comments: post.reel_comments || 0,
            reel_views: post.reel_views || 0,
            reel_date_posted: post.reel_date_posted || post.created_at,
            reel_duration: post.reel_duration || 0,
            reel_hashtags: post.reel_hashtags ? JSON.parse(post.reel_hashtags) : [],
            reel_mentions: post.reel_mentions ? JSON.parse(post.reel_mentions) : [],
            // Include post link for Instagram posts
            post_link: post.reel_url,
            hashtags: post.reel_hashtags ? JSON.parse(post.reel_hashtags) : []
        }));

        return {
            analysisId: `creator_${username}`,
            status: 'completed',
            progress: 100,
            profile: {
                instagram_user_id: firstPost.instagram_user_id,
                username: firstPost.profile_username,
                full_name: firstPost.profile_username,
                biography: '',
                follower_count: 0,
                following_count: 0,
                media_count: totalCount,  // Use total count from DB
                is_private: false,
                is_verified: false,
                profile_pic_url: firstPost.reel_thumbnail_url || ''
            },
            reels: reels,
            totalReels: totalCount,  // Use total count from DB, not array length
            reelSegments: {
                viral: [],
                veryHigh: [],
                high: [],
                medium: [],
                low: []
            },
            processingTime: 0,
            createdAt: new Date(posts[posts.length - 1].created_at),
            updatedAt: new Date(firstPost.updated_at)
        };
        
    } catch (error) {
        console.error('Get creator analysis status error:', error);
        throw new Error(`Failed to get creator analysis status: ${error.message}`);
    }
}

/**
 * Get Instagram analysis status and results
 * @param {string} analysisId - Analysis ID
 * @param {number} [page=1] - Page number for pagination
 * @param {number} [limit=50] - Items per page
 * @returns {Promise<Object|null>} Analysis data with results
 */
async function getInstagramAnalysisStatus(analysisId, page = 1, limit = 50) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        // Handle creator-based analysis IDs with pagination
        if (analysisId.startsWith('creator_')) {
            const username = analysisId.replace('creator_', '');
            const offset = (page - 1) * limit;
            const fullData = await getCreatorAnalysisStatus(username, limit, offset);
            
            if (fullData) {
                return {
                    ...fullData,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(fullData.totalReels / limit),
                        totalReels: fullData.totalReels,
                        hasNextPage: page * limit < fullData.totalReels,
                        hasPrevPage: page > 1,
                        limit
                    }
                };
            }
            return null;
        }

        // Get job status for regular analysis IDs
        const job = await getAnalysisJob(analysisId);
        
        if (!job) {
            return null;
        }

        // If completed, get paginated results including reels
        if (job.status === 'completed') {
            const fullResults = await getAnalysisResults(analysisId);
            
            if (fullResults && fullResults.reels) {
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                const paginatedReels = fullResults.reels.slice(startIndex, endIndex);
                
                return {
                    analysisId: fullResults.analysisId,
                    status: fullResults.status,
                    progress: fullResults.progress,
                    profile: fullResults.profile,
                    reels: paginatedReels,
                    totalReels: fullResults.totalReels,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(fullResults.totalReels / limit),
                        totalReels: fullResults.totalReels,
                        hasNextPage: endIndex < fullResults.totalReels,
                        hasPrevPage: page > 1,
                        limit
                    },
                    processingTime: Math.round((fullResults.updatedAt.getTime() - fullResults.createdAt.getTime()) / 1000),
                    createdAt: fullResults.createdAt,
                    updatedAt: fullResults.updatedAt
                };
            }
        }

        // Return job status for pending/processing/failed
        return {
            analysisId: job.analysisId,
            status: job.status,
            progress: job.progress,
            error: job.error,
            profile: job.instagramUserId ? {
                username: job.username,
                instagramUserId: job.instagramUserId
            } : null,
            reels: [],
            totalReels: 0,
            pagination: {
                currentPage: 1,
                totalPages: 0,
                totalReels: 0,
                hasNextPage: false,
                hasPrevPage: false,
                limit
            },
            processingTime: Math.round((job.updatedAt.getTime() - job.createdAt.getTime()) / 1000),
            createdAt: job.createdAt,
            updatedAt: job.updatedAt
        };

    } catch (error) {
        console.error('Get Instagram analysis status error:', error);
        throw new Error(`Failed to get Instagram analysis status: ${error.message}`);
    } finally {
        console.log(`Instagram analysis status requested for: ${analysisId}, page: ${page}, limit: ${limit}`);
    }
}

/**
 * Segment Instagram reels by engagement levels (similar to YouTube video segments)
 * @param {Array} reels - Array of reel data
 * @returns {Object} Segmented reels by engagement
 */
function segmentReelsByEngagement(reels) {
    try {
        const segments = {
            low: [],        // 0-1,000 likes
            medium: [],     // 1,001-10,000 likes
            high: [],       // 10,001-100,000 likes
            veryHigh: [],   // 100,001-1,000,000 likes
            viral: []       // 1,000,001+ likes
        };

        if (!reels || !Array.isArray(reels)) {
            return segments;
        }

        reels.forEach(reel => {
            const likeCount = reel.likes || 0;
            
            if (likeCount <= 1000) {
                segments.low.push(reel);
            } else if (likeCount <= 10000) {
                segments.medium.push(reel);
            } else if (likeCount <= 100000) {
                segments.high.push(reel);
            } else if (likeCount <= 1000000) {
                segments.veryHigh.push(reel);
            } else {
                segments.viral.push(reel);
            }
        });

        return segments;

    } catch (error) {
        console.error('Segment reels error:', error);
        throw new Error(`Failed to segment reels: ${error.message}`);
    } finally {
        console.log(`Reels segmented: ${reels ? reels.length : 0} total reels`);
    }
}

/**
 * Calculate processing time for analysis
 * @param {Date} startTime - Analysis start time
 * @param {Date} endTime - Analysis end time
 * @returns {number} Processing time in seconds
 */
function calculateProcessingTime(startTime, endTime) {
    try {
        if (!startTime || !endTime) {
            return 0;
        }
        
        return Math.round((endTime.getTime() - startTime.getTime()) / 1000);
    } catch (error) {
        console.error('Calculate processing time error:', error);
        return 0;
    }
}

module.exports = {
    getInstagramAnalysisStatus,
    getCreatorAnalysisStatus,
    segmentReelsByEngagement,
    calculateProcessingTime
};