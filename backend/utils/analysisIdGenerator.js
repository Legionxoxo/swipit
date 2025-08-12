/**
 * @fileoverview Centralized analysis ID generation with collision prevention
 * @author Backend Team
 */

const crypto = require('crypto');

/**
 * Generate a cryptographically secure random string
 * @param {number} length - Length of the random string
 * @returns {string} Random hexadecimal string
 */
function generateSecureRandom(length = 8) {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/**
 * Generate high-resolution timestamp with microsecond precision
 * @returns {string} Timestamp with microsecond precision
 */
function generateHighResTimestamp() {
    const now = process.hrtime.bigint();
    return now.toString();
}

/**
 * Analysis ID generator with collision prevention
 */
class AnalysisIdGenerator {
    constructor() {
        this.usedIds = new Set();
        this.maxRetries = 5;
    }

    /**
     * Generate unique analysis ID with retry mechanism
     * @param {string} prefix - Prefix for the analysis ID
     * @param {Object} options - Generation options
     * @param {string} options.context - Additional context (username, channel, etc.)
     * @param {boolean} options.includeRandom - Whether to include random component (default: true)
     * @param {number} options.randomLength - Length of random component (default: 8)
     * @returns {Promise<string>} Unique analysis ID
     */
    async generateUniqueId(prefix, options = {}) {
        const {
            context = null,
            includeRandom = true,
            randomLength = 8
        } = options;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                let id = prefix;

                // Add context if provided
                if (context) {
                    const sanitizedContext = this._sanitizeContext(context);
                    id += `_${sanitizedContext}`;
                }

                // Add high-resolution timestamp
                const timestamp = generateHighResTimestamp();
                id += `_${timestamp}`;

                // Add random component for extra uniqueness
                if (includeRandom) {
                    const randomPart = generateSecureRandom(randomLength);
                    id += `_${randomPart}`;
                }

                // Check for collision (in-memory check)
                if (!this.usedIds.has(id)) {
                    this.usedIds.add(id);
                    return id;
                }

                // If collision detected, wait before retry
                if (attempt < this.maxRetries) {
                    await this._wait(attempt * 10); // Exponential backoff
                }

            } catch (error) {
                console.error(`Analysis ID generation attempt ${attempt} failed:`, error);
                if (attempt === this.maxRetries) {
                    throw new Error(`Failed to generate unique analysis ID after ${this.maxRetries} attempts`);
                }
            }
        }

        throw new Error(`Failed to generate unique analysis ID after ${this.maxRetries} attempts`);
    }

    /**
     * Generate main analysis ID
     * @param {Object} options - Generation options
     * @returns {Promise<string>} Unique analysis ID
     */
    async generateMainAnalysisId(options = {}) {
        return this.generateUniqueId('analysis', options);
    }

    /**
     * Generate oEmbed analysis ID
     * @param {Object} options - Generation options
     * @returns {Promise<string>} Unique oEmbed analysis ID
     */
    async generateOEmbedAnalysisId(options = {}) {
        return this.generateUniqueId('oembed', options);
    }

    /**
     * Generate CSV import analysis ID
     * @param {string} username - Username for context
     * @param {Object} options - Generation options
     * @returns {Promise<string>} Unique CSV analysis ID
     */
    async generateCSVAnalysisId(username, options = {}) {
        return this.generateUniqueId('csv', {
            ...options,
            context: username
        });
    }

    /**
     * Generate Instagram profile analysis ID
     * @param {string} userId - Instagram user ID
     * @param {Object} options - Generation options
     * @returns {Promise<string>} Unique Instagram profile analysis ID
     */
    async generateInstagramProfileId(userId, options = {}) {
        return this.generateUniqueId('instagram_profile', {
            ...options,
            context: userId
        });
    }

    /**
     * Generate Instagram reel analysis ID
     * @param {string} reelId - Instagram reel ID
     * @param {Object} options - Generation options
     * @returns {Promise<string>} Unique Instagram reel analysis ID
     */
    async generateInstagramReelId(reelId, options = {}) {
        return this.generateUniqueId('instagram_reel', {
            ...options,
            context: reelId
        });
    }

    /**
     * Generate YouTube creator analysis ID
     * @param {string} channelId - YouTube channel ID
     * @param {Object} options - Generation options
     * @returns {Promise<string>} Unique YouTube creator analysis ID
     */
    async generateYouTubeCreatorId(channelId, options = {}) {
        return this.generateUniqueId('youtube_creator', {
            ...options,
            context: channelId
        });
    }

    /**
     * Sanitize context string for use in ID
     * @param {string} context - Context string
     * @returns {string} Sanitized context
     * @private
     */
    _sanitizeContext(context) {
        if (!context) return '';
        
        return context
            .toString()
            .replace(/[^a-zA-Z0-9_-]/g, '') // Remove special characters
            .substring(0, 50) // Limit length
            .toLowerCase();
    }

    /**
     * Wait for specified milliseconds
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise<void>}
     * @private
     */
    _wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear used IDs cache (for testing)
     */
    clearCache() {
        this.usedIds.clear();
    }

    /**
     * Get cache size
     * @returns {number} Number of cached IDs
     */
    getCacheSize() {
        return this.usedIds.size;
    }
}

// Singleton instance for global use
const globalGenerator = new AnalysisIdGenerator();

/**
 * Database collision detection and retry wrapper
 * @param {Function} dbCheckFunction - Function that checks database for ID collision
 * @param {Function} generateIdFunction - Function that generates new ID
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<string>} Unique database-validated ID
 */
async function generateUniqueIdWithDbCheck(dbCheckFunction, generateIdFunction, maxRetries = 5) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const id = await generateIdFunction();
            
            // Check database for collision
            const existsInDb = await dbCheckFunction(id);
            
            if (!existsInDb) {
                return id;
            }

            // If collision found in database, wait before retry
            if (attempt < maxRetries) {
                await globalGenerator._wait(attempt * 50); // Exponential backoff
                console.warn(`Analysis ID collision detected in database: ${id}. Retrying... (${attempt}/${maxRetries})`);
            }

        } catch (error) {
            console.error(`Database collision check attempt ${attempt} failed:`, error);
            if (attempt === maxRetries) {
                throw new Error(`Failed to generate database-unique analysis ID after ${maxRetries} attempts: ${error.message}`);
            }
        }
    }

    throw new Error(`Failed to generate database-unique analysis ID after ${maxRetries} attempts`);
}

module.exports = {
    AnalysisIdGenerator,
    globalGenerator,
    generateUniqueIdWithDbCheck,
    generateSecureRandom,
    generateHighResTimestamp
};