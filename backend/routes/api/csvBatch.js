/**
 * @fileoverview CSV batch processing for Instagram oEmbed - immediate results
 * @author Backend Team
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { parseCsvFile, parseCsvContent } = require('../../functions/csv/csvParser');
const { processOembedRequest } = require('../../functions/route_fns/oembed');

// Configure multer for file uploads
const upload = multer({
    dest: path.join(__dirname, '../../temp/csv_uploads/'),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.csv' || file.mimetype === 'text/csv') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

// Ensure upload directory exists
const ensureUploadDir = async () => {
    const uploadDir = path.join(__dirname, '../../temp/csv_uploads/');
    try {
        await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
        console.error('Error creating upload directory:', error);
    }
};

ensureUploadDir();

/**
 * Process a single Instagram URL using the same method as single URL endpoint
 * @param {string} url - Instagram URL
 * @returns {Promise<Object>} Processed result
 */
async function processInstagramUrl(url) {
    try {
        // Use the exact same method as single URL processing
        const oembedData = await processOembedRequest(url);
        
        return {
            success: true,
            url: url,
            data: oembedData
        };
    } catch (error) {
        return {
            success: false,
            url: url,
            error: error.message
        };
    }
}

/**
 * Process multiple Instagram URLs with rate limiting
 * @param {Array<{url: string, tag: string}>} urls - URLs to process
 * @returns {Promise<Array>} Processed results
 */
async function processBatchUrls(urls) {
    const results = [];
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    for (const urlData of urls) {
        // Process URL
        const result = await processInstagramUrl(urlData.url);
        result.tag = urlData.tag;
        results.push(result);
        
        // Rate limit: wait 1 second between requests
        if (urls.indexOf(urlData) < urls.length - 1) {
            await delay(1000);
        }
    }
    
    return results;
}

/**
 * POST /api/csv-batch/process
 * Process CSV file and return Instagram profiles immediately
 */
router.post('/process', upload.single('csv'), async (req, res) => {
    let filePath = null;
    
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No CSV file uploaded'
            });
        }
        
        filePath = req.file.path;
        
        // Parse CSV file
        const parseOptions = {
            skipHeader: req.body.skipHeader !== 'false',
            maxRows: parseInt(req.body.maxRows) || 100,
            removeDuplicates: req.body.removeDuplicates !== 'false'
        };
        
        const parseResult = await parseCsvFile(filePath, parseOptions);
        
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Failed to parse CSV',
                details: parseResult.errors
            });
        }
        
        // Process URLs immediately (up to 10 for quick response)
        const urlsToProcess = parseResult.rows.slice(0, 10).map(row => ({
            url: row.url,
            tag: row.tag
        }));
        
        const results = await processBatchUrls(urlsToProcess);
        
        // Separate successful and failed results
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        // Extract unique profiles from successful results
        const profiles = {};
        successful.forEach(result => {
            if (result.data && result.data.username) {
                const username = result.data.username;
                if (!profiles[username]) {
                    profiles[username] = {
                        username: result.data.username,
                        profile_link: result.data.profile_link,
                        profile_pic_url: result.data.thumbnail_url,
                        posts: []
                    };
                }
                profiles[username].posts.push({
                    url: result.url,
                    instagram_id: result.data.instagram_id,
                    caption: result.data.caption,
                    hashtags: result.data.hashtags,
                    thumbnail_url: result.data.thumbnail_url,
                    embed_link: result.data.embed_link,
                    tag: result.tag
                });
            }
        });
        
        res.json({
            success: true,
            totalProcessed: results.length,
            successCount: successful.length,
            failedCount: failed.length,
            profiles: Object.values(profiles),
            failures: failed.map(f => ({
                url: f.url,
                error: f.error
            })),
            parseErrors: parseResult.errors.slice(0, 10)
        });
        
    } catch (error) {
        console.error('CSV batch processing error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        // Clean up uploaded file
        if (filePath) {
            try {
                await fs.unlink(filePath);
            } catch (error) {
                console.error('Error deleting temp file:', error);
            }
        }
    }
});

/**
 * POST /api/csv-batch/parse
 * Parse CSV content and process Instagram URLs
 */
router.post('/parse', express.json({ limit: '10mb' }), async (req, res) => {
    try {
        const { content, skipHeader = true, maxRows = 100 } = req.body;
        
        if (!content) {
            return res.status(400).json({
                success: false,
                error: 'No CSV content provided'
            });
        }
        
        // Parse CSV content
        const parseResult = parseCsvContent(content, {
            skipHeader,
            maxRows,
            removeDuplicates: true
        });
        
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Failed to parse CSV',
                details: parseResult.errors
            });
        }
        
        // Process URLs immediately
        const urlsToProcess = parseResult.rows.slice(0, 10).map(row => ({
            url: row.url,
            tag: row.tag
        }));
        
        const results = await processBatchUrls(urlsToProcess);
        
        // Separate and format results
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        const profiles = {};
        successful.forEach(result => {
            if (result.data && result.data.username) {
                const username = result.data.username;
                if (!profiles[username]) {
                    profiles[username] = {
                        username: result.data.username,
                        profile_link: result.data.profile_link,
                        profile_pic_url: result.data.thumbnail_url,
                        posts: []
                    };
                }
                profiles[username].posts.push({
                    url: result.url,
                    instagram_id: result.data.instagram_id,
                    caption: result.data.caption,
                    hashtags: result.data.hashtags,
                    thumbnail_url: result.data.thumbnail_url,
                    embed_link: result.data.embed_link,
                    tag: result.tag
                });
            }
        });
        
        res.json({
            success: true,
            totalProcessed: results.length,
            successCount: successful.length,
            failedCount: failed.length,
            profiles: Object.values(profiles),
            failures: failed,
            parseErrors: parseResult.errors.slice(0, 10)
        });
        
    } catch (error) {
        console.error('CSV parse error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;