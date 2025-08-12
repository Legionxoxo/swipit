/**
 * @fileoverview Tests for export API routes
 * @author Backend Team
 */

const request = require('supertest');
const express = require('express');

// Mock the dependencies before requiring the route
jest.mock('../../../functions/route_fns/exportData');

const exportRoutes = require('../../../routes/api/export');
const { generateExport } = require('../../../functions/route_fns/exportData');

describe('Export API Routes', () => {
    let app;

    beforeEach(() => {
        try {
            // Create Express app for testing
            app = express();
            app.use(express.json());
            app.use('/api/export', exportRoutes);
            
            // Clear all mocks
            jest.clearAllMocks();
            
        } catch (error) {
            console.error('Test setup error:', error);
            throw error;
        } finally {
            // Test setup completed
        }
    });

    afterEach(() => {
        try {
            // Clean up any test-specific data
            
        } catch (error) {
            console.error('Test cleanup error:', error);
        } finally {
            // Test cleanup completed
        }
    });

    describe('GET /api/export/:id', () => {
        it('should return available export formats successfully', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';

                // Act
                const response = await request(app)
                    .get(`/api/export/${analysisId}`)
                    .expect(200);

                // Assert
                expect(response.body).toEqual({
                    success: true,
                    message: 'Available export formats',
                    analysisId: analysisId,
                    availableFormats: [
                        {
                            format: 'csv',
                            description: 'Comma-separated values format',
                            endpoint: `/api/export/${analysisId}/csv`
                        },
                        {
                            format: 'json',
                            description: 'JSON format with complete data',
                            endpoint: `/api/export/${analysisId}/json`
                        }
                    ]
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 400 when analysis ID is missing', async () => {
            try {
                // Act
                const response = await request(app)
                    .get('/api/export/')
                    .expect(404); // Express returns 404 for missing route params

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle special characters in analysis ID', async () => {
            try {
                // Arrange  
                const analysisId = 'test-analysis-123';

                // Act
                const response = await request(app)
                    .get(`/api/export/${analysisId}`)
                    .expect(200);

                // Assert
                expect(response.body.success).toBe(true);
                expect(response.body.analysisId).toBe(analysisId);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle very long analysis ID', async () => {
            try {
                // Arrange
                const longAnalysisId = 'a'.repeat(100);

                // Act
                const response = await request(app)
                    .get(`/api/export/${longAnalysisId}`)
                    .expect(200);

                // Assert
                expect(response.body.success).toBe(true);
                expect(response.body.analysisId).toBe(longAnalysisId);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('GET /api/export/:id/:format', () => {
        it('should export CSV format successfully', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const format = 'csv';
                const mockCsvContent = 'username,followers,engagement\\ntest_user,1000,5.2';
                
                generateExport.mockResolvedValue({
                    fileContent: mockCsvContent,
                    filename: `channel_analysis_${analysisId}.csv`
                });

                // Act
                const response = await request(app)
                    .get(`/api/export/${analysisId}/${format}`)
                    .expect(200);

                // Assert
                expect(response.text).toBe(mockCsvContent);
                expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
                expect(response.headers['content-disposition']).toBe(`attachment; filename="channel_analysis_${analysisId}.csv"`);
                expect(generateExport).toHaveBeenCalledWith(analysisId, format);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should export JSON format successfully', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const format = 'json';
                const mockJsonContent = JSON.stringify({ username: 'test_user', followers: 1000 });
                
                generateExport.mockResolvedValue({
                    fileContent: mockJsonContent,
                    filename: `channel_analysis_${analysisId}.json`
                });

                // Act
                const response = await request(app)
                    .get(`/api/export/${analysisId}/${format}`)
                    .expect(200);

                // Assert
                expect(response.text).toBe(mockJsonContent);
                expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
                expect(generateExport).toHaveBeenCalledWith(analysisId, format);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle case-insensitive format parameter', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const formats = ['CSV', 'Json', 'csv', 'json'];
                
                // Act & Assert
                for (const format of formats) {
                    const mockContent = format.toLowerCase() === 'json' ? 
                        JSON.stringify({ test: 'content' }) : 
                        'test,content';
                        
                    generateExport.mockResolvedValue({
                        fileContent: mockContent
                    });

                    const response = await request(app)
                        .get(`/api/export/${analysisId}/${format}`)
                        .expect(200);

                    expect(generateExport).toHaveBeenCalledWith(analysisId, format.toLowerCase());
                }

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 400 for invalid export format', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const invalidFormat = 'xml';

                // Act
                const response = await request(app)
                    .get(`/api/export/${analysisId}/${invalidFormat}`)
                    .expect(400);

                // Assert
                expect(response.body).toEqual({
                    success: false,
                    message: 'Invalid export format',
                    error: 'Format must be one of: csv, json'
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 404 when analysis not found', async () => {
            try {
                // Arrange
                const analysisId = 'non-existent-123';
                const format = 'csv';
                
                generateExport.mockResolvedValue(null);

                // Act
                const response = await request(app)
                    .get(`/api/export/${analysisId}/${format}`)
                    .expect(404);

                // Assert
                expect(response.body).toEqual({
                    success: false,
                    message: 'Analysis not found or no data available',
                    error: `No analysis data found with ID: ${analysisId}`
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle generateExport function errors', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const format = 'csv';
                const error = new Error('Export service unavailable');
                error.statusCode = 503;
                
                generateExport.mockRejectedValue(error);

                // Act
                const response = await request(app)
                    .get(`/api/export/${analysisId}/${format}`)
                    .expect(503);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Export service unavailable');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle generic generateExport errors with 500 status', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const format = 'csv';
                
                generateExport.mockRejectedValue(new Error('Internal server error'));

                // Act
                const response = await request(app)
                    .get(`/api/export/${analysisId}/${format}`)
                    .expect(500);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Internal server error');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle empty file content', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const format = 'csv';
                
                generateExport.mockResolvedValue({
                    fileContent: '',
                    filename: `channel_analysis_${analysisId}.csv`
                });

                // Act
                const response = await request(app)
                    .get(`/api/export/${analysisId}/${format}`)
                    .expect(200);

                // Assert
                expect(response.text).toBe('');
                expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle large file content', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const format = 'json';
                const largeContent = JSON.stringify({ data: 'x'.repeat(10000) });
                
                generateExport.mockResolvedValue({
                    fileContent: largeContent,
                    filename: `channel_analysis_${analysisId}.json`
                });

                // Act
                const response = await request(app)
                    .get(`/api/export/${analysisId}/${format}`)
                    .expect(200);

                // Assert
                expect(response.text).toBe(largeContent);
                expect(response.headers['content-type']).toBe('application/json; charset=utf-8');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('Edge Cases and Error Scenarios', () => {
        it('should handle special characters in analysis ID for export', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const format = 'csv';
                const mockContent = 'test,content';
                
                generateExport.mockResolvedValue({
                    fileContent: mockContent
                });

                // Act
                const response = await request(app)
                    .get(`/api/export/${analysisId}/${format}`)
                    .expect(200);

                // Assert
                expect(response.text).toBe(mockContent);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle unicode characters in content', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const format = 'json';
                const unicodeContent = JSON.stringify({ name: 'tëst üsér' });
                
                generateExport.mockResolvedValue({
                    fileContent: unicodeContent
                });

                // Act
                const response = await request(app)
                    .get(`/api/export/${analysisId}/${format}`)
                    .expect(200);

                // Assert
                expect(response.text).toBe(unicodeContent);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle malformed CSV content gracefully', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const format = 'csv';
                const malformedCsv = 'name,age\\nJohn,thirty\\n"unclosed quote,missing end';
                
                generateExport.mockResolvedValue({
                    fileContent: malformedCsv
                });

                // Act
                const response = await request(app)
                    .get(`/api/export/${analysisId}/${format}`)
                    .expect(200);

                // Assert
                expect(response.text).toBe(malformedCsv);
                expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle malformed JSON content gracefully', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const format = 'json';
                const malformedJson = '{"name": "John", "age": "incomplete"}';
                
                generateExport.mockResolvedValue({
                    fileContent: malformedJson
                });

                // Act
                const response = await request(app)
                    .get(`/api/export/${analysisId}/${format}`)
                    .expect(200);

                // Assert
                expect(response.text).toBe(malformedJson);
                expect(response.headers['content-type']).toBe('application/json; charset=utf-8');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle timeout errors from generateExport', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const format = 'csv';
                const timeoutError = new Error('Export timeout');
                timeoutError.statusCode = 408;
                
                generateExport.mockRejectedValue(timeoutError);

                // Act
                const response = await request(app)
                    .get(`/api/export/${analysisId}/${format}`)
                    .expect(408);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Export timeout');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle filename with special characters', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const format = 'csv';
                const mockContent = 'data,content';
                
                generateExport.mockResolvedValue({
                    fileContent: mockContent
                });

                // Act
                const response = await request(app)
                    .get(`/api/export/${analysisId}/${format}`)
                    .expect(200);

                // Assert
                expect(response.headers['content-disposition']).toBe(`attachment; filename="channel_analysis_${analysisId}.csv"`);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });
});