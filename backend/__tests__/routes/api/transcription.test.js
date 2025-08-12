/**
 * @fileoverview Comprehensive tests for transcription API endpoints
 * @author Backend Test Guardian
 */

const request = require('supertest');
const express = require('express');

// Mock the transcription service
const mockTranscriptionService = {
    startTranscription: jest.fn(),
    getTranscription: jest.fn(),
    getVideoTranscription: jest.fn(),
    getUserTranscriptions: jest.fn(),
    deleteTranscription: jest.fn()
};

jest.mock('../../../functions/route_fns/transcription', () => mockTranscriptionService);

const transcriptionRoutes = require('../../../routes/api/transcription');

describe('Transcription API Routes - Audio Translation Service', () => {
    let app;

    beforeEach(() => {
        try {
            // Create fresh Express app for each test
            app = express();
            app.use(express.json());
            app.use('/api/transcription', transcriptionRoutes);
            
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

    describe('POST /api/transcription - Start Audio Translation/Transcription', () => {
        it('should successfully start transcription for YouTube video', async () => {
            try {
                // Arrange
                const requestBody = {
                    userId: 'test-user-123',
                    videoId: 'dQw4w9WgXcQ',
                    platform: 'youtube'
                };
                
                const mockTranscriptionId = 'transcription-456';
                mockTranscriptionService.startTranscription.mockResolvedValue({
                    success: true,
                    transcriptionId: mockTranscriptionId,
                    message: 'Transcription started successfully'
                });

                // Act
                const response = await request(app)
                    .post('/api/transcription')
                    .send(requestBody)
                    .expect(202);

                // Assert
                expect(response.body).toEqual({
                    success: true,
                    message: 'Transcription job started successfully',
                    data: {
                        transcriptionId: mockTranscriptionId,
                        status: 'processing',
                        estimatedTime: '2-5 minutes'
                    }
                });
                expect(mockTranscriptionService.startTranscription).toHaveBeenCalledWith({
                    userId: 'test-user-123',
                    videoId: 'dQw4w9WgXcQ',
                    platform: 'youtube'
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should successfully start transcription for Instagram video', async () => {
            try {
                // Arrange
                const requestBody = {
                    userId: 'test-user-123',
                    videoId: 'CAJyzeKgfOa',
                    platform: 'instagram'
                };
                
                const mockTranscriptionId = 'transcription-789';
                mockTranscriptionService.startTranscription.mockResolvedValue({
                    success: true,
                    transcriptionId: mockTranscriptionId,
                    message: 'Transcription started successfully'
                });

                // Act
                const response = await request(app)
                    .post('/api/transcription')
                    .send(requestBody)
                    .expect(202);

                // Assert
                expect(response.body.success).toBe(true);
                expect(response.body.data.transcriptionId).toBe(mockTranscriptionId);
                expect(response.body.data.status).toBe('processing');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 400 for missing user ID', async () => {
            try {
                // Arrange
                const requestBody = {
                    videoId: 'dQw4w9WgXcQ',
                    platform: 'youtube'
                };

                // Act
                const response = await request(app)
                    .post('/api/transcription')
                    .send(requestBody)
                    .expect(400);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('User ID is required');
                expect(response.body.error).toBe('Missing userId in request body');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 400 for missing video ID', async () => {
            try {
                // Arrange
                const requestBody = {
                    userId: 'test-user-123',
                    platform: 'youtube'
                };

                // Act
                const response = await request(app)
                    .post('/api/transcription')
                    .send(requestBody)
                    .expect(400);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Video ID is required');
                expect(response.body.error).toBe('Missing videoId in request body');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 400 for invalid platform', async () => {
            try {
                // Arrange
                const testCases = [
                    { platform: 'tiktok' }, // Unsupported platform
                    { platform: '' }, // Empty platform
                    {}, // Missing platform
                ];

                for (const extraFields of testCases) {
                    const requestBody = {
                        userId: 'test-user-123',
                        videoId: 'dQw4w9WgXcQ',
                        ...extraFields
                    };

                    // Act
                    const response = await request(app)
                        .post('/api/transcription')
                        .send(requestBody)
                        .expect(400);

                    // Assert
                    expect(response.body.success).toBe(false);
                    expect(response.body.message).toBe('Valid platform is required');
                    expect(response.body.error).toBe('Platform must be either "youtube" or "instagram"');
                }

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle service errors with appropriate status codes', async () => {
            try {
                // Arrange
                const requestBody = {
                    userId: 'test-user-123',
                    videoId: 'invalid-video-id',
                    platform: 'youtube'
                };
                
                mockTranscriptionService.startTranscription.mockResolvedValue({
                    success: false,
                    message: 'Video not found',
                    error: 'The specified video does not exist or is private'
                });

                // Act
                const response = await request(app)
                    .post('/api/transcription')
                    .send(requestBody)
                    .expect(400);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Video not found');
                expect(response.body.error).toBe('The specified video does not exist or is private');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle service exceptions', async () => {
            try {
                // Arrange
                const requestBody = {
                    userId: 'test-user-123',
                    videoId: 'dQw4w9WgXcQ',
                    platform: 'youtube'
                };
                
                const serviceError = new Error('Network timeout');
                serviceError.statusCode = 503;
                mockTranscriptionService.startTranscription.mockRejectedValue(serviceError);

                // Act
                const response = await request(app)
                    .post('/api/transcription')
                    .send(requestBody)
                    .expect(503);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Network timeout');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('GET /api/transcription/:id - Get Transcription Status and Results', () => {
        it('should successfully retrieve completed transcription', async () => {
            try {
                // Arrange
                const transcriptionId = 'transcription-completed-123';
                const mockTranscription = {
                    id: transcriptionId,
                    userId: 'test-user-123',
                    videoId: 'dQw4w9WgXcQ',
                    platform: 'youtube',
                    status: 'completed',
                    transcript: 'Hello, this is a test transcription of the video content.',
                    language: 'en',
                    confidence: 0.95,
                    createdAt: '2023-12-01T10:00:00Z',
                    completedAt: '2023-12-01T10:03:45Z'
                };
                
                mockTranscriptionService.getTranscription.mockResolvedValue({
                    success: true,
                    data: mockTranscription,
                    message: 'Transcription retrieved successfully'
                });

                // Act
                const response = await request(app)
                    .get(`/api/transcription/${transcriptionId}`)
                    .expect(200);

                // Assert
                expect(response.body).toEqual({
                    success: true,
                    message: 'Transcription retrieved successfully',
                    data: mockTranscription
                });
                expect(mockTranscriptionService.getTranscription).toHaveBeenCalledWith(transcriptionId);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should retrieve processing transcription status', async () => {
            try {
                // Arrange
                const transcriptionId = 'transcription-processing-456';
                const mockTranscription = {
                    id: transcriptionId,
                    userId: 'test-user-123',
                    videoId: 'dQw4w9WgXcQ',
                    platform: 'youtube',
                    status: 'processing',
                    progress: 65,
                    estimatedTimeRemaining: '1-2 minutes',
                    createdAt: '2023-12-01T10:00:00Z'
                };
                
                mockTranscriptionService.getTranscription.mockResolvedValue({
                    success: true,
                    data: mockTranscription,
                    message: 'Transcription status retrieved successfully'
                });

                // Act
                const response = await request(app)
                    .get(`/api/transcription/${transcriptionId}`)
                    .expect(200);

                // Assert
                expect(response.body.success).toBe(true);
                expect(response.body.data.status).toBe('processing');
                expect(response.body.data.progress).toBe(65);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 404 for non-existent transcription', async () => {
            try {
                // Arrange
                const transcriptionId = 'non-existent-transcription';
                mockTranscriptionService.getTranscription.mockResolvedValue({
                    success: false,
                    message: 'Transcription not found',
                    error: 'No transcription found with the specified ID'
                });

                // Act
                const response = await request(app)
                    .get(`/api/transcription/${transcriptionId}`)
                    .expect(404);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Transcription not found');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 400 for missing transcription ID', async () => {
            try {
                // Act
                const response = await request(app)
                    .get('/api/transcription/')
                    .expect(404); // Express returns 404 for route not found

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('GET /api/transcription/video/:videoId/:platform - Get Video Transcription', () => {
        it('should successfully retrieve transcription by video ID and platform', async () => {
            try {
                // Arrange
                const videoId = 'dQw4w9WgXcQ';
                const platform = 'youtube';
                const mockTranscription = {
                    id: 'transcription-video-123',
                    userId: 'test-user-123',
                    videoId: videoId,
                    platform: platform,
                    status: 'completed',
                    transcript: 'This is the video transcription content.',
                    language: 'en',
                    createdAt: '2023-12-01T10:00:00Z'
                };
                
                mockTranscriptionService.getVideoTranscription.mockResolvedValue({
                    success: true,
                    data: mockTranscription,
                    message: 'Video transcription retrieved successfully'
                });

                // Act
                const response = await request(app)
                    .get(`/api/transcription/video/${videoId}/${platform}`)
                    .expect(200);

                // Assert
                expect(response.body).toEqual({
                    success: true,
                    message: 'Video transcription retrieved successfully',
                    data: mockTranscription
                });
                expect(mockTranscriptionService.getVideoTranscription).toHaveBeenCalledWith(videoId, platform);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 400 for invalid platform in video transcription request', async () => {
            try {
                // Arrange
                const videoId = 'dQw4w9WgXcQ';
                const invalidPlatform = 'tiktok';

                // Act
                const response = await request(app)
                    .get(`/api/transcription/video/${videoId}/${invalidPlatform}`)
                    .expect(400);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Valid platform is required');
                expect(response.body.error).toBe('Platform must be either "youtube" or "instagram"');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 404 for video with no transcription', async () => {
            try {
                // Arrange
                const videoId = 'video-without-transcription';
                const platform = 'youtube';
                
                mockTranscriptionService.getVideoTranscription.mockResolvedValue({
                    success: false,
                    message: 'No transcription found for this video',
                    error: 'Video has not been transcribed yet'
                });

                // Act
                const response = await request(app)
                    .get(`/api/transcription/video/${videoId}/${platform}`)
                    .expect(404);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('No transcription found for this video');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('GET /api/transcription/user/:userId - Get User Transcriptions with Pagination', () => {
        it('should successfully retrieve user transcriptions with default pagination', async () => {
            try {
                // Arrange
                const userId = 'test-user-123';
                const mockTranscriptions = [
                    {
                        id: 'transcription-1',
                        videoId: 'video1',
                        platform: 'youtube',
                        status: 'completed',
                        createdAt: '2023-12-01T10:00:00Z'
                    },
                    {
                        id: 'transcription-2',
                        videoId: 'video2',
                        platform: 'instagram',
                        status: 'processing',
                        createdAt: '2023-12-01T11:00:00Z'
                    }
                ];
                
                mockTranscriptionService.getUserTranscriptions.mockResolvedValue({
                    success: true,
                    data: mockTranscriptions,
                    message: 'User transcriptions retrieved successfully'
                });

                // Act
                const response = await request(app)
                    .get(`/api/transcription/user/${userId}`)
                    .expect(200);

                // Assert
                expect(response.body).toEqual({
                    success: true,
                    message: 'User transcriptions retrieved successfully',
                    data: mockTranscriptions,
                    pagination: {
                        limit: 50,
                        offset: 0,
                        totalCount: 2
                    }
                });
                expect(mockTranscriptionService.getUserTranscriptions).toHaveBeenCalledWith(
                    userId,
                    { limit: 50, offset: 0, status: 'all' }
                );

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
                const userId = 'test-user-123';
                const limit = 10;
                const offset = 20;
                const status = 'completed';
                
                mockTranscriptionService.getUserTranscriptions.mockResolvedValue({
                    success: true,
                    data: [],
                    message: 'User transcriptions retrieved successfully'
                });

                // Act
                const response = await request(app)
                    .get(`/api/transcription/user/${userId}`)
                    .query({ limit, offset, status })
                    .expect(200);

                // Assert
                expect(response.body.pagination).toEqual({
                    limit: 10,
                    offset: 20,
                    totalCount: 0
                });
                expect(mockTranscriptionService.getUserTranscriptions).toHaveBeenCalledWith(
                    userId,
                    { limit: 10, offset: 20, status: 'completed' }
                );

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
                const userId = 'test-user-123';
                
                mockTranscriptionService.getUserTranscriptions.mockResolvedValue({
                    success: true,
                    data: [],
                    message: 'User transcriptions retrieved successfully'
                });

                // Act
                const response = await request(app)
                    .get(`/api/transcription/user/${userId}`)
                    .query({ 
                        limit: 'invalid', 
                        offset: 'invalid',
                        status: null
                    })
                    .expect(200);

                // Assert - Should use defaults for invalid values
                expect(response.body.pagination.limit).toBe(50);
                expect(response.body.pagination.offset).toBe(0);
                expect(mockTranscriptionService.getUserTranscriptions).toHaveBeenCalledWith(
                    userId,
                    { limit: 50, offset: 0, status: '' }
                );

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('DELETE /api/transcription/:id - Delete Transcription', () => {
        it('should successfully delete transcription', async () => {
            try {
                // Arrange
                const transcriptionId = 'transcription-to-delete-123';
                const userId = 'test-user-123';
                
                mockTranscriptionService.deleteTranscription.mockResolvedValue({
                    success: true,
                    data: { id: transcriptionId, deleted: true },
                    message: 'Transcription deleted successfully'
                });

                // Act
                const response = await request(app)
                    .delete(`/api/transcription/${transcriptionId}`)
                    .send({ userId })
                    .expect(200);

                // Assert
                expect(response.body).toEqual({
                    success: true,
                    message: 'Transcription deleted successfully',
                    data: { id: transcriptionId, deleted: true }
                });
                expect(mockTranscriptionService.deleteTranscription).toHaveBeenCalledWith(
                    transcriptionId,
                    userId
                );

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 400 for missing user ID', async () => {
            try {
                // Arrange
                const transcriptionId = 'transcription-to-delete-123';

                // Act
                const response = await request(app)
                    .delete(`/api/transcription/${transcriptionId}`)
                    .send({}) // Missing userId
                    .expect(400);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('User ID is required');
                expect(response.body.error).toBe('Missing userId in request body');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 404 for transcription not found', async () => {
            try {
                // Arrange
                const transcriptionId = 'non-existent-transcription';
                const userId = 'test-user-123';
                
                mockTranscriptionService.deleteTranscription.mockResolvedValue({
                    success: false,
                    message: 'Transcription not found',
                    error: 'No transcription found with the specified ID'
                });

                // Act
                const response = await request(app)
                    .delete(`/api/transcription/${transcriptionId}`)
                    .send({ userId })
                    .expect(404);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Transcription not found');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 404 for unauthorized deletion attempt', async () => {
            try {
                // Arrange
                const transcriptionId = 'transcription-123';
                const wrongUserId = 'wrong-user-456';
                
                mockTranscriptionService.deleteTranscription.mockResolvedValue({
                    success: false,
                    message: 'Transcription not found or access denied',
                    error: 'User does not have permission to delete this transcription'
                });

                // Act
                const response = await request(app)
                    .delete(`/api/transcription/${transcriptionId}`)
                    .send({ userId: wrongUserId })
                    .expect(404);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Transcription not found or access denied');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('Performance and Reliability', () => {
        it('should handle concurrent transcription requests', async () => {
            try {
                // Arrange
                const requests = Array.from({ length: 5 }, (_, i) => ({
                    userId: 'test-user-123',
                    videoId: `video-${i}`,
                    platform: 'youtube'
                }));

                mockTranscriptionService.startTranscription.mockImplementation(async (params) => ({
                    success: true,
                    transcriptionId: `transcription-${params.videoId}`,
                    message: 'Transcription started successfully'
                }));

                // Act
                const responses = await Promise.all(
                    requests.map(req => 
                        request(app)
                            .post('/api/transcription')
                            .send(req)
                            .expect(202)
                    )
                );

                // Assert
                expect(responses).toHaveLength(5);
                responses.forEach((response, index) => {
                    expect(response.body.success).toBe(true);
                    expect(response.body.data.transcriptionId).toBe(`transcription-video-${index}`);
                });
                expect(mockTranscriptionService.startTranscription).toHaveBeenCalledTimes(5);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle service timeout gracefully', async () => {
            try {
                // Arrange
                const requestBody = {
                    userId: 'test-user-123',
                    videoId: 'long-video-id',
                    platform: 'youtube'
                };
                
                const timeoutError = new Error('Request timeout');
                timeoutError.statusCode = 408;
                mockTranscriptionService.startTranscription.mockRejectedValue(timeoutError);

                // Act
                const response = await request(app)
                    .post('/api/transcription')
                    .send(requestBody)
                    .expect(408);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Request timeout');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });
});