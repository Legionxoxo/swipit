/**
 * @fileoverview Local storage service for managing app data
 * @author Frontend Team
 */

import type { AppData } from '../types/api';
import { hubsStorage } from './storage/hubsStorage';
import { favoritesStorage } from './storage/favoritesStorage';
import { starsAndCommentsStorage } from './storage/starsAndCommentsStorage';

const APP_DATA_KEY = 'buzzhunt_data';

/**
 * Service for managing localStorage operations
 */
class LocalStorageService {
    /**
     * Get all app data from localStorage
     * @returns {AppData} App data
     */
    getAppData(): AppData {
        try {
            const data = localStorage.getItem(APP_DATA_KEY);
            if (!data) {
                return {
                    hubs: [],
                    favoriteCreators: [],
                    favoriteVideos: [],
                    starredVideos: [],
                    videoComments: [],
                    videoTranscriptions: []
                };
            }
            return JSON.parse(data);
        } catch (error) {
            console.error('Error getting app data:', error);
            return {
                hubs: [],
                favoriteCreators: [],
                favoriteVideos: [],
                starredVideos: [],
                videoComments: [],
                videoTranscriptions: []
            };
        } finally {
            // Required by architecture rules
        }
    }

    /**
     * Set all app data to localStorage
     * @param {AppData} data - App data to save
     */
    setAppData(data: AppData): void {
        try {
            localStorage.setItem(APP_DATA_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Error setting app data:', error);
        } finally {
            // Required by architecture rules
        }
    }

    // Creator Hubs Management - delegated to hubsStorage
    getHubs = hubsStorage.getHubs.bind(hubsStorage);
    setHubs = hubsStorage.setHubs.bind(hubsStorage);
    addHub = hubsStorage.addHub.bind(hubsStorage);
    removeHub = hubsStorage.removeHub.bind(hubsStorage);
    updateHub = hubsStorage.updateHub.bind(hubsStorage);
    addCreatorToHub = hubsStorage.addCreatorToHub.bind(hubsStorage);
    removeCreatorFromHub = hubsStorage.removeCreatorFromHub.bind(hubsStorage);
    getCreatorsInHub = hubsStorage.getCreatorsInHub.bind(hubsStorage);

    // For backward compatibility, add createHub method
    createHub(name: string) {
        const newHub = {
            id: `hub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            createdAt: new Date().toISOString(),
            creatorIds: []
        };
        this.addHub(newHub);
        return newHub;
    }

    deleteHub = this.removeHub;

    /**
     * Get unorganized creators (not in any hub)
     * @param {string[]} allCreatorIds - All creator IDs
     * @returns {string[]} Array of unorganized creator IDs
     */
    getUnorganizedCreators(allCreatorIds: string[]): string[] {
        try {
            const hubs = this.getHubs();
            const organizedIds = new Set<string>();
            
            hubs.forEach(hub => {
                hub.creatorIds.forEach(id => organizedIds.add(id));
            });
            
            return allCreatorIds.filter(id => !organizedIds.has(id));
        } catch (error) {
            console.error('Error getting unorganized creators:', error);
            return allCreatorIds;
        } finally {
            // Required by architecture rules
        }
    }

    // Favorites Management - delegated to favoritesStorage
    getFavoriteCreators = favoritesStorage.getFavoriteCreators.bind(favoritesStorage);
    setFavoriteCreators = favoritesStorage.setFavoriteCreators.bind(favoritesStorage);
    addFavoriteCreator = favoritesStorage.addFavoriteCreator.bind(favoritesStorage);
    removeFavoriteCreator = favoritesStorage.removeFavoriteCreator.bind(favoritesStorage);
    isCreatorFavorite = favoritesStorage.isCreatorFavorite.bind(favoritesStorage);
    getFavoriteVideos = favoritesStorage.getFavoriteVideos.bind(favoritesStorage);
    setFavoriteVideos = favoritesStorage.setFavoriteVideos.bind(favoritesStorage);
    addFavoriteVideo = favoritesStorage.addFavoriteVideo.bind(favoritesStorage);
    removeFavoriteVideo = favoritesStorage.removeFavoriteVideo.bind(favoritesStorage);
    isVideoFavorite = favoritesStorage.isVideoFavorite.bind(favoritesStorage);

    // Stars and Comments Management - delegated to starsAndCommentsStorage
    getStarredVideos = starsAndCommentsStorage.getStarredVideos.bind(starsAndCommentsStorage);
    setStarredVideos = starsAndCommentsStorage.setStarredVideos.bind(starsAndCommentsStorage);
    addStarredVideo = starsAndCommentsStorage.addStarredVideo.bind(starsAndCommentsStorage);
    removeStarredVideo = starsAndCommentsStorage.removeStarredVideo.bind(starsAndCommentsStorage);
    getVideoStarRating = starsAndCommentsStorage.getVideoStarRating.bind(starsAndCommentsStorage);
    getVideoComments = starsAndCommentsStorage.getVideoComments.bind(starsAndCommentsStorage);
    setVideoComments = starsAndCommentsStorage.setVideoComments.bind(starsAndCommentsStorage);
    addOrUpdateVideoComment = starsAndCommentsStorage.addOrUpdateVideoComment.bind(starsAndCommentsStorage);
    removeVideoComment = starsAndCommentsStorage.removeVideoComment.bind(starsAndCommentsStorage);
    getVideoComment = starsAndCommentsStorage.getVideoComment.bind(starsAndCommentsStorage);
    hasVideoComment = starsAndCommentsStorage.hasVideoComment.bind(starsAndCommentsStorage);
}

export const localStorageService = new LocalStorageService();