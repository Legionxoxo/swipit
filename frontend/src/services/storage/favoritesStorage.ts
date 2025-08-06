import type { FavoriteCreator, FavoriteVideo } from '../../types/api';

const FAVORITE_CREATORS_KEY = 'favorite_creators';
const FAVORITE_VIDEOS_KEY = 'favorite_videos';

export const favoritesStorage = {
    // Favorite Creators
    getFavoriteCreators(): FavoriteCreator[] {
        try {
            const data = localStorage.getItem(FAVORITE_CREATORS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting favorite creators:', error);
            return [];
        } finally {
            // Required by architecture rules
        }
    },

    setFavoriteCreators(creators: FavoriteCreator[]): void {
        try {
            localStorage.setItem(FAVORITE_CREATORS_KEY, JSON.stringify(creators));
        } catch (error) {
            console.error('Error setting favorite creators:', error);
        } finally {
            // Required by architecture rules
        }
    },

    addFavoriteCreator(creator: FavoriteCreator): void {
        try {
            const favorites = this.getFavoriteCreators();
            if (!favorites.some(f => f.analysisId === creator.analysisId)) {
                favorites.push({ ...creator, addedAt: new Date().toISOString() });
                this.setFavoriteCreators(favorites);
            }
        } catch (error) {
            console.error('Error adding favorite creator:', error);
        } finally {
            // Required by architecture rules
        }
    },

    removeFavoriteCreator(analysisId: string): void {
        try {
            const favorites = this.getFavoriteCreators();
            const filtered = favorites.filter(f => f.analysisId !== analysisId);
            this.setFavoriteCreators(filtered);
        } catch (error) {
            console.error('Error removing favorite creator:', error);
        } finally {
            // Required by architecture rules
        }
    },

    isCreatorFavorite(analysisId: string): boolean {
        try {
            const favorites = this.getFavoriteCreators();
            return favorites.some(f => f.analysisId === analysisId);
        } catch (error) {
            console.error('Error checking if creator is favorite:', error);
            return false;
        } finally {
            // Required by architecture rules
        }
    },

    // Favorite Videos
    getFavoriteVideos(): FavoriteVideo[] {
        try {
            const data = localStorage.getItem(FAVORITE_VIDEOS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting favorite videos:', error);
            return [];
        } finally {
            // Required by architecture rules
        }
    },

    setFavoriteVideos(videos: FavoriteVideo[]): void {
        try {
            localStorage.setItem(FAVORITE_VIDEOS_KEY, JSON.stringify(videos));
        } catch (error) {
            console.error('Error setting favorite videos:', error);
        } finally {
            // Required by architecture rules
        }
    },

    addFavoriteVideo(video: FavoriteVideo): void {
        try {
            const favorites = this.getFavoriteVideos();
            if (!favorites.some(f => f.videoId === video.videoId)) {
                favorites.push({ ...video, addedAt: new Date().toISOString() });
                this.setFavoriteVideos(favorites);
            }
        } catch (error) {
            console.error('Error adding favorite video:', error);
        } finally {
            // Required by architecture rules
        }
    },

    removeFavoriteVideo(videoId: string): void {
        try {
            const favorites = this.getFavoriteVideos();
            const filtered = favorites.filter(f => f.videoId !== videoId);
            this.setFavoriteVideos(filtered);
        } catch (error) {
            console.error('Error removing favorite video:', error);
        } finally {
            // Required by architecture rules
        }
    },

    isVideoFavorite(videoId: string): boolean {
        try {
            const favorites = this.getFavoriteVideos();
            return favorites.some(f => f.videoId === videoId);
        } catch (error) {
            console.error('Error checking if video is favorite:', error);
            return false;
        } finally {
            // Required by architecture rules
        }
    }
};