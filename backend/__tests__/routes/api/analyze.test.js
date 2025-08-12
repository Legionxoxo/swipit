/**
 * @fileoverview Tests for analyze API routes
 * @author Backend Team
 */

const request = require('supertest');
const express = require('express');

// Mock the dependencies before requiring the route
jest.mock('../../../functions/route_fns/analyzeChannel');

const analyzeRoutes = require('../../../routes/api/analyze');
const { startAnalysis, getAnalysisStatus } = require('../../../functions/route_fns/analyzeChannel');

describe('Analyze API Routes', () => {
    let app;

    beforeEach(() => {
        try {
            // Create Express app for testing
            app = express();
            app.use(express.json());
            app.use('/api/analyze', analyzeRoutes);
            
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

    describe('POST /api/analyze', () => {
        it('should start analysis successfully with valid YouTube channel URL', async () => {
            try {
                // Arrange
                const channelUrl = 'https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw';
                const mockAnalysisResult = {
                    analysisId: 'analysis_me884ao9_yf8g1pnci',
                    estimatedTime: '2-10 minutes depending on channel size'
                };
                
                startAnalysis.mockResolvedValue(mockAnalysisResult);

                // Act
                const response = await request(app)
                    .post('/api/analyze')
                    .send({ channelUrl })
                    .expect(202);

                // Assert
                expect(response.body).toEqual({
                    success: true,
                    message: 'Analysis started successfully',
                    analysisId: 'analysis_me884ao9_yf8g1pnci',
                    status: 'processing',
                    progress: 0,
                    estimatedTime: '2-10 minutes depending on channel size'
                });
                
                expect(startAnalysis).toHaveBeenCalledWith(channelUrl);
                expect(startAnalysis).toHaveBeenCalledTimes(1);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should accept various YouTube URL formats', async () => {
            try {
                // Arrange
                const validUrls = [
                    'https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw',
                    'https://youtube.com/c/GoogleDevelopers',
                    'https://www.youtube.com/user/GoogleDevelopers',
                    'https://www.youtube.com/@googledevelopers'
                ];
                
                const mockAnalysisResult = {
                    analysisId: 'test-analysis-id',
                    estimatedTime: '2-10 minutes depending on channel size'
                };
                
                startAnalysis.mockResolvedValue(mockAnalysisResult);

                // Act & Assert
                for (const channelUrl of validUrls) {
                    const response = await request(app)
                        .post('/api/analyze')
                        .send({ channelUrl })
                        .expect(202);

                    expect(response.body.success).toBe(true);
                    expect(startAnalysis).toHaveBeenCalledWith(channelUrl);
                }

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 400 when channelUrl is missing', async () => {
            try {
                // Act
                const response = await request(app)
                    .post('/api/analyze')
                    .send({})
                    .expect(400);

                // Assert
                expect(response.body).toEqual({
                    success: false,
                    message: 'Channel URL is required',
                    error: 'Missing channelUrl in request body'
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 400 when channelUrl is empty string', async () => {
            try {
                // Act
                const response = await request(app)
                    .post('/api/analyze')
                    .send({ channelUrl: '' })
                    .expect(400);

                // Assert
                expect(response.body).toEqual({
                    success: false,
                    message: 'Channel URL is required',
                    error: 'Missing channelUrl in request body'
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 400 for invalid YouTube URL format', async () => {
            try {
                // Arrange
                const invalidUrl = 'https://example.com/not-youtube';

                // Act
                const response = await request(app)
                    .post('/api/analyze')
                    .send({ channelUrl: invalidUrl })
                    .expect(400);

                // Assert
                expect(response.body).toEqual({
                    success: false,
                    message: 'Invalid YouTube channel URL format',
                    error: 'URL must be a valid YouTube channel URL'
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle startAnalysis function errors', async () => {
            try {
                // Arrange
                const channelUrl = 'https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw';
                const error = new Error('Service temporarily unavailable');
                error.statusCode = 503;
                
                startAnalysis.mockRejectedValue(error);

                // Act
                const response = await request(app)
                    .post('/api/analyze')
                    .send({ channelUrl })
                    .expect(503);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Service temporarily unavailable');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle generic errors with 500 status', async () => {
            try {
                // Arrange
                const channelUrl = 'https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw';
                
                startAnalysis.mockRejectedValue(new Error('Internal server error'));

                // Act
                const response = await request(app)
                    .post('/api/analyze')
                    .send({ channelUrl })
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
    });

    describe('GET /api/analyze/:id', () => {
        it('should return analysis status successfully', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const mockAnalysisData = {
                    status: 'completed',
                    progress: 100,
                    data: [
                        { id: 'video1', title: 'Test Video 1', viewCount: 1000 },
                        { id: 'video2', title: 'Test Video 2', viewCount: 2000 }
                    ],
                    channelInfo: { name: 'Test Channel', subscriberCount: 50000 },
                    videoSegments: { high: [], medium: [], low: [] },
                    pagination: { page: 1, limit: 50, total: 2, hasMore: false },
                    processingTime: 45
                };

                getAnalysisStatus.mockResolvedValue(mockAnalysisData);

                // Act
                const response = await request(app)
                    .get(`/api/analyze/${analysisId}`)
                    .expect(200);

                // Assert
                expect(response.body.success).toBe(true);
                expect(response.body.analysisId).toBe(analysisId);
                expect(response.body.status).toBe('completed');
                expect(response.body.data).toEqual(mockAnalysisData.data);
                expect(getAnalysisStatus).toHaveBeenCalledWith(analysisId, 1, 50);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle pagination parameters correctly', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const mockAnalysisData = {
                    status: 'completed',
                    progress: 100,
                    data: [],
                    pagination: { page: 2, limit: 25, total: 100, hasMore: true }
                };

                getAnalysisStatus.mockResolvedValue(mockAnalysisData);

                // Act
                const response = await request(app)
                    .get(`/api/analyze/${analysisId}?page=2&limit=25`)
                    .expect(200);

                // Assert
                expect(response.body.success).toBe(true);
                expect(getAnalysisStatus).toHaveBeenCalledWith(analysisId, 2, 25);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 400 for invalid page number', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';

                // Act
                const response = await request(app)
                    .get(`/api/analyze/${analysisId}?page=0`)
                    .expect(400);

                // Assert
                expect(response.body).toEqual({
                    success: false,
                    message: 'Invalid page number',
                    error: 'Page must be a positive integer'
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 400 for invalid limit', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';

                // Act
                const response = await request(app)
                    .get(`/api/analyze/${analysisId}?limit=150`)
                    .expect(400);

                // Assert
                expect(response.body).toEqual({
                    success: false,
                    message: 'Invalid limit',
                    error: 'Limit must be between 1 and 100'
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
                getAnalysisStatus.mockResolvedValue(null);

                // Act
                const response = await request(app)
                    .get(`/api/analyze/${analysisId}`)
                    .expect(404);

                // Assert
                expect(response.body).toEqual({
                    success: false,
                    message: 'Analysis not found',
                    error: `No analysis found with ID: ${analysisId}`
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle getAnalysisStatus function errors', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const error = new Error('Database connection failed');
                error.statusCode = 503;
                
                getAnalysisStatus.mockRejectedValue(error);

                // Act
                const response = await request(app)
                    .get(`/api/analyze/${analysisId}`)
                    .expect(503);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Database connection failed');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should use default pagination values', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const mockAnalysisData = {
                    status: 'completed',
                    progress: 100,
                    data: [],
                    pagination: { page: 1, limit: 50, total: 0, hasMore: false }
                };

                getAnalysisStatus.mockResolvedValue(mockAnalysisData);

                // Act
                const response = await request(app)
                    .get(`/api/analyze/${analysisId}`)
                    .expect(200);

                // Assert - should default to page=1, limit=50
                expect(getAnalysisStatus).toHaveBeenCalledWith(analysisId, 1, 50);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('Edge Cases and Error Scenarios', () => {
        it('should handle very long YouTube URLs', async () => {
            try {
                // Arrange
                const longUrl = 'https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw' + '?'.repeat(100);
                const mockAnalysisResult = {
                    analysisId: 'test-long-url',
                    estimatedTime: '2-10 minutes depending on channel size'
                };
                
                startAnalysis.mockResolvedValue(mockAnalysisResult);

                // Act
                const response = await request(app)
                    .post('/api/analyze')
                    .send({ channelUrl: longUrl })
                    .expect(202);

                // Assert
                expect(response.body.success).toBe(true);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle malformed JSON in request body', async () => {
            try {
                // Act - Express will handle malformed JSON
                const response = await request(app)
                    .post('/api/analyze')
                    .set('Content-Type', 'application/json')
                    .send('{"channelUrl": incomplete json')
                    .expect(400);

                // Assert - Express returns its own error for malformed JSON
                expect(response.status).toBe(400);
                // Don't check response.body structure as Express handles this differently

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle analysis timeout errors', async () => {
            try {
                // Arrange
                const channelUrl = 'https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw';
                const timeoutError = new Error('Analysis timeout');
                timeoutError.statusCode = 408;
                
                startAnalysis.mockRejectedValue(timeoutError);

                // Act
                const response = await request(app)
                    .post('/api/analyze')
                    .send({ channelUrl })
                    .expect(408);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Analysis timeout');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle rate limit errors', async () => {
            try {
                // Arrange
                const channelUrl = 'https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw';
                const rateLimitError = new Error('Rate limit exceeded');
                rateLimitError.statusCode = 429;
                
                startAnalysis.mockRejectedValue(rateLimitError);

                // Act
                const response = await request(app)
                    .post('/api/analyze')
                    .send({ channelUrl })
                    .expect(429);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Rate limit exceeded');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });
});