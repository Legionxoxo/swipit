import type { UserVideoInteraction, UserCreatorInteraction } from '../types/api';
import { BaseApiService, API_BASE_URL } from './api';

/**
 * User Interaction Service
 * Handles user interactions with videos and creators including favorites, stars, and comments
 */
class UserInteractionService extends BaseApiService {

    /**
     * Get all video interactions for a user
     * @param userId - User ID to get interactions for
     * @param page - Page number for pagination
     * @param limit - Number of items per page
     * @param filter - Filter type ('favorites', 'starred', or undefined for all)
     * @returns Promise with paginated video interactions response
     */
    async getUserVideoInteractions(
        userId: string, 
        page: number = 1, 
        limit: number = 20, 
        filter?: 'favorites' | 'starred'
    ): Promise<{
        data: UserVideoInteraction[],
        pagination: {
            currentPage: number;
            totalPages: number;
            totalCount: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            limit: number;
        }
    }> {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString()
            });
            
            if (filter) {
                params.set('filter', filter);
            }
            
            const response = await fetch(`${API_BASE_URL}/user-interactions/videos/${userId}?${params}`);
            const backendResponse = await this.handleResponse(response, 'Failed to get user video interactions');
            
            return {
                data: backendResponse.data || [],
                pagination: backendResponse.pagination
            };
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    /**
     * Update video interaction (favorite, star rating, comment)
     * @param userId - User ID
     * @param videoId - Video ID to interact with
     * @param platform - Platform (youtube, instagram, etc.)
     * @param interaction - Interaction details
     * @returns Promise that resolves when update is complete
     */
    async updateVideoInteraction(
        userId: string, 
        videoId: string, 
        platform: string, 
        interaction: {
            starRating?: number;
            comment?: string;
            isFavorite?: boolean;
        }
    ): Promise<void> {
        try {
            const response = await fetch(`${API_BASE_URL}/user-interactions/videos`, {
                method: 'PUT',
                headers: this.defaultHeaders,
                body: JSON.stringify({
                    userId,
                    videoId,
                    platform,
                    ...interaction
                }),
            });

            await this.handleResponse(response, 'Failed to update video interaction');
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    /**
     * Get all creator interactions for a user
     * @param userId - User ID to get interactions for
     * @returns Promise with array of creator interactions
     */
    async getUserCreatorInteractions(userId: string): Promise<UserCreatorInteraction[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/user-interactions/creators/${userId}`);
            const backendResponse = await this.handleResponse(response, 'Failed to get user creator interactions');
            
            return backendResponse.data || [];
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    /**
     * Update creator interaction (favorite, hub assignment)
     * @param userId - User ID
     * @param creatorId - Creator ID to interact with
     * @param interaction - Interaction details
     * @returns Promise that resolves when update is complete
     */
    async updateCreatorInteraction(
        userId: string, 
        creatorId: string, 
        interaction: {
            isFavorite?: boolean;
            hubId?: string;
            channelName: string;
            channelId?: string;
            thumbnailUrl?: string;
            platform: string;
        }
    ): Promise<void> {
        try {
            const response = await fetch(`${API_BASE_URL}/user-interactions/creators`, {
                method: 'PUT',
                headers: this.defaultHeaders,
                body: JSON.stringify({
                    userId,
                    creatorId,
                    ...interaction
                }),
            });

            await this.handleResponse(response, 'Failed to update creator interaction');
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }
}

export const userInteractionService = new UserInteractionService();