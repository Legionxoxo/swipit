import type { VideoTranscription } from '../types/api';
import { BaseApiService, API_BASE_URL } from './api';

/**
 * YouTube Transcription Service
 * Handles YouTube video transcription operations
 */
class YoutubeTranscriptionService extends BaseApiService {

    /**
     * Get video transcription by video ID and platform
     * @param videoId - Video ID to get transcription for
     * @param platform - Platform (usually 'youtube')
     * @returns Promise with transcription data or null if not found
     */
    async getVideoTranscription(videoId: string, platform: string): Promise<VideoTranscription | null> {
        try {
            const response = await fetch(`${API_BASE_URL}/transcription/video/${videoId}/${platform}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    return null; // No transcription exists
                }
                const error = await response.json();
                throw new Error(error.message || 'Failed to get video transcription');
            }

            const backendResponse = await response.json();
            return this.mapBackendTranscriptionToFrontend(backendResponse.data);
        } catch (error) {
            if (error instanceof Error && error.message.includes('404')) {
                return null;
            }
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    /**
     * Start video transcription process
     * @param userId - User ID requesting transcription
     * @param videoId - Video ID to transcribe
     * @param platform - Platform (usually 'youtube')
     * @returns Promise with transcription job details
     */
    async startVideoTranscription(
        userId: string, 
        videoId: string, 
        platform: string
    ): Promise<{ transcriptionId: string; status: string; estimatedTime: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/transcription`, {
                method: 'POST',
                headers: this.defaultHeaders,
                body: JSON.stringify({
                    userId,
                    videoId,
                    platform
                }),
            });

            const backendResponse = await this.handleResponse(response, 'Failed to start transcription');
            return {
                transcriptionId: backendResponse.data.transcriptionId,
                status: backendResponse.data.status,
                estimatedTime: backendResponse.data.estimatedTime
            };
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    /**
     * Get transcription status by transcription ID
     * @param transcriptionId - Transcription ID to check
     * @returns Promise with complete transcription data
     */
    async getTranscriptionStatus(transcriptionId: string): Promise<VideoTranscription> {
        try {
            const response = await fetch(`${API_BASE_URL}/transcription/${transcriptionId}`);
            const backendResponse = await this.handleResponse(response, 'Failed to get transcription status');
            const data = backendResponse.data;

            // Transform backend response to frontend type with backward compatibility
            return {
                transcriptionId: data.transcriptionId,
                videoId: data.videoId,
                userId: data.userId,
                videoUrl: data.videoUrl,
                platform: data.platform,
                status: data.status,
                progress: data.progress,
                videoTitle: data.videoTitle,
                videoDuration: data.videoDuration,
                videoThumbnailUrl: data.videoThumbnailUrl,
                rawTranscript: data.rawTranscript,
                formattedTranscript: data.formattedTranscript,
                languageDetected: data.languageDetected,
                confidenceScore: data.confidenceScore,
                processingStartedAt: data.processingStartedAt,
                processingCompletedAt: data.processingCompletedAt,
                processingTimeSeconds: data.processingTimeSeconds,
                errorMessage: data.errorMessage,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                // Legacy compatibility fields
                transcription: data.formattedTranscript || data.rawTranscript || '',
                confidence: data.confidenceScore || 0,
                language: data.languageDetected || 'unknown',
                generatedAt: data.processingCompletedAt || data.createdAt
            };
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    /**
     * Get all transcriptions for a user with optional filtering
     * @param userId - User ID to get transcriptions for
     * @param options - Optional filtering parameters
     * @returns Promise with array of user's transcriptions
     */
    async getUserTranscriptions(
        userId: string, 
        options?: { limit?: number; offset?: number; status?: string }
    ): Promise<VideoTranscription[]> {
        try {
            const params = new URLSearchParams();
            if (options?.limit) params.append('limit', options.limit.toString());
            if (options?.offset) params.append('offset', options.offset.toString());
            if (options?.status) params.append('status', options.status);

            const response = await fetch(`${API_BASE_URL}/transcription/user/${userId}?${params.toString()}`);
            const backendResponse = await this.handleResponse(response, 'Failed to get user transcriptions');

            return (backendResponse.data || []).map((data: VideoTranscription): VideoTranscription => ({
                transcriptionId: data.transcriptionId,
                videoId: data.videoId,
                userId: data.userId,
                videoUrl: data.videoUrl,
                platform: data.platform,
                status: data.status,
                progress: data.progress,
                videoTitle: data.videoTitle,
                videoDuration: data.videoDuration,
                videoThumbnailUrl: data.videoThumbnailUrl,
                rawTranscript: data.rawTranscript,
                formattedTranscript: data.formattedTranscript,
                languageDetected: data.languageDetected,
                confidenceScore: data.confidenceScore,
                processingStartedAt: data.processingStartedAt,
                processingCompletedAt: data.processingCompletedAt,
                processingTimeSeconds: data.processingTimeSeconds,
                errorMessage: data.errorMessage,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                // Legacy compatibility fields
                transcription: data.formattedTranscript || data.rawTranscript || '',
                confidence: data.confidenceScore || 0,
                language: data.languageDetected || 'unknown',
                generatedAt: data.processingCompletedAt || data.createdAt
            }));
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    /**
     * Delete a transcription
     * @param transcriptionId - Transcription ID to delete
     * @param userId - User ID requesting deletion
     * @returns Promise that resolves when deletion is complete
     */
    async deleteTranscription(transcriptionId: string, userId: string): Promise<void> {
        try {
            const response = await fetch(`${API_BASE_URL}/transcription/${transcriptionId}`, {
                method: 'DELETE',
                headers: this.defaultHeaders,
                body: JSON.stringify({ userId }),
            });

            await this.handleResponse(response, 'Failed to delete transcription');
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    /**
     * Map backend transcription data to frontend format
     * @param data - Backend transcription data
     * @returns Transformed transcription data for frontend
     */
    private mapBackendTranscriptionToFrontend(data: VideoTranscription): VideoTranscription {
        return {
            transcriptionId: data.transcriptionId,
            videoId: data.videoId,
            userId: data.userId,
            videoUrl: data.videoUrl,
            platform: data.platform,
            status: data.status,
            progress: data.progress,
            videoTitle: data.videoTitle,
            videoDuration: data.videoDuration,
            videoThumbnailUrl: data.videoThumbnailUrl,
            rawTranscript: data.rawTranscript,
            formattedTranscript: data.formattedTranscript,
            languageDetected: data.languageDetected,
            confidenceScore: data.confidenceScore,
            processingStartedAt: data.processingStartedAt,
            processingCompletedAt: data.processingCompletedAt,
            processingTimeSeconds: data.processingTimeSeconds,
            errorMessage: data.errorMessage,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            // Legacy compatibility fields
            transcription: data.formattedTranscript || data.rawTranscript || '',
            confidence: data.confidenceScore || 0,
            language: data.languageDetected || 'unknown',
            generatedAt: data.processingCompletedAt || data.createdAt
        };
    }
}

export const youtubeTranscriptionService = new YoutubeTranscriptionService();