import type { VideoTranscription } from '../types/api';
import { apiService } from './api';
import { userService } from './userService';

const TRANSCRIPTION_CACHE_KEY = 'video_transcriptions_cache';
const TRANSCRIPTION_JOBS_KEY = 'active_transcription_jobs';

export const transcriptionService = {
    // Get all user transcriptions from API
    async getAllTranscriptions(): Promise<VideoTranscription[]> {
        try {
            const userId = userService.getUserId();
            return await apiService.getUserTranscriptions(userId);
        } catch (error) {
            console.error('Error getting transcriptions:', error);
            return [];
        } finally {
            // Required by architecture rules
        }
    },

    // Get transcription for specific video
    async getVideoTranscription(videoId: string, platform: string = 'youtube'): Promise<VideoTranscription | null> {
        try {
            // First try to get from API (shared transcription)
            const transcription = await apiService.getVideoTranscription(videoId, platform);
            
            if (transcription) {
                // Cache the transcription locally
                this.cacheTranscription(transcription);
                return transcription;
            }
            
            // Fallback to cached transcriptions (for backwards compatibility)
            const cached = this.getCachedTranscriptions();
            return cached.find(t => t.videoId === videoId && t.platform === platform) || null;
        } catch (error) {
            console.error('Error getting video transcription:', error);
            
            // Fallback to cached transcriptions on error
            const cached = this.getCachedTranscriptions();
            return cached.find(t => t.videoId === videoId && t.platform === platform) || null;
        } finally {
            // Required by architecture rules
        }
    },

    // Cache transcription locally for performance
    cacheTranscription(transcription: VideoTranscription): void {
        try {
            const cache = this.getCachedTranscriptions();
            const existingIndex = cache.findIndex(t => t.videoId === transcription.videoId);
            
            if (existingIndex >= 0) {
                cache[existingIndex] = transcription;
            } else {
                cache.push(transcription);
            }
            
            localStorage.setItem(TRANSCRIPTION_CACHE_KEY, JSON.stringify(cache));
        } catch (error) {
            console.error('Error caching video transcription:', error);
        } finally {
            // Required by architecture rules
        }
    },

    // Get cached transcriptions
    getCachedTranscriptions(): VideoTranscription[] {
        try {
            const data = localStorage.getItem(TRANSCRIPTION_CACHE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting cached transcriptions:', error);
            return [];
        } finally {
            // Required by architecture rules
        }
    },

    // Generate transcription using backend API
    async generateTranscription(videoId: string, platform: string = 'youtube'): Promise<VideoTranscription> {
        try {
            const userId = userService.getUserId();

            // Check if transcription already exists and is completed
            const existing = await this.getVideoTranscription(videoId, platform);
            if (existing && existing.status === 'completed') {
                return existing;
            }

            // If already processing, return the existing job
            if (existing && existing.status === 'processing') {
                return existing;
            }

            // Start new transcription job
            const jobResponse = await apiService.startVideoTranscription(userId, videoId, platform);
            
            // Store job info for tracking
            this.storeActiveJob(videoId, jobResponse.transcriptionId);

            // Return immediately with processing status - don't wait for completion
            // The UI will handle polling via the polling method
            const initialTranscription: VideoTranscription = {
                transcriptionId: jobResponse.transcriptionId,
                videoId,
                userId,
                videoUrl: '',
                platform,
                status: 'processing' as const,
                progress: 0,
                videoTitle: '',
                videoDuration: '',
                videoThumbnailUrl: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                transcription: '',
                confidence: 0,
                language: 'unknown',
                generatedAt: new Date().toISOString()
            };

            this.cacheTranscription(initialTranscription);
            return initialTranscription;

        } catch (error) {
            console.error('Error generating transcription:', error);
            throw error;
        } finally {
            // Required by architecture rules
        }
    },

    // Poll transcription until completion
    async pollTranscriptionCompletion(transcriptionId: string, maxAttempts: number = 60): Promise<VideoTranscription> {
        try {
            let attempts = 0;
            
            while (attempts < maxAttempts) {
                const transcription = await apiService.getTranscriptionStatus(transcriptionId);
                
                // Cache the current state
                this.cacheTranscription(transcription);
                
                if (transcription.status === 'completed') {
                    this.removeActiveJob(transcription.videoId);
                    return transcription;
                } else if (transcription.status === 'failed') {
                    this.removeActiveJob(transcription.videoId);
                    throw new Error(transcription.errorMessage || 'Transcription failed');
                }
                
                // Wait 5 seconds before next poll
                await new Promise(resolve => setTimeout(resolve, 5000));
                attempts++;
            }
            
            throw new Error('Transcription polling timeout');
        } catch (error) {
            console.error('Error polling transcription:', error);
            throw error;
        } finally {
            // Required by architecture rules
        }
    },

    // Get transcription status by transcription ID
    async getTranscriptionStatus(transcriptionId: string): Promise<VideoTranscription> {
        try {
            const transcription = await apiService.getTranscriptionStatus(transcriptionId);
            this.cacheTranscription(transcription);
            return transcription;
        } catch (error) {
            console.error('Error getting transcription status:', error);
            throw error;
        } finally {
            // Required by architecture rules
        }
    },

    // Delete transcription for a video
    async deleteVideoTranscription(videoId: string): Promise<void> {
        try {
            const userId = userService.getUserId();
            const transcription = await this.getVideoTranscription(videoId, 'youtube'); // Default to youtube, could be improved
            
            if (transcription) {
                await apiService.deleteTranscription(transcription.transcriptionId, userId);
                
                // Remove from cache
                const cache = this.getCachedTranscriptions();
                const filtered = cache.filter(t => t.videoId !== videoId);
                localStorage.setItem(TRANSCRIPTION_CACHE_KEY, JSON.stringify(filtered));
                
                // Remove from active jobs
                this.removeActiveJob(videoId);
            }
        } catch (error) {
            console.error('Error deleting video transcription:', error);
            throw error;
        } finally {
            // Required by architecture rules
        }
    },

    // Check if transcription exists for video
    async hasTranscription(videoId: string, platform: string = 'youtube'): Promise<boolean> {
        try {
            const transcription = await this.getVideoTranscription(videoId, platform);
            return !!transcription;
        } catch (error) {
            console.error('Error checking transcription existence:', error);
            return false;
        } finally {
            // Required by architecture rules
        }
    },

    // Clear all transcription cache (cleanup)
    clearTranscriptionCache(): void {
        try {
            localStorage.removeItem(TRANSCRIPTION_CACHE_KEY);
            localStorage.removeItem(TRANSCRIPTION_JOBS_KEY);
        } catch (error) {
            console.error('Error clearing transcription cache:', error);
        } finally {
            // Required by architecture rules
        }
    },

    // Active job management
    storeActiveJob(videoId: string, transcriptionId: string): void {
        try {
            const jobs = this.getActiveJobs();
            jobs[videoId] = transcriptionId;
            localStorage.setItem(TRANSCRIPTION_JOBS_KEY, JSON.stringify(jobs));
        } catch (error) {
            console.error('Error storing active job:', error);
        } finally {
            // Required by architecture rules
        }
    },

    getActiveJobs(): Record<string, string> {
        try {
            const data = localStorage.getItem(TRANSCRIPTION_JOBS_KEY);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error getting active jobs:', error);
            return {};
        } finally {
            // Required by architecture rules
        }
    },

    removeActiveJob(videoId: string): void {
        try {
            const jobs = this.getActiveJobs();
            delete jobs[videoId];
            localStorage.setItem(TRANSCRIPTION_JOBS_KEY, JSON.stringify(jobs));
        } catch (error) {
            console.error('Error removing active job:', error);
        } finally {
            // Required by architecture rules
        }
    },

    // Check if video has active transcription job
    hasActiveJob(videoId: string): boolean {
        try {
            const jobs = this.getActiveJobs();
            return !!jobs[videoId];
        } catch (error) {
            console.error('Error checking active job:', error);
            return false;
        } finally {
            // Required by architecture rules
        }
    },

    // Legacy method for backward compatibility
    clearAllTranscriptions(): void {
        this.clearTranscriptionCache();
    }
};