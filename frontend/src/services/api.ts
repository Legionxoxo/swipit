import type { StartAnalysisRequest, StartAnalysisResponse, AnalysisResponse, ApiError } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class ApiService {
    private transformVideoData(video: any) {
        return {
            videoId: video.id,
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
    async startChannelAnalysis(channelUrl: string): Promise<StartAnalysisResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ channelUrl } as StartAnalysisRequest),
            });

            if (!response.ok) {
                const error: ApiError = await response.json();
                throw new Error(error.message || 'Failed to start analysis');
            }

            const backendResponse = await response.json();
            
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

    async getAnalysisStatus(analysisId: string): Promise<AnalysisResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/analysis/${analysisId}`);

            if (!response.ok) {
                const error: ApiError = await response.json();
                throw new Error(error.message || 'Failed to get analysis status');
            }

            const backendResponse = await response.json();
            
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
                processingTime: backendResponse.processingTime,
                error: backendResponse.error
            };
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    async exportToCsv(analysisId: string): Promise<Blob> {
        try {
            const response = await fetch(`${API_BASE_URL}/export/${analysisId}/csv`);

            if (!response.ok) {
                const error: ApiError = await response.json();
                throw new Error(error.message || 'Failed to export CSV');
            }

            return await response.blob();
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    async exportToJson(analysisId: string): Promise<Blob> {
        try {
            const response = await fetch(`${API_BASE_URL}/export/${analysisId}/json`);

            if (!response.ok) {
                const error: ApiError = await response.json();
                throw new Error(error.message || 'Failed to export JSON');
            }

            return await response.blob();
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    downloadFile(blob: Blob, filename: string): void {
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
}

export const apiService = new ApiService();