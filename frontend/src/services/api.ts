import type { ApiError, BackendVideoData } from '../types/api';

/**
 * Base API configuration and shared utilities
 * Provides common functionality for all service modules
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Base API service class with shared functionality
 */
export class BaseApiService {
    /**
     * Transform backend video data to frontend format
     * @param video - Backend video data
     * @returns Transformed video data for frontend
     */
    protected transformVideoData(video: BackendVideoData) {
        return {
            videoId: video.videoId,
            title: video.title,
            description: video.description,
            thumbnailUrl: video.thumbnailUrl,
            videoUrl: video.videoUrl,
            uploadDate: video.uploadDate,
            duration: video.duration,
            viewCount: video.viewCount,
            likeCount: video.likeCount,
            commentCount: video.commentCount,
            categoryId: video.categoryId
        };
    }

    /**
     * Handle API response and error checking
     * @param response - Fetch response object
     * @param errorMessage - Default error message
     * @returns Response JSON data
     */
    protected async handleResponse(response: Response, errorMessage: string): Promise<any> {
        try {
            if (!response.ok) {
                const error: ApiError = await response.json();
                throw new Error(error.message || errorMessage);
            }
            return await response.json();
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch response
        }
    }

    /**
     * Download file helper utility
     * @param blob - File blob to download
     * @param filename - Name for the downloaded file
     */
    public downloadFile(blob: Blob, filename: string): void {
        try {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            throw new Error('Failed to download file');
        } finally {
            // No cleanup needed
        }
    }

    /**
     * Common headers for API requests
     */
    protected get defaultHeaders(): HeadersInit {
        return {
            'Content-Type': 'application/json'
        };
    }
}

// Export base service for inheritance
export const baseApiService = new BaseApiService();