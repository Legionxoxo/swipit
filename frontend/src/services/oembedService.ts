import type { OEmbedPostData } from '../types/api';
import { BaseApiService, API_BASE_URL } from './api';

/**
 * oEmbed Service
 * Handles oEmbed post operations and external content embedding
 */
class OEmbedService extends BaseApiService {

    /**
     * Get Instagram oEmbed data for a post URL
     * @param postUrl - Instagram post URL to get oEmbed data for
     * @returns Promise with oEmbed data for the post
     */
    async getInstagramOEmbed(postUrl: string): Promise<OEmbedPostData> {
        try {
            const response = await fetch(`${API_BASE_URL}/oembed`, {
                method: 'POST',
                headers: this.defaultHeaders,
                body: JSON.stringify({ post_url: postUrl }),
            });

            const backendResponse = await this.handleResponse(response, 'Failed to get Instagram oEmbed data');
            
            if (!backendResponse.success) {
                throw new Error(backendResponse.message || 'Failed to retrieve Instagram data');
            }

            return backendResponse.data;
        } catch (error) {
            throw error;
        } finally {
            // No cleanup needed for fetch
        }
    }
}

export const oembedService = new OEmbedService();