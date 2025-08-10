#!/usr/bin/env node

/**
 * @fileoverview Script to fetch one post/reel for each Instagram profile
 * @author Backend Team
 */

const fs = require('fs');
const path = require('path');
const { validateInstagramUsername } = require('../utils/instagram/profileResolver');

/**
 * Read profile links from text file
 * @param {string} filePath - Path to profile links file
 * @returns {Array<string>} Array of profile URLs
 */
function readProfileLinks(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        
        // Skip header and filter valid URLs
        return lines
            .slice(1)
            .map(line => line.trim())
            .filter(line => line.startsWith('http'));
    } catch (error) {
        console.error('Error reading profile links:', error);
        return [];
    }
}

/**
 * Extract username from Instagram URL
 * @param {string} profileUrl - Instagram profile URL
 * @returns {string} Username
 */
function extractUsername(profileUrl) {
    return profileUrl
        .replace('https://www.instagram.com/', '')
        .replace('/', '')
        .trim();
}

/**
 * Generate sample post URLs for profiles
 * This is a placeholder - in production, you'd fetch actual posts
 * @param {Array<string>} profileUrls - Array of profile URLs
 * @returns {Array<Object>} Array of profile-post mappings
 */
function generateProfilePostMappings(profileUrls) {
    const mappings = [];
    
    // Sample post IDs for demonstration
    const samplePostIds = [
        'C1234567890A', 'C2345678901B', 'C3456789012C', 
        'C4567890123D', 'C5678901234E', 'C6789012345F'
    ];
    
    profileUrls.forEach((profileUrl, index) => {
        const username = extractUsername(profileUrl);
        const validation = validateInstagramUsername(username);
        
        if (validation.valid) {
            // For demonstration, alternate between posts and reels
            const isReel = index % 2 === 0;
            const postType = isReel ? 'reel' : 'p';
            const postId = samplePostIds[index % samplePostIds.length] + index;
            
            mappings.push({
                profile_url: profileUrl,
                username: validation.cleanUsername,
                post_url: `https://www.instagram.com/${postType}/${postId}/`,
                post_type: isReel ? 'reel' : 'post',
                status: 'sample'
            });
        } else {
            mappings.push({
                profile_url: profileUrl,
                username: username,
                post_url: '',
                post_type: '',
                status: 'invalid_username'
            });
        }
    });
    
    return mappings;
}

/**
 * Save mappings to CSV file
 * @param {Array<Object>} mappings - Profile-post mappings
 * @param {string} outputPath - Output CSV file path
 */
function saveToCSV(mappings, outputPath) {
    const headers = ['profile_url', 'username', 'post_url', 'post_type', 'status'];
    const csvContent = [
        headers.join(','),
        ...mappings.map(row => 
            headers.map(header => `"${row[header] || ''}"`).join(',')
        )
    ].join('\n');
    
    fs.writeFileSync(outputPath, csvContent);
    console.log(`✓ Saved ${mappings.length} mappings to ${outputPath}`);
}

/**
 * Main function
 */
async function main() {
    console.log('=' .repeat(60));
    console.log('Instagram Profile-Post Mapper');
    console.log('=' .repeat(60));
    
    const profileLinksPath = path.join(process.cwd(), 'profile_link.txt');
    const outputPath = path.join(process.cwd(), 'profile_posts.csv');
    
    // Read profile links
    console.log('\n1. Reading profile links...');
    const profileUrls = readProfileLinks(profileLinksPath);
    console.log(`   Found ${profileUrls.length} profiles`);
    
    if (profileUrls.length === 0) {
        console.error('No profiles found in profile_link.txt');
        process.exit(1);
    }
    
    // Generate mappings
    console.log('\n2. Generating profile-post mappings...');
    const mappings = generateProfilePostMappings(profileUrls);
    
    // Show sample
    console.log('\n3. Sample mappings:');
    mappings.slice(0, 5).forEach(mapping => {
        console.log(`   ${mapping.username} -> ${mapping.post_type || 'N/A'}`);
    });
    
    // Save to CSV
    console.log('\n4. Saving to CSV...');
    saveToCSV(mappings, outputPath);
    
    console.log('\n✓ Complete!');
    console.log('\nNote: This script generates sample post URLs for demonstration.');
    console.log('To fetch actual posts, you would need to:');
    console.log('1. Use Instagram\'s Graph API with proper authentication');
    console.log('2. Use the Chrome extension to gather data while browsing');
    console.log('3. Manually collect post URLs from each profile');
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Error:', error);
        process.exit(1);
    });
}

module.exports = {
    readProfileLinks,
    extractUsername,
    generateProfilePostMappings,
    saveToCSV
};