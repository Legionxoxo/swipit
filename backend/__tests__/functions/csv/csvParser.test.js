/**
 * @fileoverview Tests for CSV parser functionality
 * @author Backend Team
 */

const fs = require('fs').promises;
const path = require('path');
const { 
    parseCsvFile, 
    parseCsvContent, 
    isValidInstagramUrl, 
    normalizeInstagramUrl, 
    generateSampleCsv 
} = require('../../../functions/csv/csvParser');

describe('CSV Parser', () => {
    const testTempDir = path.join(__dirname, 'temp');
    
    beforeEach(async () => {
        try {
            // Create temp directory for test files
            await fs.mkdir(testTempDir, { recursive: true });
            
            // Clear all mocks
            jest.clearAllMocks();
            
        } catch (error) {
            console.error('Test setup error:', error);
            throw error;
        } finally {
            // Test setup completed
        }
    });

    afterEach(async () => {
        try {
            // Clean up test files
            try {
                const files = await fs.readdir(testTempDir);
                await Promise.all(files.map(file => 
                    fs.unlink(path.join(testTempDir, file))
                ));
                await fs.rmdir(testTempDir);
            } catch (error) {
                // Directory doesn't exist, that's fine
            }
            
        } catch (error) {
            console.error('Test cleanup error:', error);
        } finally {
            // Test cleanup completed
        }
    });

    describe('isValidInstagramUrl', () => {
        it('should validate correct Instagram post URLs', () => {
            try {
                const validUrls = [
                    'https://www.instagram.com/p/ABC123/',
                    'https://www.instagram.com/p/ABC123',
                    'https://instagram.com/p/DEF456/',
                    'http://www.instagram.com/p/GHI789/',
                    'https://www.instagram.com/reel/JKL012/',
                    'https://www.instagram.com/tv/MNO345/',
                    'https://instagram.com/reel/PQR678',
                    'https://www.instagram.com/p/test_123-ABC/',
                    'https://www.instagram.com/reel/a1B2c3D4e5F6g7H8/'
                ];

                for (const url of validUrls) {
                    expect(isValidInstagramUrl(url)).toBe(true);
                }

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should reject invalid Instagram URLs', () => {
            try {
                const invalidUrls = [
                    // Wrong domain
                    'https://twitter.com/p/ABC123/',
                    'https://facebook.com/p/ABC123/',
                    'https://youtube.com/p/ABC123/',
                    
                    // Wrong path pattern
                    'https://www.instagram.com/username/',
                    'https://www.instagram.com/',
                    'https://www.instagram.com/stories/username/',
                    'https://www.instagram.com/explore/',
                    
                    // Invalid characters in shortcode
                    'https://www.instagram.com/p/ABC@123/',
                    'https://www.instagram.com/p/ABC#123/',
                    'https://www.instagram.com/p/ABC 123/',
                    
                    // Malformed URLs
                    'not-a-url',
                    'https://google.com',
                    'instagram.com/p/ABC123', // Missing protocol
                    'ftp://www.instagram.com/p/ABC123/',
                    
                    // Empty or null
                    '',
                    null,
                    undefined
                ];

                for (const url of invalidUrls) {
                    expect(isValidInstagramUrl(url)).toBe(false);
                }

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle malformed URLs gracefully', () => {
            try {
                const malformedUrls = [
                    'https://[invalid-url]',
                    'https://www.instagram.com/p/',
                    'https://www.instagram.com/p//',
                    'https://www.instagram.com//p/ABC123/',
                    'https://www.instagram.com/p/ABC123/extra/path/',
                    'javascript:alert("xss")',
                    'data:text/html,<script>alert("xss")</script>'
                ];

                for (const url of malformedUrls) {
                    expect(() => isValidInstagramUrl(url)).not.toThrow();
                    expect(isValidInstagramUrl(url)).toBe(false);
                }

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('normalizeInstagramUrl', () => {
        it('should normalize Instagram URLs correctly', () => {
            try {
                const testCases = [
                    {
                        input: 'https://www.instagram.com/p/ABC123/?utm_source=test',
                        expected: 'https://www.instagram.com/p/ABC123'
                    },
                    {
                        input: 'https://www.instagram.com/reel/DEF456/',
                        expected: 'https://www.instagram.com/reel/DEF456'
                    },
                    {
                        input: 'https://instagram.com/p/GHI789/?hl=en',
                        expected: 'https://www.instagram.com/p/GHI789'
                    },
                    {
                        input: 'http://www.instagram.com/tv/JKL012/?taken-by=user',
                        expected: 'https://www.instagram.com/tv/JKL012'
                    },
                    {
                        input: 'https://www.instagram.com/p/MNO345/?igshid=123',
                        expected: 'https://www.instagram.com/p/MNO345'
                    }
                ];

                for (const testCase of testCases) {
                    const result = normalizeInstagramUrl(testCase.input);
                    expect(result).toBe(testCase.expected);
                }

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return original URL for malformed input', () => {
            try {
                const malformedUrls = [
                    'not-a-url',
                    'https://[invalid-host]',
                    'javascript:alert(1)',
                    ''
                ];

                for (const url of malformedUrls) {
                    expect(normalizeInstagramUrl(url)).toBe(url);
                }

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('parseCsvContent', () => {
        it('should parse valid CSV content successfully', () => {
            try {
                const csvContent = `url,tag
https://www.instagram.com/p/ABC123/,fashion
https://www.instagram.com/reel/DEF456/,travel
https://www.instagram.com/tv/GHI789/,food`;

                const result = parseCsvContent(csvContent);

                expect(result.success).toBe(true);
                expect(result.validRows).toBe(3);
                expect(result.totalRows).toBe(3);
                expect(result.errors).toHaveLength(0);
                expect(result.rows).toHaveLength(3);

                expect(result.rows[0]).toEqual({
                    url: 'https://www.instagram.com/p/ABC123',
                    tag: 'fashion',
                    rowNumber: 2
                });

                expect(result.rows[1]).toEqual({
                    url: 'https://www.instagram.com/reel/DEF456',
                    tag: 'travel',
                    rowNumber: 3
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle CSV without headers', () => {
            try {
                const csvContent = `https://www.instagram.com/p/ABC123/,fashion
https://www.instagram.com/reel/DEF456/,travel`;

                const result = parseCsvContent(csvContent, { skipHeader: false });

                expect(result.success).toBe(true);
                expect(result.validRows).toBe(2);
                expect(result.rows[0].rowNumber).toBe(1);
                expect(result.rows[1].rowNumber).toBe(2);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should remove duplicate URLs when removeDuplicates is true', () => {
            try {
                const csvContent = `url,tag
https://www.instagram.com/p/ABC123/,fashion
https://www.instagram.com/p/ABC123,fashion
https://www.instagram.com/reel/DEF456/,travel`;

                const result = parseCsvContent(csvContent, { removeDuplicates: true });

                expect(result.success).toBe(true);
                expect(result.validRows).toBe(2);
                expect(result.errors).toContain('Row 3: Duplicate URL: https://www.instagram.com/p/ABC123');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should allow duplicate URLs when removeDuplicates is false', () => {
            try {
                const csvContent = `url,tag
https://www.instagram.com/p/ABC123/,fashion
https://www.instagram.com/p/ABC123,fashion`;

                const result = parseCsvContent(csvContent, { removeDuplicates: false });

                expect(result.success).toBe(true);
                expect(result.validRows).toBe(2);
                expect(result.errors).not.toContain(expect.stringContaining('Duplicate URL'));

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should respect maxRows limit', () => {
            try {
                const csvContent = `url,tag
https://www.instagram.com/p/ABC123/,fashion
https://www.instagram.com/reel/DEF456/,travel
https://www.instagram.com/tv/GHI789/,food
https://www.instagram.com/p/JKL012/,lifestyle`;

                const result = parseCsvContent(csvContent, { maxRows: 2 });

                expect(result.success).toBe(true);
                expect(result.validRows).toBe(2);
                expect(result.rows).toHaveLength(2);
                expect(result.errors).toContain(expect.stringContaining('more than 2 rows'));

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle invalid URLs and continue processing', () => {
            try {
                const csvContent = `url,tag
https://www.instagram.com/p/ABC123/,fashion
https://twitter.com/status/123,invalid
https://www.instagram.com/reel/DEF456/,travel
not-a-url,invalid
https://www.instagram.com/tv/GHI789/,food`;

                const result = parseCsvContent(csvContent);

                expect(result.success).toBe(true);
                expect(result.validRows).toBe(3);
                expect(result.totalRows).toBe(5);
                expect(result.errors).toHaveLength(2);
                expect(result.errors).toContain('Row 3: Invalid Instagram URL: https://twitter.com/status/123');
                expect(result.errors).toContain('Row 5: Invalid Instagram URL: not-a-url');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle empty rows gracefully', () => {
            try {
                const csvContent = `url,tag
https://www.instagram.com/p/ABC123/,fashion

https://www.instagram.com/reel/DEF456/,travel
,
https://www.instagram.com/tv/GHI789/,food`;

                const result = parseCsvContent(csvContent);

                expect(result.success).toBe(true);
                expect(result.validRows).toBe(3);
                expect(result.errors).toContain('Row 5: No URL found');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle CSV with only URLs (no tags)', () => {
            try {
                const csvContent = `url
https://www.instagram.com/p/ABC123/
https://www.instagram.com/reel/DEF456/`;

                const result = parseCsvContent(csvContent);

                expect(result.success).toBe(true);
                expect(result.validRows).toBe(2);
                expect(result.rows[0].tag).toBeNull();
                expect(result.rows[1].tag).toBeNull();

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return error for empty content', () => {
            try {
                const result = parseCsvContent('');

                expect(result.success).toBe(false);
                expect(result.validRows).toBe(0);
                expect(result.errors).toContain('CSV content is empty');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return error for content with no valid URLs', () => {
            try {
                const csvContent = `url,tag
https://twitter.com/status/123,invalid
not-a-url,invalid`;

                const result = parseCsvContent(csvContent);

                expect(result.success).toBe(false);
                expect(result.validRows).toBe(0);
                expect(result.errors).toContain('No valid Instagram URLs found in CSV');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle malformed CSV gracefully', () => {
            try {
                const malformedCsv = `url,tag
"unclosed quote,value
https://www.instagram.com/p/ABC123/,fashion`;

                const result = parseCsvContent(malformedCsv);

                // Should still process what it can
                expect(result.validRows).toBeGreaterThanOrEqual(0);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('parseCsvFile', () => {
        it('should parse CSV file successfully', async () => {
            try {
                // Create test CSV file
                const csvContent = `url,tag
https://www.instagram.com/p/ABC123/,fashion
https://www.instagram.com/reel/DEF456/,travel`;
                
                const testFilePath = path.join(testTempDir, 'test.csv');
                await fs.writeFile(testFilePath, csvContent);

                // Parse file
                const result = await parseCsvFile(testFilePath);

                expect(result.success).toBe(true);
                expect(result.validRows).toBe(2);
                expect(result.rows).toHaveLength(2);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle non-existent file', async () => {
            try {
                const result = await parseCsvFile('/path/to/nonexistent/file.csv');

                expect(result.success).toBe(false);
                expect(result.validRows).toBe(0);
                expect(result.errors).toContain(expect.stringContaining('File reading error'));

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle empty file', async () => {
            try {
                // Create empty file
                const testFilePath = path.join(testTempDir, 'empty.csv');
                await fs.writeFile(testFilePath, '');

                const result = await parseCsvFile(testFilePath);

                expect(result.success).toBe(false);
                expect(result.validRows).toBe(0);
                expect(result.errors).toContain('CSV file is empty');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle large CSV files with maxRows limit', async () => {
            try {
                // Generate large CSV content
                let csvContent = 'url,tag\n';
                for (let i = 1; i <= 100; i++) {
                    csvContent += `https://www.instagram.com/p/ABC${i.toString().padStart(3, '0')}/,tag${i}\n`;
                }

                const testFilePath = path.join(testTempDir, 'large.csv');
                await fs.writeFile(testFilePath, csvContent);

                const result = await parseCsvFile(testFilePath, { maxRows: 50 });

                expect(result.success).toBe(true);
                expect(result.validRows).toBe(50);
                expect(result.rows).toHaveLength(50);
                expect(result.errors).toContain(expect.stringContaining('more than 50 rows'));

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle files with different encodings', async () => {
            try {
                // Create file with special characters
                const csvContent = `url,tag
https://www.instagram.com/p/ABC123/,fashión
https://www.instagram.com/reel/DEF456/,trävél`;
                
                const testFilePath = path.join(testTempDir, 'unicode.csv');
                await fs.writeFile(testFilePath, csvContent, 'utf-8');

                const result = await parseCsvFile(testFilePath);

                expect(result.success).toBe(true);
                expect(result.validRows).toBe(2);
                expect(result.rows[0].tag).toBe('fashión');
                expect(result.rows[1].tag).toBe('trävél');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('generateSampleCsv', () => {
        it('should generate valid sample CSV content', () => {
            try {
                const sampleCsv = generateSampleCsv();

                expect(typeof sampleCsv).toBe('string');
                expect(sampleCsv).toContain('url,tag');
                expect(sampleCsv).toContain('instagram.com');

                // Test that generated sample is valid
                const result = parseCsvContent(sampleCsv);
                expect(result.success).toBe(true);
                expect(result.validRows).toBeGreaterThan(0);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('Edge Cases and Error Scenarios', () => {
        it('should handle very long URLs', () => {
            try {
                const longShortcode = 'a'.repeat(100);
                const longUrl = `https://www.instagram.com/p/${longShortcode}/`;
                
                const csvContent = `url,tag\n${longUrl},test`;
                const result = parseCsvContent(csvContent);

                // Should still validate the URL structure
                expect(result.validRows).toBe(1);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle URLs with special characters in shortcodes', () => {
            try {
                const csvContent = `url,tag
https://www.instagram.com/p/ABC-123_456/,test
https://www.instagram.com/reel/DEF_789-012/,test2`;

                const result = parseCsvContent(csvContent);

                expect(result.success).toBe(true);
                expect(result.validRows).toBe(2);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle CSV with quoted fields containing commas', () => {
            try {
                const csvContent = `url,tag
"https://www.instagram.com/p/ABC123/","fashion, lifestyle"
https://www.instagram.com/reel/DEF456/,travel`;

                const result = parseCsvContent(csvContent);

                expect(result.success).toBe(true);
                expect(result.validRows).toBe(2);
                expect(result.rows[0].tag).toBe('fashion, lifestyle');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle CSV with mixed line endings', () => {
            try {
                const csvContent = 'url,tag\r\nhttps://www.instagram.com/p/ABC123/,fashion\nhttps://www.instagram.com/reel/DEF456/,travel\r\n';

                const result = parseCsvContent(csvContent);

                expect(result.success).toBe(true);
                expect(result.validRows).toBe(2);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle extremely large tags', () => {
            try {
                const largeTag = 'x'.repeat(10000);
                const csvContent = `url,tag
https://www.instagram.com/p/ABC123/,${largeTag}`;

                const result = parseCsvContent(csvContent);

                expect(result.success).toBe(true);
                expect(result.validRows).toBe(1);
                expect(result.rows[0].tag).toBe(largeTag);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle null and undefined parameters gracefully', () => {
            try {
                // Test with null content
                expect(() => parseCsvContent(null)).not.toThrow();
                expect(parseCsvContent(null).success).toBe(false);

                // Test with undefined content
                expect(() => parseCsvContent(undefined)).not.toThrow();
                expect(parseCsvContent(undefined).success).toBe(false);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle concurrent parsing operations', async () => {
            try {
                const csvContent = `url,tag
https://www.instagram.com/p/ABC123/,fashion
https://www.instagram.com/reel/DEF456/,travel`;

                // Run multiple parsing operations concurrently
                const promises = Array(10).fill().map(() => 
                    parseCsvContent(csvContent)
                );

                const results = await Promise.all(promises);

                // All should succeed with same results
                results.forEach(result => {
                    expect(result.success).toBe(true);
                    expect(result.validRows).toBe(2);
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });
});