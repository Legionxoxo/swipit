import type { VideoTranscription } from '../types/api';

const TRANSCRIPTIONS_KEY = 'video_transcriptions';

export const transcriptionService = {
    // Get all stored transcriptions
    getAllTranscriptions(): VideoTranscription[] {
        try {
            const data = localStorage.getItem(TRANSCRIPTIONS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting transcriptions:', error);
            return [];
        } finally {
            // Required by architecture rules
        }
    },

    // Get transcription for specific video
    getVideoTranscription(videoId: string): VideoTranscription | null {
        try {
            const transcriptions = this.getAllTranscriptions();
            return transcriptions.find(t => t.videoId === videoId) || null;
        } catch (error) {
            console.error('Error getting video transcription:', error);
            return null;
        } finally {
            // Required by architecture rules
        }
    },

    // Store transcription for a video
    storeVideoTranscription(transcription: VideoTranscription): void {
        try {
            const transcriptions = this.getAllTranscriptions();
            const existingIndex = transcriptions.findIndex(t => t.videoId === transcription.videoId);
            
            if (existingIndex >= 0) {
                transcriptions[existingIndex] = transcription;
            } else {
                transcriptions.push(transcription);
            }
            
            localStorage.setItem(TRANSCRIPTIONS_KEY, JSON.stringify(transcriptions));
        } catch (error) {
            console.error('Error storing video transcription:', error);
        } finally {
            // Required by architecture rules
        }
    },

    // Generate transcription (to be implemented with real API)
    async generateTranscription(videoId: string): Promise<VideoTranscription> {
        try {
            // Check if transcription already exists
            const existing = this.getVideoTranscription(videoId);
            if (existing) {
                return existing;
            }

            // TODO: Implement real transcription service integration
            // This would typically involve:
            // 1. Extract video URL from videoId
            // 2. Call transcription API (YouTube API, Google Speech-to-Text, etc.)
            // 3. Process and format the results
            // 4. Store the transcription

            throw new Error('Transcription service not yet implemented. Please integrate with a speech-to-text service.');
        } catch (error) {
            console.error('Error generating transcription:', error);
            throw new Error(`Failed to generate transcription: ${error}`);
        } finally {
            // Required by architecture rules
        }
    },

    // Delete transcription for a video
    deleteVideoTranscription(videoId: string): void {
        try {
            const transcriptions = this.getAllTranscriptions();
            const filtered = transcriptions.filter(t => t.videoId !== videoId);
            localStorage.setItem(TRANSCRIPTIONS_KEY, JSON.stringify(filtered));
        } catch (error) {
            console.error('Error deleting video transcription:', error);
        } finally {
            // Required by architecture rules
        }
    },

    // Check if transcription exists for video
    hasTranscription(videoId: string): boolean {
        try {
            const transcriptions = this.getAllTranscriptions();
            return transcriptions.some(t => t.videoId === videoId);
        } catch (error) {
            console.error('Error checking transcription existence:', error);
            return false;
        } finally {
            // Required by architecture rules
        }
    },

    // Clear all transcriptions (useful for removing mock data)
    clearAllTranscriptions(): void {
        try {
            localStorage.removeItem(TRANSCRIPTIONS_KEY);
        } catch (error) {
            console.error('Error clearing transcriptions:', error);
        } finally {
            // Required by architecture rules
        }
    }
};