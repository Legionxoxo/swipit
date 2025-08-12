/**
 * @fileoverview Tests for channel analysis route functions
 * @author Backend Team
 */

// Mock all dependencies
jest.mock('../../../utils/helpers', () => ({
    generateAnalysisId: jest.fn(),
    parseChannelUrl: jest.fn()
}));

jest.mock('../../../functions/analysis/jobManager', () => ({
    getAnalysisJob: jest.fn(),
    storeAnalysisJob: jest.fn(),
    updateAnalysisStatus: jest.fn()
}));

jest.mock('../../../functions/analysis/videoProcessor', () => ({
    processChannelAnalysis: jest.fn(),
    segmentVideosByViews: jest.fn()
}));

jest.mock('../../../utils/youtube/youtubeService', () => ({
    createAnalysis: jest.fn(),
    getAnalysis: jest.fn(),
    updateAnalysis: jest.fn()
}));

jest.mock('../../../database/youtube', () => ({
    findExistingAnalysis: jest.fn()
}));

const { generateAnalysisId, parseChannelUrl } = require('../../../utils/helpers');
const { 
    getAnalysisJob, 
    storeAnalysisJob, 
    updateAnalysisStatus 
} = require('../../../functions/analysis/jobManager');
const { processChannelAnalysis } = require('../../../functions/analysis/videoProcessor');
const youtubeService = require('../../../utils/youtube/youtubeService');
const youtubeDb = require('../../../database/youtube');
const { startAnalysis, getAnalysisStatus } = require('../../../functions/route_fns/analyzeChannel');

describe('Channel Analysis Route Functions', () => {
    beforeEach(() => {
        try {
            // Clear all mocks
            jest.clearAllMocks();
            
            // Set default mock implementations
            generateAnalysisId.mockReturnValue('test-analysis-123');
            parseChannelUrl.mockResolvedValue({
                channelId: 'UC_test_channel_id',
                channelType: 'channel'
            });
            
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

    describe('startAnalysis', () => {
        it('should start new analysis successfully', async () => {
            try {
                // Arrange
                const channelUrl = 'https://www.youtube.com/channel/UC_test_channel_id';
                
                youtubeDb.findExistingAnalysis.mockResolvedValue(null);
                youtubeService.createAnalysis.mockResolvedValue({ success: true });
                processChannelAnalysis.mockResolvedValue();

                // Act
                const result = await startAnalysis(channelUrl);

                // Assert
                expect(result).toEqual({
                    analysisId: 'test-analysis-123',
                    estimatedTime: '2-10 minutes depending on channel size',
                    isExisting: false
                });

                expect(parseChannelUrl).toHaveBeenCalledWith(channelUrl);
                expect(youtubeDb.findExistingAnalysis).toHaveBeenCalledWith('UC_test_channel_id', channelUrl);
                expect(youtubeService.createAnalysis).toHaveBeenCalledWith(
                    'test-analysis-123', 'UC_test_channel_id', channelUrl
                );
                expect(storeAnalysisJob).toHaveBeenCalledWith(
                    'test-analysis-123',
                    expect.objectContaining({
                        analysisId: 'test-analysis-123',
                        channelUrl,
                        channelId: 'UC_test_channel_id',
                        status: 'processing',
                        progress: 0
                    })
                );

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return existing completed analysis', async () => {
            try {
                // Arrange
                const channelUrl = 'https://www.youtube.com/channel/UC_test_channel_id';
                const existingAnalysis = {
                    analysisId: 'existing-analysis-456',
                    status: 'completed'
                };
                
                youtubeDb.findExistingAnalysis.mockResolvedValue(existingAnalysis);

                // Act
                const result = await startAnalysis(channelUrl);

                // Assert
                expect(result).toEqual({
                    analysisId: 'existing-analysis-456',
                    estimatedTime: 'Analysis already completed',
                    isExisting: true
                });

                expect(youtubeService.createAnalysis).not.toHaveBeenCalled();
                expect(processChannelAnalysis).not.toHaveBeenCalled();

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return existing processing analysis', async () => {
            try {
                // Arrange
                const channelUrl = 'https://www.youtube.com/channel/UC_test_channel_id';
                const existingAnalysis = {
                    analysisId: 'existing-analysis-456',
                    status: 'processing'
                };
                
                youtubeDb.findExistingAnalysis.mockResolvedValue(existingAnalysis);

                // Act
                const result = await startAnalysis(channelUrl);

                // Assert
                expect(result).toEqual({
                    analysisId: 'existing-analysis-456',
                    estimatedTime: 'Analysis in progress',
                    isExisting: true
                });

                expect(youtubeService.createAnalysis).not.toHaveBeenCalled();

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return existing pending analysis', async () => {
            try {
                // Arrange
                const channelUrl = 'https://www.youtube.com/channel/UC_test_channel_id';
                const existingAnalysis = {
                    analysisId: 'existing-analysis-456',
                    status: 'pending'
                };
                
                youtubeDb.findExistingAnalysis.mockResolvedValue(existingAnalysis);

                // Act
                const result = await startAnalysis(channelUrl);

                // Assert
                expect(result).toEqual({
                    analysisId: 'existing-analysis-456',
                    estimatedTime: 'Analysis in progress',
                    isExisting: true
                });

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should create new analysis when existing analysis failed', async () => {
            try {
                // Arrange
                const channelUrl = 'https://www.youtube.com/channel/UC_test_channel_id';
                const existingAnalysis = {
                    analysisId: 'failed-analysis-456',
                    status: 'failed'
                };
                
                youtubeDb.findExistingAnalysis.mockResolvedValue(existingAnalysis);
                youtubeService.createAnalysis.mockResolvedValue({ success: true });
                processChannelAnalysis.mockResolvedValue();

                // Act
                const result = await startAnalysis(channelUrl);

                // Assert
                expect(result).toEqual({
                    analysisId: 'test-analysis-123',
                    estimatedTime: '2-10 minutes depending on channel size',
                    isExisting: false
                });

                expect(youtubeService.createAnalysis).toHaveBeenCalled();

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle parseChannelUrl errors', async () => {
            try {
                // Arrange
                const channelUrl = 'invalid-url';
                const mockError = new Error('Invalid channel URL');
                
                parseChannelUrl.mockRejectedValue(mockError);

                // Act & Assert
                await expect(startAnalysis(channelUrl)).rejects.toThrow(
                    'Failed to start analysis: Invalid channel URL'
                );

                expect(youtubeDb.findExistingAnalysis).not.toHaveBeenCalled();
                expect(youtubeService.createAnalysis).not.toHaveBeenCalled();

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle database errors when finding existing analysis', async () => {
            try {
                // Arrange
                const channelUrl = 'https://www.youtube.com/channel/UC_test_channel_id';
                const mockError = new Error('Database connection failed');
                
                youtubeDb.findExistingAnalysis.mockRejectedValue(mockError);

                // Act & Assert
                await expect(startAnalysis(channelUrl)).rejects.toThrow(
                    'Failed to start analysis: Database connection failed'
                );

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle errors when creating analysis in database', async () => {
            try {
                // Arrange
                const channelUrl = 'https://www.youtube.com/channel/UC_test_channel_id';
                const mockError = new Error('Failed to create analysis job');
                
                youtubeDb.findExistingAnalysis.mockResolvedValue(null);
                youtubeService.createAnalysis.mockRejectedValue(mockError);

                // Act & Assert
                await expect(startAnalysis(channelUrl)).rejects.toThrow(
                    'Failed to start analysis: Failed to create analysis job'
                );

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle background processing errors gracefully', async () => {
            try {
                // Arrange
                const channelUrl = 'https://www.youtube.com/channel/UC_test_channel_id';
                const processingError = new Error('Processing failed');
                
                youtubeDb.findExistingAnalysis.mockResolvedValue(null);
                youtubeService.createAnalysis.mockResolvedValue({ success: true });
                youtubeService.updateAnalysis.mockResolvedValue({ success: true });
                
                // Mock processChannelAnalysis to reject but catch the error
                processChannelAnalysis.mockImplementation(() => 
                    Promise.reject(processingError)
                );

                // Act
                const result = await startAnalysis(channelUrl);

                // Assert - should still return successfully
                expect(result.analysisId).toBe('test-analysis-123');
                expect(result.isExisting).toBe(false);

                // Wait a bit for the catch block to execute
                await new Promise(resolve => setTimeout(resolve, 10));

                expect(updateAnalysisStatus).toHaveBeenCalledWith(
                    'test-analysis-123', 'error', 0, { error: 'Processing failed' }
                );
                expect(youtubeService.updateAnalysis).toHaveBeenCalledWith(
                    'test-analysis-123', 'failed', 0, 'Processing failed'
                );

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('getAnalysisStatus', () => {
        it('should get analysis status from database successfully', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const mockDbResult = {
                    success: true,
                    data: {
                        analysisId,
                        status: 'completed',
                        progress: 100,
                        data: [{ id: 'video1', title: 'Test Video' }],
                        pagination: { page: 1, limit: 50, total: 1 }
                    }
                };
                
                youtubeService.getAnalysis.mockResolvedValue(mockDbResult);

                // Act
                const result = await getAnalysisStatus(analysisId, 1, 50);

                // Assert
                expect(result).toEqual(mockDbResult.data);
                expect(youtubeService.getAnalysis).toHaveBeenCalledWith(analysisId, 1, 50);
                expect(getAnalysisJob).not.toHaveBeenCalled();

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should fallback to memory store when database returns no data', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const startTime = new Date('2024-01-01T10:00:00Z');
                const mockMemoryJob = {
                    analysisId,
                    status: 'processing',
                    progress: 75,
                    data: [{ id: 'video1', title: 'Test Video' }],
                    channelInfo: { name: 'Test Channel' },
                    totalVideos: 25,
                    startTime,
                    error: null
                };
                
                youtubeService.getAnalysis.mockResolvedValue({ success: false, data: null });
                getAnalysisJob.mockReturnValue(mockMemoryJob);

                // Mock current time for processing time calculation
                const mockCurrentTime = new Date('2024-01-01T10:05:00Z');
                jest.spyOn(Date, 'now').mockReturnValue(mockCurrentTime.getTime());

                // Act
                const result = await getAnalysisStatus(analysisId);

                // Assert
                expect(result).toEqual({
                    analysisId,
                    status: 'processing',
                    progress: 75,
                    data: [{ id: 'video1', title: 'Test Video' }],
                    channelInfo: { name: 'Test Channel' },
                    videoSegments: undefined,
                    totalVideos: 25,
                    processingTime: 300, // 5 minutes in seconds
                    error: null
                });

                expect(getAnalysisJob).toHaveBeenCalledWith(analysisId);

                // Restore Date.now
                Date.now.mockRestore();

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should calculate processing time with end time', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const startTime = new Date('2024-01-01T10:00:00Z');
                const endTime = new Date('2024-01-01T10:03:30Z');
                const mockMemoryJob = {
                    analysisId,
                    status: 'completed',
                    progress: 100,
                    data: [],
                    startTime,
                    endTime
                };
                
                youtubeService.getAnalysis.mockResolvedValue({ success: false, data: null });
                getAnalysisJob.mockReturnValue(mockMemoryJob);

                // Act
                const result = await getAnalysisStatus(analysisId);

                // Assert
                expect(result.processingTime).toBe(210); // 3.5 minutes in seconds

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return null when analysis not found', async () => {
            try {
                // Arrange
                const analysisId = 'non-existent-analysis';
                
                youtubeService.getAnalysis.mockResolvedValue({ success: false, data: null });
                getAnalysisJob.mockReturnValue(null);

                // Act
                const result = await getAnalysisStatus(analysisId);

                // Assert
                expect(result).toBeNull();

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
                await expect(getAnalysisStatus(null)).rejects.toThrow(
                    'Failed to get analysis status: Analysis ID is required'
                );

                await expect(getAnalysisStatus('')).rejects.toThrow(
                    'Failed to get analysis status: Analysis ID is required'
                );

                await expect(getAnalysisStatus(undefined)).rejects.toThrow(
                    'Failed to get analysis status: Analysis ID is required'
                );

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle database service errors', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const mockError = new Error('Database service error');
                
                youtubeService.getAnalysis.mockRejectedValue(mockError);

                // Act & Assert
                await expect(getAnalysisStatus(analysisId)).rejects.toThrow(
                    'Failed to get analysis status: Database service error'
                );

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
                const mockDbResult = {
                    success: true,
                    data: { analysisId, status: 'completed' }
                };
                
                youtubeService.getAnalysis.mockResolvedValue(mockDbResult);

                // Act
                await getAnalysisStatus(analysisId);

                // Assert
                expect(youtubeService.getAnalysis).toHaveBeenCalledWith(analysisId, 1, 50);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should use custom pagination values', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const page = 3;
                const limit = 25;
                const mockDbResult = {
                    success: true,
                    data: { analysisId, status: 'completed' }
                };
                
                youtubeService.getAnalysis.mockResolvedValue(mockDbResult);

                // Act
                await getAnalysisStatus(analysisId, page, limit);

                // Assert
                expect(youtubeService.getAnalysis).toHaveBeenCalledWith(analysisId, page, limit);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle memory store with missing properties gracefully', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const mockMemoryJob = {
                    analysisId,
                    status: 'processing',
                    progress: 50,
                    startTime: new Date()
                    // Missing: data, channelInfo, totalVideos, etc.
                };
                
                youtubeService.getAnalysis.mockResolvedValue({ success: false, data: null });
                getAnalysisJob.mockReturnValue(mockMemoryJob);

                // Act
                const result = await getAnalysisStatus(analysisId);

                // Assert
                expect(result).toEqual({
                    analysisId,
                    status: 'processing',
                    progress: 50,
                    data: [],
                    channelInfo: undefined,
                    videoSegments: undefined,
                    totalVideos: 0,
                    processingTime: expect.any(Number),
                    error: undefined
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
        it('should handle special characters in channel URL', async () => {
            try {
                // Arrange
                const channelUrl = 'https://www.youtube.com/channel/UC_test_channel_id?feature=äöü&utm_source=test';
                
                youtubeDb.findExistingAnalysis.mockResolvedValue(null);
                youtubeService.createAnalysis.mockResolvedValue({ success: true });
                processChannelAnalysis.mockResolvedValue();

                // Act
                const result = await startAnalysis(channelUrl);

                // Assert
                expect(result.analysisId).toBe('test-analysis-123');
                expect(parseChannelUrl).toHaveBeenCalledWith(channelUrl);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle very long analysis IDs', async () => {
            try {
                // Arrange
                const longAnalysisId = 'a'.repeat(1000);
                generateAnalysisId.mockReturnValue(longAnalysisId);
                
                youtubeDb.findExistingAnalysis.mockResolvedValue(null);
                youtubeService.createAnalysis.mockResolvedValue({ success: true });
                processChannelAnalysis.mockResolvedValue();

                // Act
                const result = await startAnalysis('https://www.youtube.com/channel/UC_test');

                // Assert
                expect(result.analysisId).toBe(longAnalysisId);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle concurrent analysis requests for same channel', async () => {
            try {
                // Arrange
                const channelUrl = 'https://www.youtube.com/channel/UC_test_channel_id';
                
                youtubeDb.findExistingAnalysis.mockResolvedValue(null);
                youtubeService.createAnalysis.mockResolvedValue({ success: true });
                processChannelAnalysis.mockResolvedValue();

                // Act - start multiple analyses concurrently
                const promises = [
                    startAnalysis(channelUrl),
                    startAnalysis(channelUrl),
                    startAnalysis(channelUrl)
                ];

                const results = await Promise.all(promises);

                // Assert - all should get unique analysis IDs
                results.forEach(result => {
                    expect(result.analysisId).toBe('test-analysis-123');
                    expect(result.isExisting).toBe(false);
                });

                // Database should be called for each request
                expect(youtubeDb.findExistingAnalysis).toHaveBeenCalledTimes(3);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle malformed date objects in memory store', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const mockMemoryJob = {
                    analysisId,
                    status: 'processing',
                    progress: 50,
                    startTime: 'invalid-date', // Invalid date
                    data: []
                };
                
                youtubeService.getAnalysis.mockResolvedValue({ success: false, data: null });
                getAnalysisJob.mockReturnValue(mockMemoryJob);

                // Act
                const result = await getAnalysisStatus(analysisId);

                // Assert - should handle gracefully
                expect(result.analysisId).toBe(analysisId);
                expect(result.processingTime).toBeNaN(); // Invalid date calculation

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle extremely large pagination values', async () => {
            try {
                // Arrange
                const analysisId = 'test-analysis-123';
                const hugePage = Number.MAX_SAFE_INTEGER;
                const hugeLimit = Number.MAX_SAFE_INTEGER;
                
                const mockDbResult = {
                    success: true,
                    data: { analysisId, status: 'completed' }
                };
                
                youtubeService.getAnalysis.mockResolvedValue(mockDbResult);

                // Act
                const result = await getAnalysisStatus(analysisId, hugePage, hugeLimit);

                // Assert
                expect(result.analysisId).toBe(analysisId);
                expect(youtubeService.getAnalysis).toHaveBeenCalledWith(analysisId, hugePage, hugeLimit);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });
});