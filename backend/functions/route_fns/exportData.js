/**
 * @fileoverview Export data route functions
 * @author Backend Team
 */

const { getAnalysisStatus } = require('./analyzeChannel');

/**
 * @typedef {Object} ExportResult
 * @property {string} fileContent - Generated file content
 * @property {string} filename - Suggested filename
 * @property {string} contentType - MIME content type
 */

/**
 * Generate export file for analysis results
 * @param {string} analysisId - Analysis ID
 * @param {string} format - Export format (csv or json)
 * @returns {Promise<ExportResult|null>} Export result
 */
async function generateExport(analysisId, format) {
    try {
        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        if (!format) {
            throw new Error('Export format is required');
        }

        // Get analysis data
        const analysisData = await getAnalysisStatus(analysisId);
        
        if (!analysisData || analysisData.status !== 'completed') {
            return null;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `channel_analysis_${analysisId}_${timestamp}`;

        switch (format.toLowerCase()) {
            case 'csv':
                return {
                    fileContent: generateCsvExport(analysisData),
                    filename: `${filename}.csv`,
                    contentType: 'text/csv'
                };
            
            case 'json':
                return {
                    fileContent: generateJsonExport(analysisData),
                    filename: `${filename}.json`,
                    contentType: 'application/json'
                };
            
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }

    } catch (error) {
        console.error('Generate export error:', error);
        throw new Error(`Failed to generate export: ${error.message}`);
    } finally {
        console.log(`Export generated for analysis: ${analysisId}, format: ${format}`);
    }
}

/**
 * Generate CSV export content
 * @param {Object} analysisData - Analysis data
 * @returns {string} CSV content
 */
function generateCsvExport(analysisData) {
    try {
        const { data, channelInfo } = analysisData;
        
        if (!data || !Array.isArray(data)) {
            throw new Error('Invalid analysis data for CSV export');
        }

        // CSV headers
        const headers = [
            'Video ID',
            'Title',
            'Upload Date',
            'Duration',
            'View Count',
            'Like Count', 
            'Comment Count',
            'Category ID',
            'Video URL',
            'Thumbnail URL'
        ];

        // Build CSV content
        let csvContent = headers.join(',') + '\n';

        // Add channel info as comment
        if (channelInfo) {
            csvContent = `# Channel Analysis Report\n`;
            csvContent += `# Channel: ${escapeCSVField(channelInfo.channelName)}\n`;
            csvContent += `# Channel ID: ${channelInfo.channelId}\n`;
            csvContent += `# Total Videos: ${data.length}\n`;
            csvContent += `# Generated: ${new Date().toISOString()}\n`;
            csvContent += `#\n`;
            csvContent += headers.join(',') + '\n';
        }

        // Add video data rows
        data.forEach(video => {
            const row = [
                escapeCSVField(video.id),
                escapeCSVField(video.title),
                escapeCSVField(video.uploadDate),
                escapeCSVField(video.duration),
                video.viewCount || 0,
                video.likeCount || 0,
                video.commentCount || 0,
                escapeCSVField(video.categoryId),
                `https://youtube.com/watch?v=${video.id}`,
                escapeCSVField(video.thumbnailUrl)
            ];
            
            csvContent += row.join(',') + '\n';
        });

        return csvContent;

    } catch (error) {
        console.error('Generate CSV export error:', error);
        throw new Error(`Failed to generate CSV: ${error.message}`);
    } finally {
        console.log('CSV export content generated successfully');
    }
}

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

/**
 * Escape CSV field content
 * @param {string} field - Field content
 * @returns {string} Escaped field content
 */
function escapeCSVField(field) {
    try {
        if (field === null || field === undefined) {
            return '';
        }
        
        const fieldStr = String(field);
        
        // If field contains comma, newline, or quote, wrap in quotes and escape quotes
        if (fieldStr.includes(',') || fieldStr.includes('\n') || fieldStr.includes('"')) {
            return `"${fieldStr.replace(/"/g, '""')}"`;
        }
        
        return fieldStr;

    } catch (error) {
        console.error('Escape CSV field error:', error);
        return '';
    }
}

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
    }
}

module.exports = {
    generateExport,
    generateCsvExport,
    generateJsonExport,
    escapeCSVField,
    calculateTotalViews,
    calculateAverageViews,
    findMostViewedVideo
};