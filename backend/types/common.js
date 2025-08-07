/**
 * @fileoverview Common type definitions for the backend
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
 * @typedef {Object} ChannelInfo
 * @property {string} channelId - Channel ID
 * @property {string} channelName - Channel name
 * @property {string} channelUrl - Channel URL
 * @property {number} subscriberCount - Subscriber count
 * @property {number} videoCount - Total video count
 * @property {string} creationDate - Channel creation date
 * @property {string} description - Channel description
 * @property {string} thumbnailUrl - Channel thumbnail URL
 * @property {string} uploadsPlaylistId - Uploads playlist ID
 */

/**
 * @typedef {Object} VideoSegments
 * @property {VideoData[]} low - 0-1,000 views
 * @property {VideoData[]} medium - 1,001-10,000 views
 * @property {VideoData[]} high - 10,001-100,000 views
 * @property {VideoData[]} veryHigh - 100,001-1,000,000 views
 * @property {VideoData[]} viral - 1,000,001+ views
 */

/**
 * @typedef {Object} AnalysisJob
 * @property {string} analysisId - Unique analysis ID
 * @property {string} channelUrl - Original channel URL
 * @property {string} channelId - YouTube channel ID
 * @property {string} status - Current status (processing, completed, error)
 * @property {number} progress - Progress percentage (0-100)
 * @property {Date} startTime - Analysis start time
 * @property {Date} [endTime] - Analysis end time
 * @property {VideoData[]} [data] - Analysis results
 * @property {ChannelInfo} [channelInfo] - Channel information
 * @property {VideoSegments} [videoSegments] - Video segments by view count
 * @property {number} [totalVideos] - Total number of videos
 * @property {number} [processingTime] - Processing time in seconds
 * @property {string} [error] - Error message if failed
 */

module.exports = {};