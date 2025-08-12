import type { CreatorHub } from '../types/api';
import { BaseApiService, API_BASE_URL } from './api';

/**
 * Hub Service
 * Handles creator hub management including CRUD operations and creator assignments
 */
class HubService extends BaseApiService {

    /**
     * Get all hubs for a user
     * @param userId - User ID to get hubs for
     * @returns Promise with array of user's hubs
     */
    async getUserHubs(userId: string): Promise<CreatorHub[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/user-interactions/hubs/${userId}`);
            const backendResponse = await this.handleResponse(response, 'Failed to get user hubs');
            
            return backendResponse.data || [];
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    /**
     * Create a new hub
     * @param userId - User ID creating the hub
     * @param name - Name for the new hub
     * @returns Promise with the created hub data
     */
    async createHub(userId: string, name: string): Promise<CreatorHub> {
        try {
            const response = await fetch(`${API_BASE_URL}/user-interactions/hubs`, {
                method: 'POST',
                headers: this.defaultHeaders,
                body: JSON.stringify({
                    userId,
                    name
                }),
            });

            const backendResponse = await this.handleResponse(response, 'Failed to create hub');
            return backendResponse.data;
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }

    /**
     * Delete a hub
     * @param userId - User ID requesting deletion
     * @param hubId - Hub ID to delete
     * @returns Promise that resolves when deletion is complete
     */
    async deleteHub(userId: string, hubId: string): Promise<void> {
        try {
            const response = await fetch(`${API_BASE_URL}/user-interactions/hubs/${hubId}`, {
                method: 'DELETE',
                headers: this.defaultHeaders,
                body: JSON.stringify({
                    userId
                }),
            });

            await this.handleResponse(response, 'Failed to delete hub');
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }
}

export const hubService = new HubService();