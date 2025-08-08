/**
 * @fileoverview Instagram oEmbed data extraction utility (Node.js version)
 * @author Backend Team
 * Converted from Python script to eliminate Python server dependency
 */

const axios = require('axios');
const { decode } = require('html-entities');

/**
 * @typedef {Object} InstagramOembedData
 * @property {string} author_name - Instagram username
 * @property {string} username - Instagram username (alias)
 * @property {string} author_id - Instagram user ID
 * @property {string} profile_link - Profile URL
 * @property {string} instagram_id - Post shortcode
 * @property {string} shortcode - Post shortcode (alias)
 * @property {string} caption - Post caption
 * @property {string} title - Post title
 * @property {string} author_url - Profile URL (alias)
 * @property {string} thumbnail_url - Thumbnail image URL
 * @property {string} post_link - Original post URL
 * @property {string} embed_link - Embed URL
 * @property {string} html_embed - HTML embed code
 * @property {string} provider_name - Always 'Instagram'
 * @property {string} provider_url - Always 'https://www.instagram.com'
 * @property {string} version - oEmbed version
 * @property {string} type - Content type
 * @property {Array<string>} [mentions] - Mentioned usernames
 * @property {number} [mention_count] - Number of mentions
 * @property {number} [character_count] - Caption character count
 * @property {number} [word_count] - Caption word count
 * @property {number} [line_count] - Caption line count
 */

/**
 * Extract shortcode from Instagram URL
 * @param {string} url - Instagram URL
 * @returns {string|null} Shortcode or null if not found
 */
function extractShortcodeFromUrl(url) {
    try {
        // Match patterns like /p/ABC123/ or /reel/ABC123/
        const match = url.match(/\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
        if (match) {
            return match[1];
        }
        return null;
    } catch (error) {
        console.error('Error extracting shortcode:', error);
        return null;
    }
}

/**
 * Try to get creator info using Instagram's oEmbed API
 * @param {string} reelUrl - Instagram post URL
 * @returns {Promise<Object|null>} oEmbed data or null
 */
async function extractFromEmbedUrl(reelUrl) {
    try {
        const encodedUrl = encodeURIComponent(reelUrl);
        const embedUrl = `https://www.instagram.com/oembed/?url=${encodedUrl}`;
        
        const response = await axios.get(embedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; oEmbed)'
            },
            timeout: 10000
        });
        
        if (response.status === 200) {
            // Check if response is JSON (proper oEmbed response) or HTML
            if (typeof response.data === 'object' && response.data.version) {
                return response.data;
            } else if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
                return null; // Let the main function handle HTML scraping
            }
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Extract creator information from Instagram reel URL
 * @param {string} reelUrl - Instagram post URL
 * @returns {Promise<InstagramOembedData>} Extracted data or error object
 */
async function getReelCreator(reelUrl) {
    try {
        // Extract shortcode from URL
        const shortcode = extractShortcodeFromUrl(reelUrl);

        // Try Instagram's oEmbed API first
        const oembedResult = await extractFromEmbedUrl(reelUrl);
        if (oembedResult) {
            return oembedResult;
        }

        // Fallback: Fetch URL directly
        
        const response = await axios.get(reelUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none'
            },
            timeout: 15000
        });

        const content = response.data;

        // Extract thumbnail URL
        let thumbnailUrl = null;
        const thumbnailPatterns = [
            /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
            /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
            /<link\s+rel=["']image_src["']\s+href=["']([^"']+)["']/i
        ];

        for (const pattern of thumbnailPatterns) {
            const thumbMatch = content.match(pattern);
            if (thumbMatch) {
                thumbnailUrl = thumbMatch[1];
                break;
            }
        }

        // Method 1: Look for window._sharedData
        const sharedDataMatch = content.match(/window\._sharedData\s*=\s*({.+?});/s);
        if (sharedDataMatch) {
            try {
                const sharedData = JSON.parse(sharedDataMatch[1]);
                
                const entryData = sharedData.entry_data || {};
                if (entryData.PostPage) {
                    const posts = entryData.PostPage;
                    if (posts && posts.length > 0) {
                        const post = posts[0];
                        const media = post.graphql?.shortcode_media || {};
                        const owner = media.owner || {};
                        const username = owner.username || '';
                        const authorId = owner.id || '';
                        
                        if (username && authorId) {
                            const captionEdges = media.edge_media_to_caption?.edges || [];
                            const captionText = captionEdges[0]?.node?.text || '';
                            
                            return createOembedResponse(username, authorId, shortcode, captionText, captionText, thumbnailUrl, reelUrl);
                        }
                    }
                }
            } catch (error) {
                // Failed to parse shared data
            }
        }

        // Method 2: Look for script patterns with user data
        const scriptPatterns = [
            /window\.__additionalDataLoaded\([^,]+,({[^}]+\"id\":\"(\d+)\"[^}]+})\)/,
            /"owner":\s*{\s*"id":\s*"(\d+)"[^}]*"username":\s*"([^"]+)"/,
            /"user":\s*{\s*"pk":\s*"?(\d+)"?[^}]*"username":\s*"([^"]+)"/
        ];

        for (let i = 0; i < scriptPatterns.length; i++) {
            const matches = content.match(new RegExp(scriptPatterns[i].source, 'g'));
            if (matches) {
                
                for (const match of matches) {
                    const matchResult = match.match(scriptPatterns[i]);
                    if (matchResult && matchResult.length >= 3) {
                        let authorId, username;
                        
                        if (i === 1 || i === 2) { // owner/user patterns
                            authorId = matchResult[1];
                            username = matchResult[2];
                        } else {
                            continue;
                        }
                        
                        if (authorId && username) {
                            
                            // Extract caption from meta content
                            const { captionText, titleText } = extractMetaContent(content);
                            
                            return createOembedResponse(username, authorId, shortcode, captionText, titleText, thumbnailUrl, reelUrl);
                        }
                    }
                }
            }
        }

        // Method 3: Try modern Instagram patterns
        const modernPatterns = [
            /"owner":\s*{[^}]*"id":\s*"(\d+)"[^}]*"username":\s*"([^"]+)"/g,
            /"user":\s*{[^}]*"pk":\s*(\d+)[^}]*"username":\s*"([^"]+)"/g,
            /"pk":\s*(\d+)[^,}]*,\s*"username":\s*"([^"]+)"/g,
            /"id":\s*"(\d+)"[^}]*"username":\s*"([^"]+)"/g,
            /{"id":"(\d+)"[^}]*"username":"([^"]+)"}/g,
            /"userID":"(\d+)"[^}]*"username":"([^"]+)"/g,
            // Reverse order patterns
            /"username":\s*"([^"]+)"[^}]*"id":\s*"(\d+)"/g,
            /"username":\s*"([^"]+)"[^}]*"pk":\s*(\d+)/g,
            /"username":"([^"]+)"[^}]*"id":"(\d+)"/g,
            /"username":"([^"]+)"[^}]*"pk":(\d+)/g
        ];

        for (let i = 0; i < modernPatterns.length; i++) {
            const matches = [...content.matchAll(modernPatterns[i])];
            if (matches.length > 0) {
                
                for (const match of matches) {
                    let authorId, username;
                    
                    // Handle different pattern structures
                    if (i <= 5) { // First 6 patterns: (id, username)
                        authorId = match[1];
                        username = match[2];
                    } else { // Reverse patterns: (username, id)
                        username = match[1];
                        authorId = match[2];
                    }
                    
                    // Validate that we have both values and they make sense
                    if (authorId && username && authorId.length >= 8) {
                        const urlLower = reelUrl.toLowerCase();
                        const usernameClean = username.replace('@', '').toLowerCase();
                        
                        if (usernameClean.length > 2 && (urlLower.includes(usernameClean) || usernameClean.length > 2)) {
                            
                            // Extract caption and return
                            const { captionText, titleText } = extractMetaContent(content);
                            
                            return createOembedResponse(username, authorId, shortcode, captionText, titleText, thumbnailUrl, reelUrl);
                        }
                    }
                }
            }
        }

        // Method 4: Try looser patterns for author_id
        const looserPatterns = [
            /"pk":\s*"?(\d+)"?[^}]*"username":\s*"([^"]+)"/g,
            /"id":\s*"(\d+)"[^}]*"username":\s*"([^"]+)"/g
        ];

        for (let i = 0; i < looserPatterns.length; i++) {
            const matches = [...content.matchAll(looserPatterns[i])];
            if (matches.length > 0) {
                
                for (const match of matches) {
                    const authorId = match[1];
                    const username = match[2];
                    
                    if (authorId && username && username.toLowerCase() !== 'instagram') {
                        
                        // Extract caption and return
                        const { captionText, titleText } = extractMetaContent(content);
                        
                        return createOembedResponse(username, authorId, shortcode, captionText, titleText, thumbnailUrl, reelUrl);
                    }
                }
            }
        }

        // Final fallback: Extract from meta tags (but return error if no author_id found)
        const { captionText, titleText } = extractMetaContent(content);
        
        const metaPatterns = [
            /@([a-zA-Z0-9._]+)/,
            /([a-zA-Z0-9._]+)\s+on Instagram/,
            /Instagram post by ([a-zA-Z0-9._]+)/
        ];

        for (const pattern of metaPatterns) {
            const match = titleText.match(pattern);
            if (match) {
                const username = match[1];
                if (username && username.toLowerCase() !== 'instagram') {
                    return { error: 'Could not extract author ID from Instagram post' };
                }
            }
        }

        // Look in page title as final attempt
        const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
            const titleText = titleMatch[1];
            
            const titlePatterns = [
                /^(.+?)\s+on Instagram/,
                /Instagram post by (.+?)\s/,
                /@([a-zA-Z0-9._]+)/,
                /"([^"]+)"\s+•.*Instagram/
            ];

            for (const pattern of titlePatterns) {
                const match = titleText.match(pattern);
                if (match) {
                    const potentialUsername = match[1].trim();
                    const cleanUsername = potentialUsername.replace(/[^a-zA-Z0-9._]/g, '');
                    if (cleanUsername && cleanUsername.length > 0) {
                        return { error: 'Could not extract author ID from Instagram post' };
                    }
                }
            }
        }

        return { error: 'Could not extract creator information' };

    } catch (error) {
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return { error: `Request failed: ${error.message}` };
        }
        return { error: `Parsing failed: ${error.message}` };
    }
}

/**
 * Extract meta content (caption and title)
 * @param {string} content - HTML content
 * @returns {Object} Object with captionText and titleText
 */
function extractMetaContent(content) {
    let captionText = '';
    let titleText = '';

    const metaPatterns = [
        /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i,
        /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i,
        /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i
    ];

    for (const pattern of metaPatterns) {
        const metaMatch = content.match(pattern);
        if (metaMatch) {
            const metaContent = metaMatch[1];
            titleText = metaContent;
            
            // Extract clean caption from meta content
            const decodedContent = decode(metaContent);
            const captionMatch = decodedContent.match(/:\s*["\u201C\u0022]([^"\u201D\u0022]*)["\u201D\u0022]/);
            if (captionMatch) {
                captionText = captionMatch[1];
            }
            break;
        }
    }

    return { captionText, titleText };
}

/**
 * Create standardized oEmbed response
 * @param {string} username - Instagram username
 * @param {string} authorId - Instagram user ID
 * @param {string} shortcode - Post shortcode
 * @param {string} captionText - Post caption
 * @param {string} titleText - Post title
 * @param {string} thumbnailUrl - Thumbnail URL
 * @param {string} reelUrl - Original post URL
 * @returns {InstagramOembedData} Formatted oEmbed data
 */
function createOembedResponse(username, authorId, shortcode, captionText, titleText, thumbnailUrl, reelUrl) {
    const result = {
        author_name: username,
        username: username,
        author_id: authorId,
        profile_link: `https://www.instagram.com/${username}/`,
        instagram_id: shortcode,
        shortcode: shortcode,
        caption: captionText,
        title: titleText,
        author_url: `https://www.instagram.com/${username}/`,
        thumbnail_url: thumbnailUrl,
        post_link: reelUrl,
        embed_link: `https://www.instagram.com/p/${shortcode}/embed/`,
        html_embed: `<blockquote class="instagram-media" data-instgrm-permalink="${reelUrl}"><a href="${reelUrl}">Instagram post</a></blockquote><script async src="//www.instagram.com/embed.js"></script>`,
        provider_name: 'Instagram',
        provider_url: 'https://www.instagram.com',
        version: '1.0',
        type: 'rich'
    };

    // Add content analysis
    if (captionText) {
        const decodedCaption = decode(captionText);
        
        // Extract mentions
        const mentions = [...decodedCaption.matchAll(/@([a-zA-Z0-9_.]+)/g)].map(m => m[1]);
        if (mentions.length > 0) {
            result.mentions = mentions;
            result.mention_count = mentions.length;
        }

        // Basic text analysis
        result.character_count = decodedCaption.length;
        result.word_count = decodedCaption.split(/\s+/).length;
        result.line_count = decodedCaption.split('\n').length;
    }

    return result;
}

/**
 * Main function to extract Instagram oEmbed data
 * @param {string} postUrl - Instagram post URL
 * @returns {Promise<InstagramOembedData>} Extracted oEmbed data
 */
async function extractInstagramOembed(postUrl) {
    try {
        
        const reelInfo = await getReelCreator(postUrl);
        
        if (reelInfo.error) {
            throw new Error(reelInfo.error);
        }
        
        return reelInfo;
        
    } catch (error) {
        console.error('Instagram oEmbed extraction error:', error);
        throw new Error(`Failed to extract Instagram oEmbed data: ${error.message}`);
    }
}

module.exports = {
    extractInstagramOembed,
    extractShortcodeFromUrl,
    getReelCreator
};