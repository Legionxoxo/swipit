/**
 * @fileoverview Tests for Instagram API routes
 * @author Backend Team
 */

const request = require('supertest');
const express = require('express');

// Mock the dependencies before requiring the route
jest.mock('../../../functions/route_fns/analyzeInstagram');
jest.mock('../../../database/instagram/instagramJobs');

const instagramRoutes = require('../../../routes/api/instagram');
const { analyzeInstagram, getInstagramAnalysisStatus } = require('../../../functions/route_fns/analyzeInstagram');
const { getAllCompletedAnalyses } = require('../../../database/instagram/instagramJobs');

describe('Instagram API Routes', () => {
    let app;

    beforeEach(() => {
        try {
            // Create Express app for testing
            app = express();
            app.use(express.json());
            app.use('/api/instagram', instagramRoutes);
            
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

    describe('POST /api/instagram/analyze', () => {
        it('should start Instagram analysis successfully with valid username', async () => {
            try {
                // Arrange
                const username = 'testuser';
                const mockAnalysisResult = {
                    analysisId: 'analysis_me87obwe_n8a2ogtpf',
                    estimatedTime: '1-5 minutes depending on profile size'
                };
                
                analyzeInstagram.mockResolvedValue(mockAnalysisResult);

                // Act
                const response = await request(app)
                    .post('/api/instagram/analyze')
                    .send({ username })
                    .expect(202);

                // Assert
                expect(response.body).toEqual({
                    success: true,
                    message: 'Instagram analysis started successfully',
                    analysisId: 'analysis_me87obwe_n8a2ogtpf',
                    status: 'processing',
                    progress: 0,
                    estimatedTime: '1-5 minutes depending on profile size'
                });
                
                expect(analyzeInstagram).toHaveBeenCalledWith('testuser', undefined);
                expect(analyzeInstagram).toHaveBeenCalledTimes(1);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should start analysis with sessionId when provided', async () => {
            try {
                // Arrange
                const username = 'testuser';
                const sessionId = 'session-123';
                const mockAnalysisResult = {
                    analysisId: 'analysis_session_123',
                    estimatedTime: '1-5 minutes depending on profile size'
                };
                
                analyzeInstagram.mockResolvedValue(mockAnalysisResult);

                // Act
                const response = await request(app)
                    .post('/api/instagram/analyze')
                    .send({ username, sessionId })
                    .expect(202);

                // Assert
                expect(response.body.success).toBe(true);
                expect(analyzeInstagram).toHaveBeenCalledWith('testuser', 'session-123');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should trim username and validate', async () => {
            try {
                // Arrange
                const username = '  testuser  ';
                const mockAnalysisResult = {
                    analysisId: 'analysis_trimmed_123',
                    estimatedTime: '1-5 minutes depending on profile size'
                };
                
                analyzeInstagram.mockResolvedValue(mockAnalysisResult);

                // Act
                const response = await request(app)
                    .post('/api/instagram/analyze')
                    .send({ username })
                    .expect(202);

                // Assert
                expect(response.body.success).toBe(true);
                expect(analyzeInstagram).toHaveBeenCalledWith('testuser', undefined);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 400 when username is missing', async () => {
            try {
                // Act
                const response = await request(app)
                    .post('/api/instagram/analyze')
                    .send({})
                    .expect(400);

                // Assert
                expect(response.body).toEqual({
                    success: false,
                    message: 'Username is required',
                    error: 'Missing username in request body'
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 400 when username is not a string', async () => {
            try {
                // Act
                const response = await request(app)
                    .post('/api/instagram/analyze')
                    .send({ username: 123 })
                    .expect(400);

                // Assert
                expect(response.body).toEqual({
                    success: false,
                    message: 'Username must be a string',
                    error: 'Invalid username format'
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 400 when username is empty after trim', async () => {
            try {
                // Act
                const response = await request(app)
                    .post('/api/instagram/analyze')
                    .send({ username: '   ' })
                    .expect(400);

                // Assert
                expect(response.body).toEqual({
                    success: false,
                    message: 'Username cannot be empty',
                    error: 'Empty username provided'
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 400 when username is too long', async () => {
            try {
                // Act
                const longUsername = 'a'.repeat(51);
                const response = await request(app)
                    .post('/api/instagram/analyze')
                    .send({ username: longUsername })
                    .expect(400);

                // Assert
                expect(response.body).toEqual({
                    success: false,
                    message: 'Username is too long',
                    error: 'Username must be 50 characters or less'
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle analyzeInstagram function errors with invalid username', async () => {
            try {
                // Arrange
                analyzeInstagram.mockRejectedValue(new Error('Invalid username format'));

                // Act
                const response = await request(app)
                    .post('/api/instagram/analyze')
                    .send({ username: 'validuser' })
                    .expect(400);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Invalid username');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle generic analyzeInstagram function errors', async () => {
            try {
                // Arrange
                analyzeInstagram.mockRejectedValue(new Error('Service temporarily unavailable'));

                // Act
                const response = await request(app)
                    .post('/api/instagram/analyze')
                    .send({ username: 'validuser' })
                    .expect(500);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Service temporarily unavailable');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('GET /api/instagram/analysis/:id', () => {
        it('should return Instagram analysis status successfully', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const mockAnalysisData = {
                    analysisId: 'test-analysis-123',
                    status: 'completed',
                    progress: 100,
                    profile: { username: 'testuser', followers: 1000 },
                    reels: [],
                    reelSegments: {},
                    totalReels: 0,
                    pagination: { page: 1, limit: 50, total: 0 },
                    error: null
                };

                getInstagramAnalysisStatus.mockResolvedValue(mockAnalysisData);

                // Act
                const response = await request(app)
                    .get(`/api/instagram/analysis/${analysisId}`)
                    .expect(200);

                // Assert
                expect(response.body.success).toBe(true);
                expect(response.body.analysisId).toBe(analysisId);
                expect(getInstagramAnalysisStatus).toHaveBeenCalledWith(analysisId, 1, 50);

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
                    analysisId: 'test-analysis-123',
                    status: 'completed',
                    progress: 100,
                    pagination: { page: 2, limit: 25, total: 100 }
                };

                getInstagramAnalysisStatus.mockResolvedValue(mockAnalysisData);

                // Act
                const response = await request(app)
                    .get(`/api/instagram/analysis/${analysisId}?page=2&limit=25`)
                    .expect(200);

                // Assert
                expect(response.body.success).toBe(true);
                expect(getInstagramAnalysisStatus).toHaveBeenCalledWith(analysisId, 2, 25);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should enforce maximum limit of 100', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const mockAnalysisData = {
                    analysisId: 'test-analysis-123',
                    status: 'completed'
                };

                getInstagramAnalysisStatus.mockResolvedValue(mockAnalysisData);

                // Act
                const response = await request(app)
                    .get(`/api/instagram/analysis/${analysisId}?limit=150`)
                    .expect(200);

                // Assert
                expect(getInstagramAnalysisStatus).toHaveBeenCalledWith(analysisId, 1, 100);

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
                    .get('/api/instagram/analysis/')
                    .expect(404); // Express returns 404 for missing route params

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
                const analysisId = 'non-existent-id';
                getInstagramAnalysisStatus.mockResolvedValue(null);

                // Act
                const response = await request(app)
                    .get(`/api/instagram/analysis/${analysisId}`)
                    .expect(404);

                // Assert
                expect(response.body).toEqual({
                    success: false,
                    message: 'Analysis not found',
                    error: `No Instagram analysis found with ID: ${analysisId}`
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle getInstagramAnalysisStatus function errors', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                getInstagramAnalysisStatus.mockRejectedValue(new Error('Database connection failed'));

                // Act
                const response = await request(app)
                    .get(`/api/instagram/analysis/${analysisId}`)
                    .expect(500);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Database connection failed');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle invalid pagination parameters gracefully', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const mockAnalysisData = {
                    analysisId: 'test-analysis-123',
                    status: 'completed'
                };

                getInstagramAnalysisStatus.mockResolvedValue(mockAnalysisData);

                // Act
                const response = await request(app)
                    .get(`/api/instagram/analysis/${analysisId}?page=invalid&limit=abc`)
                    .expect(200);

                // Assert - should default to page=1, limit=50
                expect(getInstagramAnalysisStatus).toHaveBeenCalledWith(analysisId, 1, 50);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('GET /api/instagram/health', () => {
        it('should return health status successfully', async () => {
            try {
                // Act
                const response = await request(app)
                    .get('/api/instagram/health')
                    .expect(200);

                // Assert
                expect(response.body).toMatchObject({
                    success: true,
                    message: 'Instagram API is running',
                    service: 'Instagram Analysis API'
                });
                expect(response.body.timestamp).toBeDefined();

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('GET /api/instagram/analyses', () => {
        it('should return all completed analyses with total count', async () => {
            try {
                // Arrange
                const mockResult = {
                    data: [
                        { id: '1', username: 'user1', status: 'completed' },
                        { id: '2', username: 'user2', status: 'completed' }
                    ],
                    total: 2,
                    limit: 20,
                    offset: 0,
                    hasMore: false
                };

                getAllCompletedAnalyses.mockResolvedValue(mockResult);

                // Act
                const response = await request(app)
                    .get('/api/instagram/analyses')
                    .expect(200);

                // Assert
                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual(mockResult.data);
                expect(response.body.total).toBe(2);
                expect(getAllCompletedAnalyses).toHaveBeenCalledWith({
                    limit: 20,
                    offset: 0,
                    includeTotal: true
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return analyses without total when includeTotal is false', async () => {
            try {
                // Arrange
                const mockResult = [
                    { id: '1', username: 'user1', status: 'completed' },
                    { id: '2', username: 'user2', status: 'completed' }
                ];

                getAllCompletedAnalyses.mockResolvedValue(mockResult);

                // Act
                const response = await request(app)
                    .get('/api/instagram/analyses?includeTotal=false')
                    .expect(200);

                // Assert
                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual(mockResult);
                expect(response.body.total).toBeUndefined();

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle custom limit and offset parameters', async () => {
            try {
                // Arrange
                const mockResult = {
                    data: [],
                    total: 0,
                    limit: 10,
                    offset: 20,
                    hasMore: false
                };

                getAllCompletedAnalyses.mockResolvedValue(mockResult);

                // Act
                const response = await request(app)
                    .get('/api/instagram/analyses?limit=10&offset=20')
                    .expect(200);

                // Assert
                expect(getAllCompletedAnalyses).toHaveBeenCalledWith({
                    limit: 10,
                    offset: 20,
                    includeTotal: true
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle getAllCompletedAnalyses function errors', async () => {
            try {
                // Arrange
                getAllCompletedAnalyses.mockRejectedValue(new Error('Database query failed'));

                // Act
                const response = await request(app)
                    .get('/api/instagram/analyses')
                    .expect(500);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Failed to retrieve Instagram analyses');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle invalid query parameters gracefully', async () => {
            try {
                // Arrange
                const mockResult = {
                    data: [],
                    total: 0,
                    limit: 20,
                    offset: 0,
                    hasMore: false
                };

                getAllCompletedAnalyses.mockResolvedValue(mockResult);

                // Act
                const response = await request(app)
                    .get('/api/instagram/analyses?limit=invalid&offset=abc')
                    .expect(200);

                // Assert - should default to limit=20, offset=0
                expect(getAllCompletedAnalyses).toHaveBeenCalledWith({
                    limit: 20,
                    offset: 0,
                    includeTotal: true
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('Edge Cases and Error Scenarios', () => {
        it('should handle special characters in username', async () => {
            try {
                // Arrange
                const mockAnalysisResult = {
                    analysisId: 'analysis_special_123',
                    estimatedTime: '1-5 minutes depending on profile size'
                };
                
                analyzeInstagram.mockResolvedValue(mockAnalysisResult);

                // Act
                const response = await request(app)
                    .post('/api/instagram/analyze')
                    .send({ username: 'test.user_123' })
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

        it('should handle unicode characters in username', async () => {
            try {
                // Arrange
                const mockAnalysisResult = {
                    analysisId: 'analysis_unicode_123',
                    estimatedTime: '1-5 minutes depending on profile size'
                };
                
                analyzeInstagram.mockResolvedValue(mockAnalysisResult);

                // Act
                const response = await request(app)
                    .post('/api/instagram/analyze')
                    .send({ username: 'tëstüser' })
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

        it('should handle maximum length username (50 chars)', async () => {
            try {
                // Arrange
                const maxUsername = 'a'.repeat(50);
                const mockAnalysisResult = {
                    analysisId: 'analysis_max_length_123',
                    estimatedTime: '1-5 minutes depending on profile size'
                };
                
                analyzeInstagram.mockResolvedValue(mockAnalysisResult);

                // Act
                const response = await request(app)
                    .post('/api/instagram/analyze')
                    .send({ username: maxUsername })
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

        it('should handle very long analysis ID in status request', async () => {
            try {
                // Arrange
                const longAnalysisId = 'a'.repeat(100);
                const mockAnalysisData = {
                    analysisId: longAnalysisId,
                    status: 'completed'
                };

                getInstagramAnalysisStatus.mockResolvedValue(mockAnalysisData);

                // Act
                const response = await request(app)
                    .get(`/api/instagram/analysis/${longAnalysisId}`)
                    .expect(200);

                // Assert
                expect(response.body.success).toBe(true);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });
});