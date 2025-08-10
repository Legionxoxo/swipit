/**
 * @fileoverview CSV parser for Instagram URLs
 * @author Backend Team
 */

const fs = require('fs').promises;
const path = require('path');
const { parse } = require('csv-parse/sync');

/**
 * @typedef {Object} ParsedCsvRow
 * @property {string} url - Instagram post URL
 * @property {string} [tag] - Optional custom tag
 * @property {number} rowNumber - Original row number in CSV
 */

/**
 * @typedef {Object} CsvParseResult
 * @property {boolean} success - Whether parsing was successful
 * @property {Array<ParsedCsvRow>} rows - Parsed rows
 * @property {Array<string>} errors - Any parsing errors
 * @property {number} totalRows - Total number of rows processed
 * @property {number} validRows - Number of valid rows
 */

/**
 * Validate Instagram URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid Instagram URL
 */
function isValidInstagramUrl(url) {
    try {
        const urlObj = new URL(url);
        
        // Check if it's an Instagram domain
        const validDomains = ['instagram.com', 'www.instagram.com'];
        if (!validDomains.includes(urlObj.hostname)) {
            return false;
        }
        
        // Check if it's a post or reel URL
        const validPaths = /^\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?$/;
        return validPaths.test(urlObj.pathname);
        
    } catch (error) {
        return false;
    }
}

/**
 * Normalize Instagram URL
 * @param {string} url - URL to normalize
 * @returns {string} Normalized URL
 */
function normalizeInstagramUrl(url) {
    try {
        const urlObj = new URL(url);
        // Remove query parameters and trailing slashes
        return `https://www.instagram.com${urlObj.pathname}`.replace(/\/$/, '');
    } catch (error) {
        return url;
    }
}

/**
 * Parse CSV file containing Instagram URLs
 * @param {string} filePath - Path to CSV file
 * @param {Object} [options] - Parsing options
 * @param {boolean} [options.skipHeader=true] - Skip first row as header
 * @param {number} [options.maxRows=1000] - Maximum rows to process
 * @param {boolean} [options.removeDuplicates=true] - Remove duplicate URLs
 * @returns {Promise<CsvParseResult>} Parse result
 */
async function parseCsvFile(filePath, options = {}) {
    const {
        skipHeader = true,
        maxRows = 1000,
        removeDuplicates = true
    } = options;
    
    const result = {
        success: false,
        rows: [],
        errors: [],
        totalRows: 0,
        validRows: 0
    };
    
    try {
        // Read file
        const fileContent = await fs.readFile(filePath, 'utf-8');
        
        if (!fileContent || fileContent.trim().length === 0) {
            result.errors.push('CSV file is empty');
            return result;
        }
        
        // Parse CSV
        let records;
        try {
            records = parse(fileContent, {
                skip_empty_lines: true,
                trim: true,
                relax_quotes: true,
                relax_column_count: true,
                skip_records_with_empty_values: false
            });
        } catch (parseError) {
            result.errors.push(`CSV parsing error: ${parseError.message}`);
            return result;
        }
        
        // Process rows
        const startIndex = skipHeader ? 1 : 0;
        const seenUrls = new Set();
        
        for (let i = startIndex; i < records.length && result.rows.length < maxRows; i++) {
            const row = records[i];
            result.totalRows++;
            
            if (!row || row.length === 0) {
                result.errors.push(`Row ${i + 1}: Empty row`);
                continue;
            }
            
            // Extract URL and optional tag
            const url = row[0] ? row[0].trim() : '';
            const tag = row[1] ? row[1].trim() : null;
            
            if (!url) {
                result.errors.push(`Row ${i + 1}: No URL found`);
                continue;
            }
            
            // Validate URL
            if (!isValidInstagramUrl(url)) {
                result.errors.push(`Row ${i + 1}: Invalid Instagram URL: ${url}`);
                continue;
            }
            
            // Normalize URL
            const normalizedUrl = normalizeInstagramUrl(url);
            
            // Check for duplicates
            if (removeDuplicates && seenUrls.has(normalizedUrl)) {
                result.errors.push(`Row ${i + 1}: Duplicate URL: ${url}`);
                continue;
            }
            
            seenUrls.add(normalizedUrl);
            
            result.rows.push({
                url: normalizedUrl,
                tag: tag,
                rowNumber: i + 1
            });
            
            result.validRows++;
        }
        
        // Check if we hit the max rows limit
        if (records.length - startIndex > maxRows) {
            result.errors.push(`Warning: CSV contains more than ${maxRows} rows. Only first ${maxRows} rows will be processed.`);
        }
        
        result.success = result.validRows > 0;
        
        if (result.validRows === 0) {
            result.errors.push('No valid Instagram URLs found in CSV');
        }
        
    } catch (error) {
        result.errors.push(`File reading error: ${error.message}`);
    } finally {
        // Parsing completed
    }
    
    return result;
}

/**
 * Parse CSV content string
 * @param {string} content - CSV content as string
 * @param {Object} [options] - Parsing options
 * @returns {CsvParseResult} Parse result
 */
function parseCsvContent(content, options = {}) {
    const {
        skipHeader = true,
        maxRows = 1000,
        removeDuplicates = true
    } = options;
    
    const result = {
        success: false,
        rows: [],
        errors: [],
        totalRows: 0,
        validRows: 0
    };
    
    try {
        if (!content || content.trim().length === 0) {
            result.errors.push('CSV content is empty');
            return result;
        }
        
        // Parse CSV
        let records;
        try {
            records = parse(content, {
                skip_empty_lines: true,
                trim: true,
                relax_quotes: true,
                relax_column_count: true,
                skip_records_with_empty_values: false
            });
        } catch (parseError) {
            result.errors.push(`CSV parsing error: ${parseError.message}`);
            return result;
        }
        
        // Process rows
        const startIndex = skipHeader ? 1 : 0;
        const seenUrls = new Set();
        
        for (let i = startIndex; i < records.length && result.rows.length < maxRows; i++) {
            const row = records[i];
            result.totalRows++;
            
            if (!row || row.length === 0) {
                result.errors.push(`Row ${i + 1}: Empty row`);
                continue;
            }
            
            // Extract URL and optional tag
            const url = row[0] ? row[0].trim() : '';
            const tag = row[1] ? row[1].trim() : null;
            
            if (!url) {
                result.errors.push(`Row ${i + 1}: No URL found`);
                continue;
            }
            
            // Validate URL
            if (!isValidInstagramUrl(url)) {
                result.errors.push(`Row ${i + 1}: Invalid Instagram URL: ${url}`);
                continue;
            }
            
            // Normalize URL
            const normalizedUrl = normalizeInstagramUrl(url);
            
            // Check for duplicates
            if (removeDuplicates && seenUrls.has(normalizedUrl)) {
                result.errors.push(`Row ${i + 1}: Duplicate URL: ${url}`);
                continue;
            }
            
            seenUrls.add(normalizedUrl);
            
            result.rows.push({
                url: normalizedUrl,
                tag: tag,
                rowNumber: i + 1
            });
            
            result.validRows++;
        }
        
        // Check if we hit the max rows limit
        if (records.length - startIndex > maxRows) {
            result.errors.push(`Warning: CSV contains more than ${maxRows} rows. Only first ${maxRows} rows will be processed.`);
        }
        
        result.success = result.validRows > 0;
        
        if (result.validRows === 0) {
            result.errors.push('No valid Instagram URLs found in CSV');
        }
        
    } catch (error) {
        result.errors.push(`Parsing error: ${error.message}`);
    } finally {
        // Parsing completed
    }
    
    return result;
}

/**
 * Generate sample CSV content
 * @returns {string} Sample CSV content
 */
function generateSampleCsv() {
    return `url,tag
https://www.instagram.com/p/ABC123/,fashion
https://www.instagram.com/reel/DEF456/,travel
https://www.instagram.com/tv/GHI789/,food
https://www.instagram.com/p/JKL012/,lifestyle`;
}

module.exports = {
    parseCsvFile,
    parseCsvContent,
    isValidInstagramUrl,
    normalizeInstagramUrl,
    generateSampleCsv
};