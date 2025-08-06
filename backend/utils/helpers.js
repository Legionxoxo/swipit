/**
 * @fileoverview Main helper utilities - consolidated exports
 * @author Backend Team
 */

// Import utilities from organized modules
const { generateAnalysisId } = require('./idGenerator');
const { 
    parseChannelUrl, 
    resolveHandleToChannelId, 
    resolveUsernameToChannelId, 
    resolveCustomUrlToChannelId 
} = require('./youtube/channelResolver');
const { validateApiKeyFormat } = require('./validation/validators');
const { 
    formatDuration, 
    formatNumber, 
    sanitizeFilename 
} = require('./formatting/textFormatters');

/**
 * Re-export all helper functions for backward compatibility
 */
module.exports = {
    generateAnalysisId,
    parseChannelUrl,
    resolveHandleToChannelId,
    resolveUsernameToChannelId,
    resolveCustomUrlToChannelId,
    validateApiKeyFormat,
    formatDuration,
    formatNumber,
    sanitizeFilename
};