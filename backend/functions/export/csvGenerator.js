/**
 * @fileoverview CSV export generation utilities
 * @author Backend Team
 */

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
                escapeCSVField(video.videoUrl || `https://youtube.com/watch?v=${video.id}`),
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
    } finally {
        console.log('CSV field escaped successfully');
    }
}

module.exports = {
    generateCsvExport,
    escapeCSVField
};