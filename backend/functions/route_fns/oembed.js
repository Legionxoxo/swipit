/**
 * @fileoverview oEmbed functionality for Instagram post data extraction
 * @author Backend Team
 */

const { extractInstagramOembed } = require('../../utils/instagram/instagramOembed');

/**
 * @typedef {Object} OembedData
 * @property {string} version - oEmbed version
 * @property {string} type - Content type (rich, photo, video)
 * @property {string} title - Post title/caption
 * @property {string} author_name - Instagram username
 * @property {string} provider_name - Provider name (Instagram)
 * @property {string} provider_url - Provider URL
 * @property {string} html - Embed HTML content
 * @property {number} width - Content width
 * @property {number} height - Content height
 * @property {string} thumbnail_url - Thumbnail URL
 * @property {number} thumbnail_width - Thumbnail width
 * @property {number} thumbnail_height - Thumbnail height
 * @property {string} caption - Extracted caption text
 * @property {Array<string>} hashtags - Extracted hashtags
 * @property {Array<string>} mentions - Extracted mentions
 * @property {string} media_type - Media type (photo, video, carousel)
 * @property {string} post_url - Original post URL
 */

/**
 * Extract hashtags from caption text
 * @param {string} caption - Caption text
 * @returns {Array<string>} Array of hashtags without # symbol
 */
function extractHashtags(caption) {
    try {
        if (!caption || typeof caption !== 'string') return [];
        
        const hashtagRegex = /#[a-zA-Z0-9_\u00c0-\u024f\u1e00-\u1eff]+/g;
        const hashtags = caption.match(hashtagRegex);
        
        return hashtags ? hashtags.map(tag => tag.substring(1)) : [];
    } catch (error) {
        console.error('Error extracting hashtags:', error);
        return [];
    } finally {
        // Log extraction attempt
        console.log('Hashtag extraction completed');
    }
}

/**
 * Extract mentions from caption text
 * @param {string} caption - Caption text
 * @returns {Array<string>} Array of mentions without @ symbol
 */
function extractMentions(caption) {
    try {
        if (!caption || typeof caption !== 'string') return [];
        
        const mentionRegex = /@[a-zA-Z0-9_.]+/g;
        const mentions = caption.match(mentionRegex);
        
        return mentions ? mentions.map(mention => mention.substring(1)) : [];
    } catch (error) {
        console.error('Error extracting mentions:', error);
        return [];
    } finally {
        // Log extraction attempt
        console.log('Mention extraction completed');
    }
}

/**
 * Determine media type from oEmbed response
 * @param {Object} oembedResponse - oEmbed API response
 * @returns {string} Media type (photo, video, carousel)
 */
function determineMediaType(oembedResponse) {
    try {
        // Check HTML content for video indicators
        if (oembedResponse.html && oembedResponse.html.includes('video')) {
            return 'video';
        }
        
        // Check for carousel indicators
        if (oembedResponse.html && oembedResponse.html.includes('sidecar')) {
            return 'carousel';
        }
        
        // Default to photo
        return 'photo';
    } catch (error) {
        console.error('Error determining media type:', error);
        return 'photo';
    } finally {
        console.log('Media type determination completed');
    }
}

/**
 * Extract Instagram oEmbed data using Node.js implementation
 * @param {string} postUrl - Instagram post URL
 * @returns {Promise<Object>} oEmbed response data
 */
async function fetchInstagramOembed(postUrl) {
    try {
        console.log(`Fetching Instagram oEmbed for: ${postUrl}`);
        
        const oembedData = await extractInstagramOembed(postUrl);
        
        return oembedData;
        
    } catch (error) {
        console.error('Instagram oEmbed fetch error:', error);
        throw new Error(`Failed to fetch Instagram oEmbed: ${error.message}`);
    } finally {
        console.log(`oEmbed fetch completed for: ${postUrl}`);
    }
}

/**
 * Save oEmbed data to existing instagram_data table with creator association logic
 * @param {Object} oembedData - Processed oEmbed data with 8 required fields
 * @returns {Promise<string>} Analysis ID
 */
async function saveOembedData(oembedData) {
    try {
        const { getDatabase } = require('../../database/connection');
        const db = await getDatabase();
        
        // Check if this creator (author_id) already exists
        const existingCreator = await db.get(
            'SELECT instagram_user_id, profile_username FROM instagram_data WHERE instagram_user_id = ? LIMIT 1',
            [oembedData.author_id]
        );
        
        let creatorUserId = oembedData.author_id;
        let shouldUpdateUsername = false;
        
        if (existingCreator) {
            console.log(`Found existing creator with ID: ${oembedData.author_id}`);
            creatorUserId = existingCreator.instagram_user_id;
            
            // Check if username changed - if so, we'll update all records for this creator
            if (existingCreator.profile_username !== oembedData.username) {
                console.log(`Username changed from ${existingCreator.profile_username} to ${oembedData.username}`);
                shouldUpdateUsername = true;
            }
        } else {
            console.log(`New creator detected with ID: ${oembedData.author_id}`);
        }
        
        // Generate unique analysis ID for this oEmbed request
        const analysisId = `oembed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Insert new post record
        const insertSQL = `
            INSERT INTO instagram_data (
                analysis_id, instagram_user_id, profile_username, 
                reel_shortcode, reel_url, reel_caption, reel_hashtags, 
                reel_thumbnail_url,
                analysis_status, created_at, updated_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
        `;
        
        await db.run(insertSQL, [
            analysisId,
            creatorUserId,
            oembedData.username || '',
            oembedData.instagram_id || '',
            oembedData.post_link || '',
            oembedData.caption || '',
            JSON.stringify(oembedData.hashtags || []),
            oembedData.thumbnail_url || ''
        ]);
        
        // If username changed, update all existing records for this creator
        if (shouldUpdateUsername) {
            const updateSQL = `
                UPDATE instagram_data 
                SET profile_username = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE instagram_user_id = ?
            `;
            
            await db.run(updateSQL, [
                oembedData.username,
                creatorUserId
            ]);
            
            console.log(`Updated username for all posts of creator ${creatorUserId}`);
        }
        
        console.log('oEmbed data saved to instagram_data table successfully');
        console.log(`Creator ID: ${creatorUserId}, Post ID: ${oembedData.instagram_id}`);
        
        return analysisId;
    } catch (error) {
        console.error('Save oEmbed data error:', error);
        throw new Error(`Failed to save oEmbed data: ${error.message}`);
    } finally {
        // Database save operation completed
    }
}

/**
 * Get existing oEmbed data from database
 * @param {string} postUrl - Instagram post URL
 * @returns {Promise<Object|null>} Existing oEmbed data or null if not found
 */
async function getExistingOembedData(postUrl) {
    try {
        const { getDatabase } = require('../../database/connection');
        const db = await getDatabase();
        
        const selectSQL = `
            SELECT * FROM instagram_data WHERE reel_url = ? LIMIT 1
        `;
        
        const existingData = await db.get(selectSQL, [postUrl]);
        
        if (existingData) {
            // Parse JSON fields and map to our 8 required fields
            const hashtags = JSON.parse(existingData.reel_hashtags || '[]');
            
            // Convert database format back to our 8-field format
            const oembedData = {
                username: existingData.profile_username,
                profile_link: `https://www.instagram.com/${existingData.profile_username}/`,
                instagram_id: existingData.reel_shortcode || existingData.instagram_user_id,
                caption: existingData.reel_caption,
                hashtags: hashtags,
                thumbnail_url: existingData.reel_thumbnail_url,
                embed_link: `https://www.instagram.com/p/${existingData.reel_shortcode}/embed/`,
                post_link: existingData.reel_url
            };
            
            // Found existing oEmbed data in database
            return oembedData;
        }
        
        return null;
    } catch (error) {
        console.error('Get existing oEmbed data error:', error);
        return null;
    } finally {
        // Database lookup operation completed
    }
}

/**
 * Process oEmbed request - main function
 * @param {string} postUrl - Instagram post URL
 * @returns {Promise<Object>} Processed oEmbed data
 */
async function processOembedRequest(postUrl) {
    try {
        // Check if data already exists in database
        const existingData = await getExistingOembedData(postUrl);
        if (existingData) {
            // Returning existing oEmbed data from database
            return existingData;
        }

        // Fetch fresh data from Instagram oEmbed API
        const oembedResponse = await fetchInstagramOembed(postUrl);
        
        // Extract additional data
        const caption = oembedResponse.title || '';
        const hashtags = extractHashtags(caption);
        const mentions = extractMentions(caption);
        const mediaType = determineMediaType(oembedResponse);
        
        // Return only the requested fields (+ author_id for database)
        const oembedData = {
            username: oembedResponse.username || oembedResponse.author_name || '',
            profile_link: oembedResponse.profile_link || oembedResponse.author_url || '',
            instagram_id: oembedResponse.instagram_id || oembedResponse.shortcode || null,
            caption: oembedResponse.caption || '',
            hashtags: oembedResponse.hashtags || [],
            thumbnail_url: oembedResponse.thumbnail_url || null,
            embed_link: oembedResponse.embed_link || '',
            post_link: postUrl,
            author_id: oembedResponse.author_id || null  // For database storage
        };

        // Save to database
        const analysisId = await saveOembedData(oembedData);
        console.log(`oEmbed data saved with analysis ID: ${analysisId}`);
        
        // Remove author_id from response (only needed for database)
        const { author_id, ...responseData } = oembedData;
        return responseData;
        
    } catch (error) {
        console.error('Process oEmbed request error:', error);
        throw error;
    } finally {
        console.log(`oEmbed request processing completed for URL: ${postUrl}`);
    }
}

module.exports = {
    processOembedRequest,
    extractHashtags,
    extractMentions,
    determineMediaType,
    fetchInstagramOembed
};