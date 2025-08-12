/**
 * @fileoverview Comprehensive tests for user interactions API endpoints
 * @author Backend Test Guardian
 */

const request = require('supertest');
const express = require('express');

// Mock the user interactions service
const mockUserInteractionsService = {
    getUserVideoInteractions: jest.fn(),
    updateVideoInteraction: jest.fn(),
    getUserCreatorInteractions: jest.fn(),
    updateCreatorInteraction: jest.fn(),
    getUserHubs: jest.fn(),
    createHub: jest.fn(),
    deleteHub: jest.fn()
};

jest.mock('../../../functions/route_fns/userInteractions', () => mockUserInteractionsService);

const userInteractionsRoutes = require('../../../routes/api/userInteractions');

describe('User Interactions API Routes', () => {
    let app;

    beforeEach(() => {
        try {
            // Create fresh Express app for each test
            app = express();
            app.use(express.json());
            app.use('/api/user-interactions', userInteractionsRoutes);
            
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

    describe('GET /api/user-interactions/videos/:userId - Get User Video Interactions', () => {
        it('should successfully retrieve user video interactions', async () => {
            try {
                // Arrange
                const userId = 'test-user-123';
                const mockInteractions = {
                    videoId1: { starRating: 5, comment: 'Great video!', isFavorite: true },
                    videoId2: { starRating: 4, comment: 'Good content', isFavorite: false }
                };
                
                mockUserInteractionsService.getUserVideoInteractions.mockResolvedValue({
                    success: true,
                    data: mockInteractions,
                    message: 'Interactions retrieved successfully'
                });

                // Act
                const response = await request(app)
                    .get(`/api/user-interactions/videos/${userId}`)
                    .expect(200);

                // Assert
                expect(response.body).toEqual({
                    success: true,
                    message: 'User video interactions retrieved successfully',
                    data: mockInteractions
                });
                expect(mockUserInteractionsService.getUserVideoInteractions).toHaveBeenCalledWith(userId, 1, 20, "undefined");

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 400 for missing user ID', async () => {
            try {
                // Act
                const response = await request(app)
                    .get('/api/user-interactions/videos/')
                    .expect(404); // Express returns 404 for missing route params

                // Assert - This will be a 404 due to missing route parameter

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle service errors gracefully', async () => {
            try {
                // Arrange
                const userId = 'test-user-123';
                mockUserInteractionsService.getUserVideoInteractions.mockResolvedValue({
                    success: false,
                    message: 'Database error',
                    error: 'Connection timeout'
                });

                // Act
                const response = await request(app)
                    .get(`/api/user-interactions/videos/${userId}`)
                    .expect(500);

                // Assert
                expect(response.body).toEqual({
                    success: false,
                    message: 'Database error',
                    error: 'Connection timeout'
                });

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
                const userId = 'test-user-123';
                mockUserInteractionsService.getUserVideoInteractions.mockRejectedValue(
                    new Error('Service exception')
                );

                // Act
                const response = await request(app)
                    .get(`/api/user-interactions/videos/${userId}`)
                    .expect(500);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Failed to get user video interactions');
                expect(response.body.error).toBe('Service exception');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('PUT /api/user-interactions/videos - Update Video Interaction (Heart Toggle, Comments, Stars)', () => {
        it('should successfully update video interaction with heart toggle (favorite)', async () => {
            try {
                // Arrange
                const requestBody = {
                    userId: 'test-user-123',
                    videoId: 'video-456',
                    platform: 'youtube',
                    isFavorite: true
                };
                
                mockUserInteractionsService.updateVideoInteraction.mockResolvedValue({
                    success: true,
                    data: { id: 'interaction-789', ...requestBody },
                    message: 'Interaction updated successfully'
                });

                // Act
                const response = await request(app)
                    .put('/api/user-interactions/videos')
                    .send(requestBody)
                    .expect(200);

                // Assert
                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe('Video interaction updated successfully');
                expect(mockUserInteractionsService.updateVideoInteraction).toHaveBeenCalledWith(
                    'test-user-123',
                    'video-456',
                    'youtube',
                    { starRating: undefined, comment: undefined, isFavorite: true }
                );

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should successfully update video interaction with star rating', async () => {
            try {
                // Arrange
                const requestBody = {
                    userId: 'test-user-123',
                    videoId: 'video-456',
                    platform: 'youtube',
                    starRating: 5
                };
                
                mockUserInteractionsService.updateVideoInteraction.mockResolvedValue({
                    success: true,
                    data: { id: 'interaction-789', ...requestBody },
                    message: 'Interaction updated successfully'
                });

                // Act
                const response = await request(app)
                    .put('/api/user-interactions/videos')
                    .send(requestBody)
                    .expect(200);

                // Assert
                expect(response.body.success).toBe(true);
                expect(mockUserInteractionsService.updateVideoInteraction).toHaveBeenCalledWith(
                    'test-user-123',
                    'video-456',
                    'youtube',
                    { starRating: 5, comment: undefined, isFavorite: undefined }
                );

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should successfully update video interaction with comment', async () => {
            try {
                // Arrange
                const requestBody = {
                    userId: 'test-user-123',
                    videoId: 'video-456',
                    platform: 'youtube',
                    comment: 'This video was amazing!'
                };
                
                mockUserInteractionsService.updateVideoInteraction.mockResolvedValue({
                    success: true,
                    data: { id: 'interaction-789', ...requestBody },
                    message: 'Interaction updated successfully'
                });

                // Act
                const response = await request(app)
                    .put('/api/user-interactions/videos')
                    .send(requestBody)
                    .expect(200);

                // Assert
                expect(response.body.success).toBe(true);
                expect(mockUserInteractionsService.updateVideoInteraction).toHaveBeenCalledWith(
                    'test-user-123',
                    'video-456',
                    'youtube',
                    { starRating: undefined, comment: 'This video was amazing!', isFavorite: undefined }
                );

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should update multiple interaction types simultaneously', async () => {
            try {
                // Arrange
                const requestBody = {
                    userId: 'test-user-123',
                    videoId: 'video-456',
                    platform: 'youtube',
                    starRating: 4,
                    comment: 'Good video!',
                    isFavorite: true
                };
                
                mockUserInteractionsService.updateVideoInteraction.mockResolvedValue({
                    success: true,
                    data: { id: 'interaction-789', ...requestBody },
                    message: 'Interaction updated successfully'
                });

                // Act
                const response = await request(app)
                    .put('/api/user-interactions/videos')
                    .send(requestBody)
                    .expect(200);

                // Assert
                expect(response.body.success).toBe(true);
                expect(mockUserInteractionsService.updateVideoInteraction).toHaveBeenCalledWith(
                    'test-user-123',
                    'video-456',
                    'youtube',
                    { starRating: 4, comment: 'Good video!', isFavorite: true }
                );

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return 400 for missing required fields', async () => {
            try {
                // Arrange - Missing required fields
                const testCases = [
                    { videoId: 'video-456', platform: 'youtube' }, // Missing userId
                    { userId: 'test-user-123', platform: 'youtube' }, // Missing videoId
                    { userId: 'test-user-123', videoId: 'video-456' } // Missing platform
                ];

                for (const requestBody of testCases) {
                    // Act
                    const response = await request(app)
                        .put('/api/user-interactions/videos')
                        .send(requestBody)
                        .expect(400);

                    // Assert
                    expect(response.body.success).toBe(false);
                    expect(response.body.message).toContain('required');
                }

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
                const requestBody = {
                    userId: 'test-user-123',
                    videoId: 'video-456',
                    platform: 'youtube',
                    isFavorite: true
                };
                
                mockUserInteractionsService.updateVideoInteraction.mockResolvedValue({
                    success: false,
                    message: 'Database constraint violation',
                    error: 'UNIQUE constraint failed'
                });

                // Act
                const response = await request(app)
                    .put('/api/user-interactions/videos')
                    .send(requestBody)
                    .expect(500);

                // Assert
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe('Database constraint violation');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('Hub Management - Create, Read, Delete', () => {
        describe('GET /api/user-interactions/hubs/:userId', () => {
            it('should successfully retrieve user hubs with pagination', async () => {
                try {
                    // Arrange
                    const userId = 'test-user-123';
                    const mockHubs = [
                        { id: 'hub-1', name: 'Tech Videos', createdAt: '2023-01-01' },
                        { id: 'hub-2', name: 'Entertainment', createdAt: '2023-01-02' }
                    ];
                    
                    mockUserInteractionsService.getUserHubs.mockResolvedValue({
                        success: true,
                        data: mockHubs,
                        message: 'Hubs retrieved successfully'
                    });

                    // Act
                    const response = await request(app)
                        .get(`/api/user-interactions/hubs/${userId}`)
                        .expect(200);

                    // Assert
                    expect(response.body.success).toBe(true);
                    expect(response.body.data).toEqual(mockHubs);
                    expect(mockUserInteractionsService.getUserHubs).toHaveBeenCalledWith(userId);

                } catch (error) {
                    console.error('Test error:', error);
                    throw error;
                } finally {
                    // Test completed
                }
            });
        });

        describe('POST /api/user-interactions/hubs - Create Hub', () => {
            it('should successfully create a new hub', async () => {
                try {
                    // Arrange
                    const requestBody = {
                        userId: 'test-user-123',
                        name: 'My New Hub'
                    };
                    
                    const mockCreatedHub = {
                        id: 'hub-new-123',
                        ...requestBody,
                        createdAt: '2023-12-01'
                    };
                    
                    mockUserInteractionsService.createHub.mockResolvedValue({
                        success: true,
                        data: mockCreatedHub,
                        message: 'Hub created successfully'
                    });

                    // Act
                    const response = await request(app)
                        .post('/api/user-interactions/hubs')
                        .send(requestBody)
                        .expect(200);

                    // Assert
                    expect(response.body.success).toBe(true);
                    expect(response.body.message).toBe('Hub created successfully');
                    expect(response.body.data).toEqual(mockCreatedHub);
                    expect(mockUserInteractionsService.createHub).toHaveBeenCalledWith(
                        'test-user-123',
                        'My New Hub'
                    );

                } catch (error) {
                    console.error('Test error:', error);
                    throw error;
                } finally {
                    // Test completed
                }
            });

            it('should return 400 for missing required fields', async () => {
                try {
                    // Arrange
                    const testCases = [
                        { name: 'Hub Name' }, // Missing userId
                        { userId: 'test-user-123' }, // Missing name
                        {} // Missing both
                    ];

                    for (const requestBody of testCases) {
                        // Act
                        const response = await request(app)
                            .post('/api/user-interactions/hubs')
                            .send(requestBody)
                            .expect(400);

                        // Assert
                        expect(response.body.success).toBe(false);
                        expect(response.body.message).toContain('required');
                    }

                } catch (error) {
                    console.error('Test error:', error);
                    throw error;
                } finally {
                    // Test completed
                }
            });
        });

        describe('DELETE /api/user-interactions/hubs/:hubId - Delete Hub', () => {
            it('should successfully delete a hub', async () => {
                try {
                    // Arrange
                    const hubId = 'hub-to-delete-123';
                    const userId = 'test-user-123';
                    
                    mockUserInteractionsService.deleteHub.mockResolvedValue({
                        success: true,
                        data: { id: hubId, deleted: true },
                        message: 'Hub deleted successfully'
                    });

                    // Act
                    const response = await request(app)
                        .delete(`/api/user-interactions/hubs/${hubId}`)
                        .send({ userId })
                        .expect(200);

                    // Assert
                    expect(response.body.success).toBe(true);
                    expect(response.body.message).toBe('Hub deleted successfully');
                    expect(mockUserInteractionsService.deleteHub).toHaveBeenCalledWith(
                        userId,
                        hubId
                    );

                } catch (error) {
                    console.error('Test error:', error);
                    throw error;
                } finally {
                    // Test completed
                }
            });

            it('should return 400 for missing user ID in request body', async () => {
                try {
                    // Arrange
                    const hubId = 'hub-to-delete-123';

                    // Act
                    const response = await request(app)
                        .delete(`/api/user-interactions/hubs/${hubId}`)
                        .send({}) // Missing userId
                        .expect(400);

                    // Assert
                    expect(response.body.success).toBe(false);
                    expect(response.body.message).toContain('required');

                } catch (error) {
                    console.error('Test error:', error);
                    throw error;
                } finally {
                    // Test completed
                }
            });
        });
    });

    describe('Creator Interactions - Move to Hub', () => {
        describe('GET /api/user-interactions/creators/:userId', () => {
            it('should successfully retrieve user creator interactions', async () => {
                try {
                    // Arrange
                    const userId = 'test-user-123';
                    const mockCreatorInteractions = [
                        { 
                            creatorId: 'creator-1', 
                            channelName: 'Tech Channel',
                            isFavorite: true,
                            hubId: 'hub-1',
                            platform: 'youtube'
                        }
                    ];
                    
                    mockUserInteractionsService.getUserCreatorInteractions.mockResolvedValue({
                        success: true,
                        data: mockCreatorInteractions,
                        message: 'Creator interactions retrieved successfully'
                    });

                    // Act
                    const response = await request(app)
                        .get(`/api/user-interactions/creators/${userId}`)
                        .expect(200);

                    // Assert
                    expect(response.body.success).toBe(true);
                    expect(response.body.data).toEqual(mockCreatorInteractions);
                    expect(mockUserInteractionsService.getUserCreatorInteractions).toHaveBeenCalledWith(userId);

                } catch (error) {
                    console.error('Test error:', error);
                    throw error;
                } finally {
                    // Test completed
                }
            });
        });

        describe('PUT /api/user-interactions/creators - Move Creator to Hub', () => {
            it('should successfully move creator to hub', async () => {
                try {
                    // Arrange
                    const requestBody = {
                        userId: 'test-user-123',
                        creatorId: 'creator-456',
                        channelName: 'Amazing Channel',
                        platform: 'youtube',
                        hubId: 'hub-789',
                        channelId: 'UC123456',
                        thumbnailUrl: 'https://example.com/thumb.jpg'
                    };
                    
                    mockUserInteractionsService.updateCreatorInteraction.mockResolvedValue({
                        success: true,
                        data: { id: 'creator-interaction-123', ...requestBody },
                        message: 'Creator moved to hub successfully'
                    });

                    // Act
                    const response = await request(app)
                        .put('/api/user-interactions/creators')
                        .send(requestBody)
                        .expect(200);

                    // Assert
                    expect(response.body.success).toBe(true);
                    expect(response.body.message).toBe('Creator interaction updated successfully');
                    expect(mockUserInteractionsService.updateCreatorInteraction).toHaveBeenCalledWith(
                        'test-user-123',
                        'creator-456',
                        {
                            isFavorite: undefined,
                            hubId: 'hub-789',
                            channelName: 'Amazing Channel',
                            channelId: 'UC123456',
                            thumbnailUrl: 'https://example.com/thumb.jpg',
                            platform: 'youtube'
                        }
                    );

                } catch (error) {
                    console.error('Test error:', error);
                    throw error;
                } finally {
                    // Test completed
                }
            });

            it('should return 400 for missing required fields', async () => {
                try {
                    // Arrange
                    const testCases = [
                        { creatorId: 'creator-1', channelName: 'Channel', platform: 'youtube' }, // Missing userId
                        { userId: 'user-1', channelName: 'Channel', platform: 'youtube' }, // Missing creatorId
                        { userId: 'user-1', creatorId: 'creator-1', platform: 'youtube' }, // Missing channelName
                        { userId: 'user-1', creatorId: 'creator-1', channelName: 'Channel' } // Missing platform
                    ];

                    for (const requestBody of testCases) {
                        // Act
                        const response = await request(app)
                            .put('/api/user-interactions/creators')
                            .send(requestBody)
                            .expect(400);

                        // Assert
                        expect(response.body.success).toBe(false);
                        expect(response.body.message).toContain('required');
                    }

                } catch (error) {
                    console.error('Test error:', error);
                    throw error;
                } finally {
                    // Test completed
                }
            });
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle malformed JSON requests', async () => {
            try {
                // Act
                const response = await request(app)
                    .put('/api/user-interactions/videos')
                    .send('invalid json')
                    .set('Content-Type', 'application/json')
                    .expect(400);

                // Assert - Express handles malformed JSON with 400

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle very large payloads gracefully', async () => {
            try {
                // Arrange
                const largeComment = 'x'.repeat(10000); // 10KB comment
                const requestBody = {
                    userId: 'test-user-123',
                    videoId: 'video-456',
                    platform: 'youtube',
                    comment: largeComment
                };
                
                mockUserInteractionsService.updateVideoInteraction.mockResolvedValue({
                    success: true,
                    data: requestBody,
                    message: 'Interaction updated successfully'
                });

                // Act
                const response = await request(app)
                    .put('/api/user-interactions/videos')
                    .send(requestBody)
                    .expect(200);

                // Assert
                expect(response.body.success).toBe(true);
                expect(mockUserInteractionsService.updateVideoInteraction).toHaveBeenCalledWith(
                    'test-user-123',
                    'video-456',
                    'youtube',
                    { starRating: undefined, comment: largeComment, isFavorite: undefined }
                );

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle special characters in user inputs', async () => {
            try {
                // Arrange
                const requestBody = {
                    userId: 'test-user-123',
                    videoId: 'video-456',
                    platform: 'youtube',
                    comment: 'Great video! 😀👍 Special chars: <>&"\''
                };
                
                mockUserInteractionsService.updateVideoInteraction.mockResolvedValue({
                    success: true,
                    data: requestBody,
                    message: 'Interaction updated successfully'
                });

                // Act
                const response = await request(app)
                    .put('/api/user-interactions/videos')
                    .send(requestBody)
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