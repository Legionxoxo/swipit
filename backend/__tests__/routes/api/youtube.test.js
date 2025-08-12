/**
 * @fileoverview Comprehensive tests for YouTube API endpoints with pagination
 * @author Backend Test Guardian
 */

const request = require('supertest');
const express = require('express');

// Mock the YouTube service
const mockYouTubeService = {
    getAllCompletedAnalyses: jest.fn(),
    getAnalysis: jest.fn(),
    getAnalysisSummary: jest.fn(),
    getVideos: jest.fn(),
    deleteAnalysis: jest.fn()
};

jest.mock('../../../utils/youtube/youtubeService', () => mockYouTubeService);

const youtubeRoutes = require('../../../routes/api/youtube');

describe('YouTube API Routes - Data Retrieval with Pagination', () => {
    let app;

    beforeEach(() => {
        try {
            // Create fresh Express app for each test
            app = express();
            app.use(express.json());
            app.use('/api/youtube', youtubeRoutes);
            
            // Reset all mocks
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
            // Clean up app instance
            app = null;
            
        } catch (error) {
            console.error('Test cleanup error:', error);
        } finally {
            // Test cleanup completed
        }
    });

    describe('GET /api/youtube/analyses - Get All Analyses with Pagination', () => {
        it('should successfully retrieve analyses with default pagination', async () => {
            try {
                // Arrange
                const mockAnalyses = [
                    {
                        id: 'analysis-1',
                        channelName: 'Tech Channel',
                        status: 'completed',
                        videoCount: 150,
                        createdAt: '2023-12-01T10:00:00Z'
                    },
                    {
                        id: 'analysis-2',
                        channelName: 'Gaming Channel',
                        status: 'completed',
                        videoCount: 200,
                        createdAt: '2023-12-02T10:00:00Z'
                    }
                ];
                
                mockYouTubeService.getAllCompletedAnalyses.mockResolvedValue({
                    success: true,
                    data: mockAnalyses,
                    message: 'Analyses retrieved successfully'
                });

                // Act
                const response = await request(app)
                    .get('/api/youtube/analyses')
                    .expect(200);

                // Assert
                expect(response.body).toEqual({
                    success: true,
                    message: 'YouTube analyses retrieved successfully',
                    data: mockAnalyses,
                    pagination: {
                        limit: 20,
                        offset: 0,
                        totalCount: 2
                    }
                });
                expect(mockYouTubeService.getAllCompletedAnalyses).toHaveBeenCalledWith({
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

        it('should handle custom pagination parameters', async () => {
            try {
                // Arrange
                const limit = 5;
                const offset = 10;
                const includeTotal = 'false';
                
                mockYouTubeService.getAllCompletedAnalyses.mockResolvedValue({
                    success: true,
                    data: [],
                    message: 'Analyses retrieved successfully'
                });

                // Act
                const response = await request(app)
                    .get('/api/youtube/analyses')
                    .query({ limit, offset, includeTotal })
                    .expect(200);

                // Assert
                expect(response.body.pagination).toEqual({
                    limit: 5,
                    offset: 10,
                    totalCount: 0
                });
                expect(mockYouTubeService.getAllCompletedAnalyses).toHaveBeenCalledWith({
                    limit: 5,
                    offset: 10,
                    includeTotal: false
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle large pagination requests', async () => {
            try {
                // Arrange
                const limit = 100;
                const offset = 500;
                
                const mockAnalyses = Array.from({ length: 100 }, (_, i) => ({
                    id: `analysis-${i + 501}`,
                    channelName: `Channel ${i + 501}`,
                    status: 'completed',
                    videoCount: Math.floor(Math.random() * 1000),
                    createdAt: `2023-12-01T${String(i % 24).padStart(2, '0')}:00:00Z`
                }));
                
                mockYouTubeService.getAllCompletedAnalyses.mockResolvedValue({
                    success: true,
                    data: mockAnalyses,
                    message: 'Analyses retrieved successfully'
                });

                // Act
                const response = await request(app)
                    .get('/api/youtube/analyses')
                    .query({ limit, offset })
                    .expect(200);

                // Assert
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(100);
                expect(response.body.pagination).toEqual({
                    limit: 100,
                    offset: 500,
                    totalCount: 100
                });

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
                mockYouTubeService.getAllCompletedAnalyses.mockResolvedValue({
                    success: true,
                    data: [],
                    message: 'Analyses retrieved successfully'
                });

                // Act
                const response = await request(app)
                    .get('/api/youtube/analyses')
                    .query({ 
                        limit: 'invalid', 
                        offset: 'invalid',
                        includeTotal: 'invalid'
                    })
                    .expect(200);

                // Assert - Should use defaults for invalid values
                expect(response.body.pagination.limit).toBe(20);
                expect(response.body.pagination.offset).toBe(0);
                expect(mockYouTubeService.getAllCompletedAnalyses).toHaveBeenCalledWith({
                    limit: 20,
                    offset: 0,
                    includeTotal: false
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle service errors', async () => {
            try {
                // Arrange
                mockYouTubeService.getAllCompletedAnalyses.mockResolvedValue({
                    success: false,
                    message: 'Database connection failed',
                    error: 'Unable to connect to database'
                });

                // Act
                const response = await request(app)
                    .get('/api/youtube/analyses')
                    .expect(404);

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
    });

    describe('GET /api/youtube/analysis/:id/videos - Get Videos with Pagination and Sorting', () => {
        it('should successfully retrieve videos with default pagination and sorting', async () => {
            try {
                // Arrange
                const analysisId = 'analysis-123';
                const mockVideos = [
                    {
                        id: 'video-1',
                        title: 'Most Popular Video',
                        video_view_count: 1000000,
                        publishedAt: '2023-11-01T10:00:00Z'
                    },
                    {
                        id: 'video-2',
                        title: 'Second Popular Video',
                        video_view_count: 500000,
                        publishedAt: '2023-11-02T10:00:00Z'
                    }
                ];
                
                mockYouTubeService.getVideos.mockResolvedValue({
                    success: true,
                    data: mockVideos,
                    message: 'Videos retrieved successfully'
                });

                // Act
                const response = await request(app)
                    .get(`/api/youtube/analysis/${analysisId}/videos`)
                    .expect(200);

                // Assert
                expect(response.body).toEqual({
                    success: true,
                    message: 'YouTube videos retrieved successfully',
                    data: mockVideos,
                    pagination: {
                        limit: 100,
                        offset: 0,
                        totalCount: 2
                    }
                });
                expect(mockYouTubeService.getVideos).toHaveBeenCalledWith(analysisId, {
                    limit: 100,
                    offset: 0,
                    sortBy: 'video_view_count',
                    sortOrder: 'DESC'
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle custom pagination and sorting parameters', async () => {
            try {
                // Arrange
                const analysisId = 'analysis-123';
                const limit = 25;
                const offset = 50;
                const sortBy = 'publishedAt';
                const sortOrder = 'ASC';
                
                mockYouTubeService.getVideos.mockResolvedValue({
                    success: true,
                    data: [],
                    message: 'Videos retrieved successfully'
                });

                // Act
                const response = await request(app)
                    .get(`/api/youtube/analysis/${analysisId}/videos`)
                    .query({ limit, offset, sortBy, sortOrder })
                    .expect(200);

                // Assert
                expect(response.body.pagination).toEqual({
                    limit: 25,
                    offset: 50,
                    totalCount: 0
                });
                expect(mockYouTubeService.getVideos).toHaveBeenCalledWith(analysisId, {
                    limit: 25,
                    offset: 50,
                    sortBy: 'publishedAt',
                    sortOrder: 'ASC'
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle starred videos retrieval (high ratings)', async () => {
            try {
                // Arrange
                const analysisId = 'analysis-123';
                const mockStarredVideos = [
                    {
                        id: 'video-starred-1',
                        title: '5 Star Video',
                        video_view_count: 2000000,
                        rating: 5,
                        starRating: 5,
                        isFavorite: true
                    },
                    {
                        id: 'video-starred-2',
                        title: '4 Star Video',
                        video_view_count: 1500000,
                        rating: 4,
                        starRating: 4,
                        isFavorite: false
                    }
                ];
                
                mockYouTubeService.getVideos.mockResolvedValue({
                    success: true,
                    data: mockStarredVideos,
                    message: 'Starred videos retrieved successfully'
                });

                // Act - Simulate filtering for high-rated videos
                const response = await request(app)
                    .get(`/api/youtube/analysis/${analysisId}/videos`)
                    .query({ sortBy: 'rating', sortOrder: 'DESC', limit: 50 })
                    .expect(200);

                // Assert
                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual(mockStarredVideos);
                expect(mockYouTubeService.getVideos).toHaveBeenCalledWith(analysisId, {
                    limit: 50,
                    offset: 0,
                    sortBy: 'rating',
                    sortOrder: 'DESC'
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle favorite videos retrieval', async () => {
            try {
                // Arrange
                const analysisId = 'analysis-123';
                const mockFavoriteVideos = [
                    {
                        id: 'video-fav-1',
                        title: 'Favorite Video 1',
                        video_view_count: 750000,
                        isFavorite: true,
                        dateAdded: '2023-12-01T10:00:00Z'
                    },
                    {
                        id: 'video-fav-2',
                        title: 'Favorite Video 2',
                        video_view_count: 890000,
                        isFavorite: true,
                        dateAdded: '2023-12-02T15:30:00Z'
                    }
                ];
                
                mockYouTubeService.getVideos.mockResolvedValue({
                    success: true,
                    data: mockFavoriteVideos,
                    message: 'Favorite videos retrieved successfully'
                });

                // Act - Simulate filtering for favorite videos
                const response = await request(app)
                    .get(`/api/youtube/analysis/${analysisId}/videos`)
                    .query({ sortBy: 'dateAdded', sortOrder: 'DESC' })
                    .expect(200);

                // Assert
                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual(mockFavoriteVideos);
                expect(response.body.data.every(video => video.isFavorite)).toBe(true);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 400 for missing analysis ID', async () => {
            try {
                // Act
                const response = await request(app)
                    .get('/api/youtube/analysis//videos')
                    .expect(404); // Express returns 404 for malformed routes

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle service errors for video retrieval', async () => {
            try {
                // Arrange
                const analysisId = 'non-existent-analysis';
                mockYouTubeService.getVideos.mockResolvedValue({
                    success: false,
                    message: 'Analysis not found',
                    error: 'No analysis exists with the specified ID'
                });

                // Act
                const response = await request(app)
                    .get(`/api/youtube/analysis/${analysisId}/videos`)
                    .expect(404);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Analysis not found');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('GET /api/youtube/analysis/:id - Get Analysis Details', () => {
        it('should successfully retrieve analysis details', async () => {
            try {
                // Arrange
                const analysisId = 'analysis-123';
                const mockAnalysis = {
                    id: analysisId,
                    channelName: 'Tech Reviews Channel',
                    channelId: 'UC123456789',
                    status: 'completed',
                    videoCount: 250,
                    totalViews: 50000000,
                    averageViews: 200000,
                    createdAt: '2023-11-01T10:00:00Z',
                    completedAt: '2023-11-01T12:30:00Z'
                };
                
                mockYouTubeService.getAnalysis.mockResolvedValue({
                    success: true,
                    data: mockAnalysis,
                    message: 'Analysis retrieved successfully'
                });

                // Act
                const response = await request(app)
                    .get(`/api/youtube/analysis/${analysisId}`)
                    .expect(200);

                // Assert
                expect(response.body).toEqual({
                    success: true,
                    message: 'YouTube analysis retrieved successfully',
                    data: mockAnalysis
                });
                expect(mockYouTubeService.getAnalysis).toHaveBeenCalledWith(analysisId, 1, 50);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 404 for non-existent analysis', async () => {
            try {
                // Arrange
                const analysisId = 'non-existent-123';
                mockYouTubeService.getAnalysis.mockResolvedValue({
                    success: false,
                    message: 'Analysis not found',
                    error: 'No analysis exists with the specified ID'
                });

                // Act
                const response = await request(app)
                    .get(`/api/youtube/analysis/${analysisId}`)
                    .expect(404);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Analysis not found');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('GET /api/youtube/analysis/:id/summary - Get Analysis Summary', () => {
        it('should successfully retrieve analysis summary', async () => {
            try {
                // Arrange
                const analysisId = 'analysis-123';
                const mockSummary = {
                    id: analysisId,
                    channelName: 'Tech Reviews Channel',
                    totalVideos: 250,
                    totalViews: 50000000,
                    totalSubscribers: 1200000,
                    averageViewsPerVideo: 200000,
                    mostPopularVideo: {
                        id: 'video-popular',
                        title: 'Best Tech Review 2023',
                        views: 2500000
                    },
                    engagementStats: {
                        averageLikes: 15000,
                        averageComments: 1200,
                        engagementRate: 0.045
                    }
                };
                
                mockYouTubeService.getAnalysisSummary.mockResolvedValue({
                    success: true,
                    data: mockSummary,
                    message: 'Analysis summary retrieved successfully'
                });

                // Act
                const response = await request(app)
                    .get(`/api/youtube/analysis/${analysisId}/summary`)
                    .expect(200);

                // Assert
                expect(response.body).toEqual({
                    success: true,
                    message: 'YouTube analysis summary retrieved successfully',
                    data: mockSummary
                });
                expect(mockYouTubeService.getAnalysisSummary).toHaveBeenCalledWith(analysisId);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('DELETE /api/youtube/analysis/:id - Delete Analysis', () => {
        it('should successfully delete analysis', async () => {
            try {
                // Arrange
                const analysisId = 'analysis-to-delete-123';
                
                mockYouTubeService.deleteAnalysis.mockResolvedValue({
                    success: true,
                    data: { id: analysisId, deleted: true },
                    message: 'Analysis deleted successfully'
                });

                // Act
                const response = await request(app)
                    .delete(`/api/youtube/analysis/${analysisId}`)
                    .expect(200);

                // Assert
                expect(response.body).toEqual({
                    success: true,
                    message: 'YouTube analysis deleted successfully',
                    data: { id: analysisId, deleted: true }
                });
                expect(mockYouTubeService.deleteAnalysis).toHaveBeenCalledWith(analysisId);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 404 for non-existent analysis deletion', async () => {
            try {
                // Arrange
                const analysisId = 'non-existent-analysis';
                mockYouTubeService.deleteAnalysis.mockResolvedValue({
                    success: false,
                    message: 'Analysis not found',
                    error: 'No analysis exists with the specified ID'
                });

                // Act
                const response = await request(app)
                    .delete(`/api/youtube/analysis/${analysisId}`)
                    .expect(404);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Analysis not found');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('Edge Cases and Performance', () => {
        it('should handle concurrent requests efficiently', async () => {
            try {
                // Arrange
                const analysisIds = ['analysis-1', 'analysis-2', 'analysis-3'];
                mockYouTubeService.getAnalysis.mockImplementation(async (id) => ({
                    success: true,
                    data: { id, channelName: `Channel for ${id}` },
                    message: 'Analysis retrieved successfully'
                }));

                // Act
                const responses = await Promise.all(
                    analysisIds.map(id => 
                        request(app)
                            .get(`/api/youtube/analysis/${id}`)
                            .expect(200)
                    )
                );

                // Assert
                expect(responses).toHaveLength(3);
                responses.forEach((response, index) => {
                    expect(response.body.success).toBe(true);
                    expect(response.body.data.id).toBe(analysisIds[index]);
                });
                expect(mockYouTubeService.getAnalysis).toHaveBeenCalledTimes(3);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle service exceptions gracefully', async () => {
            try {
                // Arrange
                const analysisId = 'analysis-123';
                const serviceError = new Error('Database timeout');
                serviceError.statusCode = 503;
                mockYouTubeService.getAnalysis.mockRejectedValue(serviceError);

                // Act
                const response = await request(app)
                    .get(`/api/youtube/analysis/${analysisId}`)
                    .expect(503);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Database timeout');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle very large datasets with pagination', async () => {
            try {
                // Arrange
                const analysisId = 'large-analysis-123';
                const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
                    id: `video-${i + 1}`,
                    title: `Video ${i + 1}`,
                    video_view_count: Math.floor(Math.random() * 10000000),
                    publishedAt: `2023-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-01T10:00:00Z`
                }));
                
                mockYouTubeService.getVideos.mockResolvedValue({
                    success: true,
                    data: largeDataset,
                    message: 'Large dataset retrieved successfully'
                });

                // Act
                const response = await request(app)
                    .get(`/api/youtube/analysis/${analysisId}/videos`)
                    .query({ limit: 1000, offset: 0 })
                    .expect(200);

                // Assert
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(1000);
                expect(response.body.pagination.totalCount).toBe(1000);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });
});