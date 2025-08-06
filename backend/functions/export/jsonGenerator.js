/**
 * @fileoverview JSON export generation utilities
 * @author Backend Team
 */

const { calculateTotalViews, calculateAverageViews, findMostViewedVideo } = require('./statisticsCalculator');

/**
 * Generate JSON export content
 * @param {Object} analysisData - Analysis data
 * @returns {string} JSON content
 */
function generateJsonExport(analysisData) {
    try {
        const exportData = {
            metadata: {
                analysisId: analysisData.analysisId,
                generatedAt: new Date().toISOString(),
                version: '1.0.0',
                totalVideos: analysisData.totalVideos || 0,
                processingTime: analysisData.processingTime
            },
            channelInfo: analysisData.channelInfo,
            summary: {
                videoSegments: analysisData.videoSegments ? {
                    low: analysisData.videoSegments.low?.length || 0,
                    medium: analysisData.videoSegments.medium?.length || 0,
                    high: analysisData.videoSegments.high?.length || 0,
                    veryHigh: analysisData.videoSegments.veryHigh?.length || 0,
                    viral: analysisData.videoSegments.viral?.length || 0
                } : null,
                totalViewCount: calculateTotalViews(analysisData.data),
                averageViews: calculateAverageViews(analysisData.data),
                mostViewedVideo: findMostViewedVideo(analysisData.data)
            },
            videoSegments: analysisData.videoSegments,
            videos: analysisData.data?.map(video => ({
                ...video,
                videoUrl: `https://youtube.com/watch?v=${video.id}`
            })) || []
        };

        return JSON.stringify(exportData, null, 2);

    } catch (error) {
        console.error('Generate JSON export error:', error);
        throw new Error(`Failed to generate JSON: ${error.message}`);
    } finally {
        console.log('JSON export content generated successfully');
    }
}

module.exports = {
    generateJsonExport
};