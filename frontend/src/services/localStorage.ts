import type { AppData, CreatorHub, FavoriteCreator, FavoriteVideo, StarredVideo, VideoComment } from '../types/api';

const STORAGE_KEY = 'youtube-analyzer-data';

class LocalStorageService {
    private getAppData(): AppData {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) {
                const initialData: AppData = {
                    hubs: [],
                    favoriteCreators: [],
                    favoriteVideos: [],
                    starredVideos: [],
                    videoComments: []
                };
                this.saveAppData(initialData);
                return initialData;
            }
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return {
                hubs: [],
                favoriteCreators: [],
                favoriteVideos: [],
                starredVideos: [],
                videoComments: []
            };
        }
    }

    private saveAppData(data: AppData): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    // Hub management
    getHubs(): CreatorHub[] {
        return this.getAppData().hubs;
    }

    createHub(name: string): CreatorHub {
        const data = this.getAppData();
        const newHub: CreatorHub = {
            id: `hub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            createdAt: new Date().toISOString(),
            creatorIds: []
        };
        data.hubs.push(newHub);
        this.saveAppData(data);
        return newHub;
    }

    updateHub(hubId: string, updates: Partial<Omit<CreatorHub, 'id'>>): void {
        const data = this.getAppData();
        const hubIndex = data.hubs.findIndex(h => h.id === hubId);
        if (hubIndex >= 0) {
            data.hubs[hubIndex] = { ...data.hubs[hubIndex], ...updates };
            this.saveAppData(data);
        }
    }

    deleteHub(hubId: string): void {
        const data = this.getAppData();
        data.hubs = data.hubs.filter(h => h.id !== hubId);
        this.saveAppData(data);
    }

    addCreatorToHub(hubId: string, creatorId: string): void {
        const data = this.getAppData();
        const hub = data.hubs.find(h => h.id === hubId);
        if (hub && !hub.creatorIds.includes(creatorId)) {
            hub.creatorIds.push(creatorId);
            this.saveAppData(data);
        }
    }

    removeCreatorFromHub(hubId: string, creatorId: string): void {
        const data = this.getAppData();
        const hub = data.hubs.find(h => h.id === hubId);
        if (hub) {
            hub.creatorIds = hub.creatorIds.filter(id => id !== creatorId);
            this.saveAppData(data);
        }
    }

    getCreatorsInHub(hubId: string): string[] {
        const hub = this.getHubs().find(h => h.id === hubId);
        return hub ? hub.creatorIds : [];
    }

    getUnorganizedCreators(allCreatorIds: string[]): string[] {
        const data = this.getAppData();
        const organizedIds = new Set(data.hubs.flatMap(hub => hub.creatorIds));
        return allCreatorIds.filter(id => !organizedIds.has(id));
    }

    // Favorite creators management
    getFavoriteCreators(): FavoriteCreator[] {
        return this.getAppData().favoriteCreators;
    }

    addFavoriteCreator(creator: Omit<FavoriteCreator, 'addedAt'>): void {
        const data = this.getAppData();
        if (!data.favoriteCreators.find(c => c.analysisId === creator.analysisId)) {
            data.favoriteCreators.push({
                ...creator,
                addedAt: new Date().toISOString()
            });
            this.saveAppData(data);
        }
    }

    removeFavoriteCreator(analysisId: string): void {
        const data = this.getAppData();
        data.favoriteCreators = data.favoriteCreators.filter(c => c.analysisId !== analysisId);
        this.saveAppData(data);
    }

    isCreatorFavorite(analysisId: string): boolean {
        return this.getFavoriteCreators().some(c => c.analysisId === analysisId);
    }

    // Favorite videos management
    getFavoriteVideos(): FavoriteVideo[] {
        return this.getAppData().favoriteVideos;
    }

    addFavoriteVideo(video: Omit<FavoriteVideo, 'addedAt'>): void {
        const data = this.getAppData();
        if (!data.favoriteVideos.find(v => v.videoId === video.videoId)) {
            data.favoriteVideos.push({
                ...video,
                addedAt: new Date().toISOString()
            });
            this.saveAppData(data);
        }
    }

    removeFavoriteVideo(videoId: string): void {
        const data = this.getAppData();
        data.favoriteVideos = data.favoriteVideos.filter(v => v.videoId !== videoId);
        this.saveAppData(data);
    }

    isVideoFavorite(videoId: string): boolean {
        return this.getFavoriteVideos().some(v => v.videoId === videoId);
    }

    // Starred videos management
    getStarredVideos(): StarredVideo[] {
        return this.getAppData().starredVideos;
    }

    addStarredVideo(video: Omit<StarredVideo, 'starredAt'>): void {
        const data = this.getAppData();
        const existingIndex = data.starredVideos.findIndex(v => v.videoId === video.videoId);
        if (existingIndex >= 0) {
            // Update existing starred video
            data.starredVideos[existingIndex] = {
                ...data.starredVideos[existingIndex],
                ...video,
                starredAt: data.starredVideos[existingIndex].starredAt // Keep original starred date
            };
        } else {
            // Add new starred video
            data.starredVideos.push({
                ...video,
                starredAt: new Date().toISOString()
            });
        }
        this.saveAppData(data);
    }

    removeStarredVideo(videoId: string): void {
        const data = this.getAppData();
        data.starredVideos = data.starredVideos.filter(v => v.videoId !== videoId);
        this.saveAppData(data);
    }

    updateStarredVideo(videoId: string, updates: Partial<Omit<StarredVideo, 'videoId'>>): void {
        const data = this.getAppData();
        const videoIndex = data.starredVideos.findIndex(v => v.videoId === videoId);
        if (videoIndex >= 0) {
            data.starredVideos[videoIndex] = { ...data.starredVideos[videoIndex], ...updates };
            this.saveAppData(data);
        }
    }

    isVideoStarred(videoId: string): boolean {
        return this.getStarredVideos().some(v => v.videoId === videoId);
    }

    getVideoStarRating(videoId: string): number {
        const starredVideo = this.getStarredVideos().find(v => v.videoId === videoId);
        return starredVideo ? starredVideo.rating : 0;
    }

    // Video comments management
    getVideoComments(): VideoComment[] {
        return this.getAppData().videoComments;
    }

    getVideoComment(videoId: string): VideoComment | undefined {
        return this.getVideoComments().find(c => c.videoId === videoId);
    }

    addOrUpdateVideoComment(videoId: string, comment: string): void {
        const data = this.getAppData();
        const existingIndex = data.videoComments.findIndex(c => c.videoId === videoId);
        
        if (existingIndex >= 0) {
            // Update existing comment
            data.videoComments[existingIndex] = {
                videoId,
                comment,
                updatedAt: new Date().toISOString()
            };
        } else {
            // Add new comment
            data.videoComments.push({
                videoId,
                comment,
                updatedAt: new Date().toISOString()
            });
        }
        this.saveAppData(data);
    }

    removeVideoComment(videoId: string): void {
        const data = this.getAppData();
        data.videoComments = data.videoComments.filter(c => c.videoId !== videoId);
        this.saveAppData(data);
    }

    hasVideoComment(videoId: string): boolean {
        return this.getVideoComments().some(c => c.videoId === videoId);
    }
}

export const localStorageService = new LocalStorageService();