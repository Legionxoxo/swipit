/**
 * @fileoverview Video statistics calculation utilities
 * @author Backend Team
 */

/**
 * @typedef {Object} VideoData
 * @property {string} id - Video ID
 * @property {string} title - Video title
 * @property {string} description - Video description
 * @property {string} thumbnailUrl - Thumbnail URL
 * @property {string} uploadDate - Upload date
 * @property {string} duration - Video duration
 * @property {number} viewCount - View count
 * @property {number} likeCount - Like count
 * @property {number} commentCount - Comment count
 * @property {string} categoryId - Category ID
 */

/**
 * Calculate total views across all videos
 * @param {VideoData[]} videos - Array of video data
 * @returns {number} Total view count
 */
function calculateTotalViews(videos) {
    try {
        if (!videos || !Array.isArray(videos)) {
            return 0;
        }

        return videos.reduce((total, video) => {
            return total + (video.viewCount || 0);
        }, 0);

    } catch (error) {
        console.error('Calculate total views error:', error);
        return 0;
    } finally {
        console.log(`Calculated total views for ${videos ? videos.length : 0} videos`);
    }
}

/**
 * Calculate average views across all videos
 * @param {VideoData[]} videos - Array of video data
 * @returns {number} Average view count
 */
function calculateAverageViews(videos) {
    try {
        if (!videos || !Array.isArray(videos) || videos.length === 0) {
            return 0;
        }

        const totalViews = calculateTotalViews(videos);
        return Math.round(totalViews / videos.length);

    } catch (error) {
        console.error('Calculate average views error:', error);
        return 0;
    } finally {
        console.log(`Calculated average views for ${videos ? videos.length : 0} videos`);
    }
}

/**
 * Find most viewed video
 * @param {VideoData[]} videos - Array of video data
 * @returns {VideoData|null} Most viewed video
 */
function findMostViewedVideo(videos) {
    try {
        if (!videos || !Array.isArray(videos) || videos.length === 0) {
            return null;
        }

        return videos.reduce((mostViewed, video) => {
            const currentViews = video.viewCount || 0;
            const mostViewedViews = mostViewed.viewCount || 0;
            
            return currentViews > mostViewedViews ? video : mostViewed;
        }, videos[0]);

    } catch (error) {
        console.error('Find most viewed video error:', error);
        return null;
    } finally {
        console.log(`Found most viewed video from ${videos ? videos.length : 0} videos`);
    }
}

module.exports = {
    calculateTotalViews,
    calculateAverageViews,
    findMostViewedVideo
};