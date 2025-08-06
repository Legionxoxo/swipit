/**
 * @fileoverview Text formatting utilities
 * @author Backend Team
 */

/**
 * Format duration from YouTube API format (PT1H2M3S) to readable format
 * @param {string} isoDuration - ISO 8601 duration string
 * @returns {string} Formatted duration (e.g., "1:02:03")
 */
function formatDuration(isoDuration) {
    try {
        if (!isoDuration || typeof isoDuration !== 'string') {
            return '0:00';
        }

        const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) {
            return '0:00';
        }

        const hours = parseInt(match[1], 10) || 0;
        const minutes = parseInt(match[2], 10) || 0;
        const seconds = parseInt(match[3], 10) || 0;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

    } catch (error) {
        console.error('Format duration error:', error);
        return '0:00';
    } finally {
        console.log(`Duration formatted: ${isoDuration}`);
    }
}

/**
 * Format large numbers with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
function formatNumber(num) {
    try {
        if (typeof num !== 'number' || isNaN(num)) {
            return '0';
        }

        return num.toLocaleString();

    } catch (error) {
        console.error('Format number error:', error);
        return String(num);
    } finally {
        console.log(`Number formatted: ${num}`);
    }
}

/**
 * Sanitize filename for safe file system usage
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
    try {
        if (!filename || typeof filename !== 'string') {
            return 'untitled';
        }

        return filename
            .replace(/[<>:"/\\|?*]/g, '_')
            .replace(/\s+/g, '_')
            .substring(0, 100)
            .toLowerCase();

    } catch (error) {
        console.error('Sanitize filename error:', error);
        return 'untitled';
    } finally {
        console.log(`Filename sanitized: ${filename}`);
    }
}

module.exports = {
    formatDuration,
    formatNumber,
    sanitizeFilename
};