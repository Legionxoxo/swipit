/**
 * @fileoverview Instagram reel content analysis (hashtags and mentions)
 * @author Backend Team
 */

/**
 * Analyze hashtag usage across reels
 * @param {Array<Object>} reels - Array of reel data
 * @returns {Object} Hashtag analysis results
 */
function analyzeHashtagUsage(reels) {
    try {
        if (!reels || !Array.isArray(reels) || reels.length === 0) {
            return {
                totalUniqueHashtags: 0,
                mostUsedHashtags: [],
                hashtagsByFrequency: {},
                averageHashtagsPerReel: 0
            };
        }

        const hashtagFrequency = {};
        let totalHashtags = 0;

        reels.forEach(reel => {
            const hashtags = reel.hashtags || [];
            if (Array.isArray(hashtags)) {
                totalHashtags += hashtags.length;
                hashtags.forEach(hashtag => {
                    const cleanHashtag = hashtag.toLowerCase();
                    hashtagFrequency[cleanHashtag] = (hashtagFrequency[cleanHashtag] || 0) + 1;
                });
            }
        });

        // Sort hashtags by frequency
        const sortedHashtags = Object.entries(hashtagFrequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 20); // Top 20 hashtags

        const mostUsedHashtags = sortedHashtags.map(([hashtag, count]) => ({
            hashtag,
            count,
            percentage: Math.round((count / reels.length) * 100 * 100) / 100
        }));

        const averageHashtagsPerReel = reels.length > 0 ? Math.round((totalHashtags / reels.length) * 100) / 100 : 0;

        return {
            totalUniqueHashtags: Object.keys(hashtagFrequency).length,
            mostUsedHashtags,
            hashtagsByFrequency: hashtagFrequency,
            averageHashtagsPerReel
        };

    } catch (error) {
        console.error('Analyze hashtag usage error:', error);
        throw new Error(`Failed to analyze hashtag usage: ${error.message}`);
    } finally {
        console.log(`Hashtag analysis completed for ${reels ? reels.length : 0} reels`);
    }
}

/**
 * Analyze mention usage across reels
 * @param {Array<Object>} reels - Array of reel data
 * @returns {Object} Mention analysis results
 */
function analyzeMentionUsage(reels) {
    try {
        if (!reels || !Array.isArray(reels) || reels.length === 0) {
            return {
                totalUniqueMentions: 0,
                mostMentionedUsers: [],
                mentionsByFrequency: {},
                averageMentionsPerReel: 0
            };
        }

        const mentionFrequency = {};
        let totalMentions = 0;

        reels.forEach(reel => {
            const mentions = reel.mentions || [];
            if (Array.isArray(mentions)) {
                totalMentions += mentions.length;
                mentions.forEach(mention => {
                    const cleanMention = mention.toLowerCase().replace('@', '');
                    mentionFrequency[cleanMention] = (mentionFrequency[cleanMention] || 0) + 1;
                });
            }
        });

        // Sort mentions by frequency
        const sortedMentions = Object.entries(mentionFrequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10); // Top 10 mentions

        const mostMentionedUsers = sortedMentions.map(([mention, count]) => ({
            username: mention,
            count,
            percentage: Math.round((count / reels.length) * 100 * 100) / 100
        }));

        const averageMentionsPerReel = reels.length > 0 ? Math.round((totalMentions / reels.length) * 100) / 100 : 0;

        return {
            totalUniqueMentions: Object.keys(mentionFrequency).length,
            mostMentionedUsers,
            mentionsByFrequency: mentionFrequency,
            averageMentionsPerReel
        };

    } catch (error) {
        console.error('Analyze mention usage error:', error);
        throw new Error(`Failed to analyze mention usage: ${error.message}`);
    } finally {
        console.log(`Mention analysis completed for ${reels ? reels.length : 0} reels`);
    }
}

module.exports = {
    analyzeHashtagUsage,
    analyzeMentionUsage
};