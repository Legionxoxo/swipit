import type { StartAnalysisResponse, InstagramAnalysisData } from '../types/api';
import { BaseApiService, API_BASE_URL } from './api';

/**
 * Instagram Service
 * Handles Instagram-specific operations including profile analysis and reels management
 */
class InstagramService extends BaseApiService {

    /**
     * Start Instagram profile analysis
     * @param username - Instagram username to analyze
     * @returns Promise with analysis ID and estimated completion time
     */
    async startInstagramAnalysis(username: string): Promise<StartAnalysisResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/instagram/analyze`, {
                method: 'POST',
                headers: this.defaultHeaders,
                body: JSON.stringify({ username }),
            });

            const backendResponse = await this.handleResponse(response, 'Failed to start Instagram analysis');
            
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
     * Get Instagram analysis status with pagination
     * @param analysisId - Analysis ID to check
     * @param page - Page number for pagination
     * @param limit - Number of items per page
     * @returns Promise with Instagram analysis status and data
     */
    async getInstagramAnalysisStatus(analysisId: string, page: number = 1, limit: number = 50): Promise<InstagramAnalysisData> {
        try {
            const response = await fetch(`${API_BASE_URL}/instagram/analysis/${analysisId}?page=${page}&limit=${limit}`);
            const backendResponse = await this.handleResponse(response, 'Failed to get Instagram analysis status');
            
            return {
                analysisId: backendResponse.analysisId,
                status: backendResponse.status,
                progress: backendResponse.progress || 0,
                totalReels: backendResponse.totalReels || 0,
                profile: backendResponse.profile,
                reels: backendResponse.reels || [],
                pagination: backendResponse.pagination,
                reelSegments: backendResponse.reelSegments || null,
                error: backendResponse.error
            };
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    /**
     * Get all completed Instagram analyses with pagination
     * @param limit - Number of analyses to retrieve
     * @param offset - Offset for pagination
     * @returns Promise with paginated Instagram analysis data
     */
    async getAllCompletedInstagramAnalyses(
        limit: number = 20, 
        offset: number = 0
    ): Promise<{ data: InstagramAnalysisData[], total: number, hasMore: boolean }> {
        try {
            const response = await fetch(
                `${API_BASE_URL}/instagram/analyses?limit=${limit}&offset=${offset}&includeTotal=true`
            );

            const backendResponse = await this.handleResponse(response, 'Failed to get completed Instagram analyses');
            
            if (!backendResponse.success) {
                throw new Error(backendResponse.message || 'Failed to retrieve Instagram analyses');
            }

            return {
                data: backendResponse.data || [],
                total: backendResponse.total || 0,
                hasMore: backendResponse.hasMore || false
            };
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    /**
     * Export Instagram analysis to CSV format
     * @param analysisId - Analysis ID to export
     * @returns Promise with CSV blob
     */
    async exportInstagramToCsv(analysisId: string): Promise<Blob> {
        try {
            const response = await fetch(`${API_BASE_URL}/export/${analysisId}/csv`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to export Instagram CSV');
            }

            return await response.blob();
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    /**
     * Export Instagram analysis to JSON format
     * @param analysisId - Analysis ID to export
     * @returns Promise with JSON blob
     */
    async exportInstagramToJson(analysisId: string): Promise<Blob> {
        try {
            const response = await fetch(`${API_BASE_URL}/export/${analysisId}/json`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to export Instagram JSON');
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

export const instagramService = new InstagramService();