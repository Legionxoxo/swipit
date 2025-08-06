import type { StartAnalysisRequest, StartAnalysisResponse, AnalysisResponse, ApiError } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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
            // Try YouTube database first
            const youtubeResponse = await fetch(`${API_BASE_URL}/youtube/analysis/${analysisId}`);
            
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
                        processingTime: backendResponse.data.processingTime,
                        error: backendResponse.data.error
                    };
                }
            }

            // Fallback to original endpoint for in-memory data
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

    async startInstagramAnalysis(username: string): Promise<StartAnalysisResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/instagram/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username }),
            });

            if (!response.ok) {
                const error: ApiError = await response.json();
                throw new Error(error.message || 'Failed to start Instagram analysis');
            }

            const backendResponse = await response.json();
            
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

    async getInstagramAnalysisStatus(analysisId: string): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/instagram/analysis/${analysisId}`);

            if (!response.ok) {
                const error: ApiError = await response.json();
                throw new Error(error.message || 'Failed to get Instagram analysis status');
            }

            const backendResponse = await response.json();
            
            return {
                analysisId: backendResponse.analysisId,
                status: backendResponse.status,
                progress: backendResponse.progress || 0,
                totalReels: backendResponse.totalReels || 0,
                profile: backendResponse.profile,
                reels: backendResponse.reels || [],
                reelSegments: backendResponse.reelSegments || null,
                error: backendResponse.error
            };
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    async exportInstagramToCsv(analysisId: string): Promise<Blob> {
        try {
            const response = await fetch(`${API_BASE_URL}/export/${analysisId}/csv`);

            if (!response.ok) {
                const error: ApiError = await response.json();
                throw new Error(error.message || 'Failed to export Instagram CSV');
            }

            return await response.blob();
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    async exportInstagramToJson(analysisId: string): Promise<Blob> {
        try {
            const response = await fetch(`${API_BASE_URL}/export/${analysisId}/json`);

            if (!response.ok) {
                const error: ApiError = await response.json();
                throw new Error(error.message || 'Failed to export Instagram JSON');
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

    // User Interactions API methods
    async getUserVideoInteractions(userId: string): Promise<any[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/user-interactions/videos/${userId}`);

            if (!response.ok) {
                const error: ApiError = await response.json();
                throw new Error(error.message || 'Failed to get user video interactions');
            }

            const backendResponse = await response.json();
            return backendResponse.data || [];
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    async updateVideoInteraction(userId: string, videoId: string, platform: string, interaction: {
        starRating?: number;
        comment?: string;
        isFavorite?: boolean;
    }): Promise<void> {
        try {
            const response = await fetch(`${API_BASE_URL}/user-interactions/videos`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    videoId,
                    platform,
                    ...interaction
                }),
            });

            if (!response.ok) {
                const error: ApiError = await response.json();
                throw new Error(error.message || 'Failed to update video interaction');
            }
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    async getUserCreatorInteractions(userId: string): Promise<any[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/user-interactions/creators/${userId}`);

            if (!response.ok) {
                const error: ApiError = await response.json();
                throw new Error(error.message || 'Failed to get user creator interactions');
            }

            const backendResponse = await response.json();
            return backendResponse.data || [];
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    async updateCreatorInteraction(userId: string, creatorId: string, interaction: {
        isFavorite?: boolean;
        hubId?: string;
        channelName: string;
        channelId?: string;
        thumbnailUrl?: string;
        platform: string;
    }): Promise<void> {
        try {
            const response = await fetch(`${API_BASE_URL}/user-interactions/creators`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    creatorId,
                    ...interaction
                }),
            });

            if (!response.ok) {
                const error: ApiError = await response.json();
                throw new Error(error.message || 'Failed to update creator interaction');
            }
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    async getUserHubs(userId: string): Promise<any[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/user-interactions/hubs/${userId}`);

            if (!response.ok) {
                const error: ApiError = await response.json();
                throw new Error(error.message || 'Failed to get user hubs');
            }

            const backendResponse = await response.json();
            return backendResponse.data || [];
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    async createHub(userId: string, name: string): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/user-interactions/hubs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    name
                }),
            });

            if (!response.ok) {
                const error: ApiError = await response.json();
                throw new Error(error.message || 'Failed to create hub');
            }

            const backendResponse = await response.json();
            return backendResponse.data;
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    async deleteHub(userId: string, hubId: string): Promise<void> {
        try {
            const response = await fetch(`${API_BASE_URL}/user-interactions/hubs/${hubId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId
                }),
            });

            if (!response.ok) {
                const error: ApiError = await response.json();
                throw new Error(error.message || 'Failed to delete hub');
            }
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }
}

export const apiService = new ApiService();