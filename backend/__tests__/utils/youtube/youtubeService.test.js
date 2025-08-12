/**
 * @fileoverview Tests for YouTube service utilities
 * @author Backend Team
 */

// Mock the youtubeDb module
jest.mock('../../../database/youtubeDb', () => ({
    createAnalysisJob: jest.fn(),
    updateAnalysisStatus: jest.fn(),
    storeChannelData: jest.fn(),
    storeVideoData: jest.fn(),
    getAnalysisJob: jest.fn(),
    getAnalysisResults: jest.fn(),
    getAnalysisSummary: jest.fn(),
    getVideosByAnalysis: jest.fn(),
    deleteAnalysisJob: jest.fn(),
    getAllCompletedAnalyses: jest.fn()
}));

const youtubeDb = require('../../../database/youtubeDb');
const youtubeService = require('../../../utils/youtube/youtubeService');

describe('YouTube Service', () => {
    beforeEach(() => {
        try {
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

    describe('createAnalysis', () => {
        it('should create YouTube analysis successfully', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const youtubeChannelId = 'UC_test_channel_id';
                const channelUrl = 'https://www.youtube.com/channel/UC_test_channel_id';
                const mockResult = { id: 1, analysisId };

                youtubeDb.createAnalysisJob.mockResolvedValue(mockResult);

                // Act
                const result = await youtubeService.createAnalysis(analysisId, youtubeChannelId, channelUrl);

                // Assert
                expect(result).toEqual({
                    success: true,
                    message: 'YouTube analysis job created successfully',
                    data: mockResult
                });

                expect(youtubeDb.createAnalysisJob).toHaveBeenCalledWith(
                    analysisId, youtubeChannelId, channelUrl
                );
                expect(youtubeDb.createAnalysisJob).toHaveBeenCalledTimes(1);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return error when required parameters are missing', async () => {
            try {
                // Test missing analysisId
                let result = await youtubeService.createAnalysis(null, 'channelId', 'url');
                expect(result.success).toBe(false);
                expect(result.message).toBe('Failed to create YouTube analysis job');
                expect(result.error).toBe('Analysis ID, channel ID, and channel URL are required');

                // Test missing youtubeChannelId
                result = await youtubeService.createAnalysis('analysisId', null, 'url');
                expect(result.success).toBe(false);

                // Test missing channelUrl
                result = await youtubeService.createAnalysis('analysisId', 'channelId', null);
                expect(result.success).toBe(false);

                expect(youtubeDb.createAnalysisJob).not.toHaveBeenCalled();

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle database errors gracefully', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const youtubeChannelId = 'UC_test_channel_id';
                const channelUrl = 'https://www.youtube.com/channel/UC_test_channel_id';
                const mockError = new Error('Database connection failed');

                youtubeDb.createAnalysisJob.mockRejectedValue(mockError);

                // Act
                const result = await youtubeService.createAnalysis(analysisId, youtubeChannelId, channelUrl);

                // Assert
                expect(result).toEqual({
                    success: false,
                    message: 'Failed to create YouTube analysis job',
                    error: 'Database connection failed'
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('updateAnalysis', () => {
        it('should update analysis status successfully', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const status = 'completed';
                const progress = 100;
                const mockResult = { updated: true };

                youtubeDb.updateAnalysisStatus.mockResolvedValue(mockResult);

                // Act
                const result = await youtubeService.updateAnalysis(analysisId, status, progress);

                // Assert
                expect(result).toEqual({
                    success: true,
                    message: 'YouTube analysis status updated successfully',
                    data: mockResult
                });

                expect(youtubeDb.updateAnalysisStatus).toHaveBeenCalledWith(
                    analysisId, status, progress, null
                );

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should update analysis status with error message', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const status = 'failed';
                const progress = 50;
                const errorMessage = 'Processing failed';
                const mockResult = { updated: true };

                youtubeDb.updateAnalysisStatus.mockResolvedValue(mockResult);

                // Act
                const result = await youtubeService.updateAnalysis(analysisId, status, progress, errorMessage);

                // Assert
                expect(result.success).toBe(true);
                expect(youtubeDb.updateAnalysisStatus).toHaveBeenCalledWith(
                    analysisId, status, progress, errorMessage
                );

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return error when required parameters are missing', async () => {
            try {
                // Test missing analysisId
                let result = await youtubeService.updateAnalysis(null, 'status', 50);
                expect(result.success).toBe(false);
                expect(result.error).toBe('Analysis ID and status are required');

                // Test missing status
                result = await youtubeService.updateAnalysis('analysisId', null, 50);
                expect(result.success).toBe(false);

                expect(youtubeDb.updateAnalysisStatus).not.toHaveBeenCalled();

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle database errors gracefully', async () => {
            try {
                // Arrange
                const mockError = new Error('Update failed');
                youtubeDb.updateAnalysisStatus.mockRejectedValue(mockError);

                // Act
                const result = await youtubeService.updateAnalysis('analysisId', 'status', 50);

                // Assert
                expect(result.success).toBe(false);
                expect(result.message).toBe('Failed to update YouTube analysis status');
                expect(result.error).toBe('Update failed');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('storeChannel', () => {
        it('should store channel data successfully', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const channelData = {
                    id: 'UC_test_channel_id',
                    title: 'Test Channel',
                    subscriberCount: 10000
                };
                const mockResult = { stored: true };

                youtubeDb.storeChannelData.mockResolvedValue(mockResult);

                // Act
                const result = await youtubeService.storeChannel(analysisId, channelData);

                // Assert
                expect(result).toEqual({
                    success: true,
                    message: 'YouTube channel data stored successfully',
                    data: mockResult
                });

                expect(youtubeDb.storeChannelData).toHaveBeenCalledWith(analysisId, channelData);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return error when required parameters are missing', async () => {
            try {
                // Test missing analysisId
                let result = await youtubeService.storeChannel(null, { data: 'test' });
                expect(result.success).toBe(false);

                // Test missing channelData
                result = await youtubeService.storeChannel('analysisId', null);
                expect(result.success).toBe(false);

                expect(youtubeDb.storeChannelData).not.toHaveBeenCalled();

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('storeVideos', () => {
        it('should store video data successfully', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const youtubeChannelId = 'UC_test_channel_id';
                const videoDataArray = [
                    { id: 'video1', title: 'Test Video 1' },
                    { id: 'video2', title: 'Test Video 2' }
                ];
                const mockResult = { stored: 2 };

                youtubeDb.storeVideoData.mockResolvedValue(mockResult);

                // Act
                const result = await youtubeService.storeVideos(analysisId, youtubeChannelId, videoDataArray);

                // Assert
                expect(result).toEqual({
                    success: true,
                    message: 'YouTube video data stored successfully',
                    data: mockResult
                });

                expect(youtubeDb.storeVideoData).toHaveBeenCalledWith(
                    analysisId, youtubeChannelId, videoDataArray
                );

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return error when videoDataArray is not an array', async () => {
            try {
                // Test with non-array value
                const result = await youtubeService.storeVideos('analysisId', 'channelId', 'not-an-array');
                
                expect(result.success).toBe(false);
                expect(result.error).toBe('Analysis ID, channel ID, and video data array are required');
                expect(youtubeDb.storeVideoData).not.toHaveBeenCalled();

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle empty video array', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const youtubeChannelId = 'UC_test_channel_id';
                const videoDataArray = [];
                const mockResult = { stored: 0 };

                youtubeDb.storeVideoData.mockResolvedValue(mockResult);

                // Act
                const result = await youtubeService.storeVideos(analysisId, youtubeChannelId, videoDataArray);

                // Assert
                expect(result.success).toBe(true);
                expect(youtubeDb.storeVideoData).toHaveBeenCalledWith(
                    analysisId, youtubeChannelId, videoDataArray
                );

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('getAnalysisJob', () => {
        it('should get analysis job successfully', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const mockJob = {
                    id: 1,
                    analysisId,
                    status: 'completed',
                    progress: 100
                };

                youtubeDb.getAnalysisJob.mockResolvedValue(mockJob);

                // Act
                const result = await youtubeService.getAnalysisJob(analysisId);

                // Assert
                expect(result).toEqual(mockJob);
                expect(youtubeDb.getAnalysisJob).toHaveBeenCalledWith(analysisId);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should throw error when analysisId is missing', async () => {
            try {
                // Act & Assert
                await expect(youtubeService.getAnalysisJob(null)).rejects.toThrow(
                    'Analysis ID is required'
                );

                expect(youtubeDb.getAnalysisJob).not.toHaveBeenCalled();

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle database errors and throw wrapped error', async () => {
            try {
                // Arrange
                const mockError = new Error('Database error');
                youtubeDb.getAnalysisJob.mockRejectedValue(mockError);

                // Act & Assert
                await expect(youtubeService.getAnalysisJob('analysisId')).rejects.toThrow(
                    'Failed to get YouTube analysis job: Database error'
                );

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('getAnalysis', () => {
        it('should get analysis with default pagination', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const mockResults = {
                    analysisId,
                    status: 'completed',
                    data: [],
                    pagination: { page: 1, limit: 50 }
                };

                youtubeDb.getAnalysisResults.mockResolvedValue(mockResults);

                // Act
                const result = await youtubeService.getAnalysis(analysisId);

                // Assert
                expect(result).toEqual({
                    success: true,
                    message: 'YouTube analysis retrieved successfully',
                    data: mockResults
                });

                expect(youtubeDb.getAnalysisResults).toHaveBeenCalledWith(analysisId, 1, 50);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should get analysis with custom pagination', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const page = 2;
                const limit = 25;
                const mockResults = {
                    analysisId,
                    status: 'completed',
                    data: [],
                    pagination: { page, limit }
                };

                youtubeDb.getAnalysisResults.mockResolvedValue(mockResults);

                // Act
                const result = await youtubeService.getAnalysis(analysisId, page, limit);

                // Assert
                expect(result.success).toBe(true);
                expect(youtubeDb.getAnalysisResults).toHaveBeenCalledWith(analysisId, page, limit);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return error when analysis not found', async () => {
            try {
                // Arrange
                youtubeDb.getAnalysisResults.mockResolvedValue(null);

                // Act
                const result = await youtubeService.getAnalysis('non-existent-id');

                // Assert
                expect(result).toEqual({
                    success: false,
                    message: 'YouTube analysis not found',
                    error: 'No analysis found with ID: non-existent-id'
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle database errors gracefully', async () => {
            try {
                // Arrange
                const mockError = new Error('Database query failed');
                youtubeDb.getAnalysisResults.mockRejectedValue(mockError);

                // Act
                const result = await youtubeService.getAnalysis('analysisId');

                // Assert
                expect(result.success).toBe(false);
                expect(result.message).toBe('Failed to get YouTube analysis');
                expect(result.error).toBe('Database query failed');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('getAnalysisSummary', () => {
        it('should get analysis summary successfully', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const mockSummary = {
                    analysisId,
                    totalVideos: 100,
                    averageViews: 5000,
                    topPerformingVideo: { id: 'video1', views: 50000 }
                };

                youtubeDb.getAnalysisSummary.mockResolvedValue(mockSummary);

                // Act
                const result = await youtubeService.getAnalysisSummary(analysisId);

                // Assert
                expect(result).toEqual({
                    success: true,
                    message: 'YouTube analysis summary retrieved successfully',
                    data: mockSummary
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return error when summary not found', async () => {
            try {
                // Arrange
                youtubeDb.getAnalysisSummary.mockResolvedValue(null);

                // Act
                const result = await youtubeService.getAnalysisSummary('non-existent-id');

                // Assert
                expect(result).toEqual({
                    success: false,
                    message: 'YouTube analysis summary not found',
                    error: 'No analysis found with ID: non-existent-id'
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('getVideos', () => {
        it('should get videos successfully with default options', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const mockVideos = [
                    { id: 'video1', title: 'Test Video 1' },
                    { id: 'video2', title: 'Test Video 2' }
                ];

                youtubeDb.getVideosByAnalysis.mockResolvedValue(mockVideos);

                // Act
                const result = await youtubeService.getVideos(analysisId);

                // Assert
                expect(result).toEqual({
                    success: true,
                    message: 'YouTube videos retrieved successfully',
                    data: mockVideos
                });

                expect(youtubeDb.getVideosByAnalysis).toHaveBeenCalledWith(analysisId, {});

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should get videos with custom options', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const options = { limit: 10, sortBy: 'views' };
                const mockVideos = [{ id: 'video1', title: 'Test Video 1' }];

                youtubeDb.getVideosByAnalysis.mockResolvedValue(mockVideos);

                // Act
                const result = await youtubeService.getVideos(analysisId, options);

                // Assert
                expect(result.success).toBe(true);
                expect(youtubeDb.getVideosByAnalysis).toHaveBeenCalledWith(analysisId, options);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('deleteAnalysis', () => {
        it('should delete analysis successfully', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const mockResult = { deleted: true };

                youtubeDb.deleteAnalysisJob.mockResolvedValue(mockResult);

                // Act
                const result = await youtubeService.deleteAnalysis(analysisId);

                // Assert
                expect(result).toEqual({
                    success: true,
                    message: 'YouTube analysis deleted successfully',
                    data: mockResult
                });

                expect(youtubeDb.deleteAnalysisJob).toHaveBeenCalledWith(analysisId);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return error when analysisId is missing', async () => {
            try {
                // Act
                const result = await youtubeService.deleteAnalysis(null);

                // Assert
                expect(result.success).toBe(false);
                expect(result.error).toBe('Analysis ID is required');
                expect(youtubeDb.deleteAnalysisJob).not.toHaveBeenCalled();

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('getAllCompletedAnalyses', () => {
        it('should get all completed analyses successfully', async () => {
            try {
                // Arrange
                const mockAnalyses = [
                    { analysisId: 'analysis1', status: 'completed' },
                    { analysisId: 'analysis2', status: 'completed' }
                ];

                youtubeDb.getAllCompletedAnalyses.mockResolvedValue(mockAnalyses);

                // Act
                const result = await youtubeService.getAllCompletedAnalyses();

                // Assert
                expect(result).toEqual({
                    success: true,
                    message: 'YouTube analyses retrieved successfully',
                    data: mockAnalyses
                });

                expect(youtubeDb.getAllCompletedAnalyses).toHaveBeenCalledWith({});

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should get all completed analyses with options', async () => {
            try {
                // Arrange
                const options = { limit: 10, offset: 0 };
                const mockAnalyses = [{ analysisId: 'analysis1', status: 'completed' }];

                youtubeDb.getAllCompletedAnalyses.mockResolvedValue(mockAnalyses);

                // Act
                const result = await youtubeService.getAllCompletedAnalyses(options);

                // Assert
                expect(result.success).toBe(true);
                expect(youtubeDb.getAllCompletedAnalyses).toHaveBeenCalledWith(options);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle database errors gracefully', async () => {
            try {
                // Arrange
                const mockError = new Error('Database connection failed');
                youtubeDb.getAllCompletedAnalyses.mockRejectedValue(mockError);

                // Act
                const result = await youtubeService.getAllCompletedAnalyses();

                // Assert
                expect(result.success).toBe(false);
                expect(result.message).toBe('Failed to get YouTube analyses');
                expect(result.error).toBe('Database connection failed');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('Edge Cases and Error Scenarios', () => {
        it('should handle empty string parameters as invalid', async () => {
            try {
                // Test createAnalysis with empty strings
                let result = await youtubeService.createAnalysis('', 'channelId', 'url');
                expect(result.success).toBe(false);

                // Test updateAnalysis with empty strings
                result = await youtubeService.updateAnalysis('analysisId', '', 50);
                expect(result.success).toBe(false);

                // Test storeChannel with empty string
                result = await youtubeService.storeChannel('', { data: 'test' });
                expect(result.success).toBe(false);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle undefined parameters gracefully', async () => {
            try {
                // Test with undefined values
                const result = await youtubeService.createAnalysis(undefined, undefined, undefined);
                
                expect(result.success).toBe(false);
                expect(result.error).toBe('Analysis ID, channel ID, and channel URL are required');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle very large data objects', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const largeChannelData = {
                    id: 'UC_test_channel_id',
                    title: 'x'.repeat(10000), // Very large title
                    description: 'y'.repeat(50000), // Very large description
                    tags: new Array(1000).fill('tag') // Many tags
                };

                youtubeDb.storeChannelData.mockResolvedValue({ stored: true });

                // Act
                const result = await youtubeService.storeChannel(analysisId, largeChannelData);

                // Assert
                expect(result.success).toBe(true);
                expect(youtubeDb.storeChannelData).toHaveBeenCalledWith(analysisId, largeChannelData);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle concurrent operations', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                youtubeDb.getAnalysisJob.mockResolvedValue({ id: 1, analysisId });

                // Act - run multiple concurrent operations
                const promises = [
                    youtubeService.getAnalysisJob(analysisId),
                    youtubeService.getAnalysisJob(analysisId),
                    youtubeService.getAnalysisJob(analysisId)
                ];

                const results = await Promise.all(promises);

                // Assert
                results.forEach(result => {
                    expect(result.analysisId).toBe(analysisId);
                });

                expect(youtubeDb.getAnalysisJob).toHaveBeenCalledTimes(3);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle special characters in parameters', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis_$@#123';
                const channelData = {
                    id: 'UC_test_channel_id',
                    title: 'Channel with émojis 🎥 and spëcial chars',
                    description: 'Description with\nnewlines\tand\ttabs'
                };

                youtubeDb.storeChannelData.mockResolvedValue({ stored: true });

                // Act
                const result = await youtubeService.storeChannel(analysisId, channelData);

                // Assert
                expect(result.success).toBe(true);
                expect(youtubeDb.storeChannelData).toHaveBeenCalledWith(analysisId, channelData);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });
});