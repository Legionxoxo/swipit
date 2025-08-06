/**
 * @fileoverview Instagram profile resolution and username validation
 * @author Backend Team
 */

/**
 * @typedef {Object} UsernameValidationResult
 * @property {boolean} valid - Whether username is valid
 * @property {string} cleanUsername - Cleaned username without @
 * @property {string} [error] - Error message if invalid
 */

/**
 * Validate Instagram username format
 * @param {string} username - Instagram username
 * @returns {UsernameValidationResult} Validation result
 */
function validateInstagramUsername(username) {
    try {
        if (!username || typeof username !== 'string') {
            return {
                valid: false,
                cleanUsername: '',
                error: 'Username is required and must be a string'
            };
        }

        // Clean username (remove @ if present and trim whitespace)
        const cleanUsername = username.replace('@', '').trim();

        // Check if empty after cleaning
        if (!cleanUsername) {
            return {
                valid: false,
                cleanUsername: '',
                error: 'Username cannot be empty'
            };
        }

        // Instagram username rules:
        // - 1-30 characters
        // - Only letters, numbers, periods, and underscores
        // - Cannot start or end with period
        // - Cannot have consecutive periods
        const usernameRegex = /^[a-zA-Z0-9._]+$/;
        
        if (!usernameRegex.test(cleanUsername)) {
            return {
                valid: false,
                cleanUsername: cleanUsername,
                error: 'Username contains invalid characters. Only letters, numbers, periods, and underscores are allowed'
            };
        }

        // Check length
        if (cleanUsername.length < 1 || cleanUsername.length > 30) {
            return {
                valid: false,
                cleanUsername: cleanUsername,
                error: 'Username must be between 1 and 30 characters'
            };
        }

        // Check for consecutive periods
        if (cleanUsername.includes('..')) {
            return {
                valid: false,
                cleanUsername: cleanUsername,
                error: 'Username cannot contain consecutive periods'
            };
        }

        // Check if starts or ends with period
        if (cleanUsername.startsWith('.') || cleanUsername.endsWith('.')) {
            return {
                valid: false,
                cleanUsername: cleanUsername,
                error: 'Username cannot start or end with a period'
            };
        }

        // Valid username
        return {
            valid: true,
            cleanUsername: cleanUsername
        };

    } catch (error) {
        console.error('Instagram username validation error:', error);
        return {
            valid: false,
            cleanUsername: '',
            error: 'Username validation failed'
        };
    } finally {
        console.log(`Instagram username validation attempted: ${username}`);
    }
}

/**
 * Format username for display (add @ prefix)
 * @param {string} username - Clean username
 * @returns {string} Formatted username with @
 */
function formatInstagramUsername(username) {
    try {
        if (!username) {
            return '';
        }

        const cleanUsername = username.replace('@', '').trim();
        return cleanUsername ? `@${cleanUsername}` : '';

    } catch (error) {
        console.error('Instagram username formatting error:', error);
        return '';
    } finally {
        console.log(`Instagram username formatted: ${username}`);
    }
}

/**
 * Generate Instagram profile URL from username
 * @param {string} username - Clean username
 * @returns {string} Instagram profile URL
 */
function generateInstagramProfileUrl(username) {
    try {
        if (!username) {
            return '';
        }

        const cleanUsername = username.replace('@', '').trim();
        return cleanUsername ? `https://instagram.com/${cleanUsername}/` : '';

    } catch (error) {
        console.error('Instagram profile URL generation error:', error);
        return '';
    } finally {
        console.log(`Instagram profile URL generated: ${username}`);
    }
}

/**
 * Sanitize username input for security
 * @param {string} username - Raw username input
 * @returns {string} Sanitized username
 */
function sanitizeInstagramUsername(username) {
    try {
        if (!username || typeof username !== 'string') {
            return '';
        }

        // Remove potentially dangerous characters and limit length
        const sanitized = username
            .replace(/[<>\"'&]/g, '') // Remove HTML/script injection characters
            .replace(/\s+/g, '') // Remove all whitespace
            .substring(0, 50) // Limit to reasonable length
            .trim();

        return sanitized;

    } catch (error) {
        console.error('Instagram username sanitization error:', error);
        return '';
    } finally {
        console.log(`Instagram username sanitized: ${username}`);
    }
}

/**
 * Extract username from Instagram URL
 * @param {string} url - Instagram URL
 * @returns {string} Extracted username or empty string
 */
function extractUsernameFromUrl(url) {
    try {
        if (!url || typeof url !== 'string') {
            return '';
        }

        // Instagram URL patterns:
        // https://instagram.com/username/
        // https://www.instagram.com/username/
        // instagram.com/username
        const urlPatterns = [
            /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)\/?/,
            /^(?:https?:\/\/)?(?:www\.)?ig\.com\/([a-zA-Z0-9._]+)\/?/
        ];

        for (const pattern of urlPatterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        return '';

    } catch (error) {
        console.error('Username extraction from URL error:', error);
        return '';
    } finally {
        console.log(`Username extraction attempted from URL: ${url}`);
    }
}

/**
 * Validate and resolve Instagram input (username or URL)
 * @param {string} input - Username or URL input
 * @returns {UsernameValidationResult} Validation and resolution result
 */
function resolveInstagramInput(input) {
    try {
        if (!input || typeof input !== 'string') {
            return {
                valid: false,
                cleanUsername: '',
                error: 'Input is required'
            };
        }

        // Sanitize input first
        const sanitizedInput = sanitizeInstagramUsername(input);
        
        // Try to extract username from URL first
        const extractedUsername = extractUsernameFromUrl(sanitizedInput);
        const usernameToValidate = extractedUsername || sanitizedInput;

        // Validate the username
        return validateInstagramUsername(usernameToValidate);

    } catch (error) {
        console.error('Instagram input resolution error:', error);
        return {
            valid: false,
            cleanUsername: '',
            error: 'Input resolution failed'
        };
    } finally {
        console.log(`Instagram input resolution attempted: ${input}`);
    }
}

module.exports = {
    validateInstagramUsername,
    formatInstagramUsername,
    generateInstagramProfileUrl,
    sanitizeInstagramUsername,
    extractUsernameFromUrl,
    resolveInstagramInput
};