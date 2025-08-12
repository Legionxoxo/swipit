import type { StartAnalysisRequest, StartAnalysisResponse, AnalysisResponse } from '../types/api';
import { BaseApiService, API_BASE_URL } from './api';

/**
 * YouTube Service
 * Handles YouTube channel analysis and video export operations
 */
class YoutubeService extends BaseApiService {

    /**
     * Start YouTube channel analysis
     * @param channelUrl - YouTube channel URL to analyze
     * @returns Promise with analysis ID and estimated completion time
     */
    async startChannelAnalysis(channelUrl: string): Promise<StartAnalysisResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/analyze`, {
                method: 'POST',
                headers: this.defaultHeaders,
                body: JSON.stringify({ channelUrl } as StartAnalysisRequest),
            });

            const backendResponse = await this.handleResponse(response, 'Failed to start analysis');
            
            // Transform backend response to match frontend expectations
            return {
                analysisId: backendResponse.analysisId,
                estimatedCompletionTime: backendResponse.estimatedTime || 'Processing...'
            };
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    /**
     * Get all completed YouTube analyses with pagination
     * @param limit - Number of analyses to retrieve
     * @param offset - Offset for pagination
     * @param includeFullData - Whether to include full analysis data
     * @returns Promise with paginated analysis data
     */
    async getAllCompletedAnalyses(
        limit: number = 20, 
        offset: number = 0, 
        includeFullData: boolean = true
    ): Promise<{ data: AnalysisResponse[], total: number, hasMore: boolean }> {
        try {
            const response = await fetch(
                `${API_BASE_URL}/youtube/analyses?limit=${limit}&offset=${offset}&includeTotal=true&includeFullData=${includeFullData}`
            );

            const result = await this.handleResponse(response, 'Failed to get completed analyses');
            
            if (!result.success || !result.data) {
                throw new Error(result.message || 'Invalid response from server');
            }

            // Handle both old format (array) and new format (with pagination)
            if (Array.isArray(result.data)) {
                return {
                    data: result.data,
                    total: result.data.length,
                    hasMore: false
                };
            }

            return {
                data: result.data.data || result.data,
                total: result.data.total || 0,
                hasMore: result.data.hasMore || false
            };
        } catch (error) {
            console.error('Error getting completed analyses:', error);
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    /**
     * Get YouTube analysis status with pagination
     * @param analysisId - Analysis ID to check
     * @param page - Page number for pagination
     * @param limit - Number of items per page
     * @returns Promise with analysis status and data
     */
    async getAnalysisStatus(analysisId: string, page: number = 1, limit: number = 50): Promise<AnalysisResponse> {
        try {
            // Try YouTube database first with pagination
            const youtubeResponse = await fetch(`${API_BASE_URL}/youtube/analysis/${analysisId}?page=${page}&limit=${limit}`);
            
            if (youtubeResponse.ok) {
                const backendResponse = await youtubeResponse.json();
                
                if (backendResponse.success && backendResponse.data) {
                    return {
                        analysisId: backendResponse.data.analysisId,
                        status: backendResponse.data.status,
                        progress: backendResponse.data.progress || 0,
                        totalVideos: backendResponse.data.totalVideos || 0,
                        channelInfo: backendResponse.data.channelInfo,
                        videoData: (backendResponse.data.data || []).map(this.transformVideoData),
                        videoSegments: backendResponse.data.videoSegments ? {
                            viral: (backendResponse.data.videoSegments.viral || []).map(this.transformVideoData),
                            veryHigh: (backendResponse.data.videoSegments.veryHigh || []).map(this.transformVideoData),
                            high: (backendResponse.data.videoSegments.high || []).map(this.transformVideoData),
                            medium: (backendResponse.data.videoSegments.medium || []).map(this.transformVideoData),
                            low: (backendResponse.data.videoSegments.low || []).map(this.transformVideoData)
                        } : {
                            viral: [],
                            veryHigh: [],
                            high: [],
                            medium: [],
                            low: []
                        },
                        pagination: backendResponse.data.pagination,
                        processingTime: backendResponse.data.processingTime,
                        error: backendResponse.data.error
                    };
                }
            }

            // Fallback to original endpoint for in-memory data with pagination
            const response = await fetch(`${API_BASE_URL}/analysis/${analysisId}?page=${page}&limit=${limit}`);
            const backendResponse = await this.handleResponse(response, 'Failed to get analysis status');
            
            // Transform backend response to match frontend expectations
            return {
                analysisId: backendResponse.analysisId,
                status: backendResponse.status,
                progress: backendResponse.progress || 0,
                totalVideos: backendResponse.totalVideos || 0,
                channelInfo: backendResponse.channelInfo,
                videoData: (backendResponse.data || []).map(this.transformVideoData),
                videoSegments: backendResponse.videoSegments ? {
                    viral: (backendResponse.videoSegments.viral || []).map(this.transformVideoData),
                    veryHigh: (backendResponse.videoSegments.veryHigh || []).map(this.transformVideoData),
                    high: (backendResponse.videoSegments.high || []).map(this.transformVideoData),
                    medium: (backendResponse.videoSegments.medium || []).map(this.transformVideoData),
                    low: (backendResponse.videoSegments.low || []).map(this.transformVideoData)
                } : {
                    viral: [],
                    veryHigh: [],
                    high: [],
                    medium: [],
                    low: []
                },
                pagination: backendResponse.pagination,
                processingTime: backendResponse.processingTime,
                error: backendResponse.error
            };
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    /**
     * Export YouTube analysis to CSV format
     * @param analysisId - Analysis ID to export
     * @returns Promise with CSV blob
     */
    async exportToCsv(analysisId: string): Promise<Blob> {
        try {
            const response = await fetch(`${API_BASE_URL}/export/${analysisId}/csv`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to export CSV');
            }

            return await response.blob();
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    /**
     * Export YouTube analysis to JSON format
     * @param analysisId - Analysis ID to export
     * @returns Promise with JSON blob
     */
    async exportToJson(analysisId: string): Promise<Blob> {
        try {
            const response = await fetch(`${API_BASE_URL}/export/${analysisId}/json`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to export JSON');
            }

            return await response.blob();
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    /**
     * Download exported file
     * @param blob - File blob to download
     * @param filename - Name for downloaded file
     */
    downloadFile(blob: Blob, filename: string): void {
        super.downloadFile(blob, filename);
    }
}

export const youtubeService = new YoutubeService();