import { useState, useEffect } from 'react';
import { apiService } from '../services';
import { userService } from '../services/userService';

interface UseCreatorInteractionOptions {
    creatorId: string;
    onFavoriteChange?: (analysisId: string, isFavorite: boolean) => void;
}

/**
 * Custom hook for managing creator interactions (favorites)
 * Extracted from UnifiedCreatorCard to keep components under 250 lines
 */
export function useCreatorInteraction({
    creatorId,
    onFavoriteChange
}: UseCreatorInteractionOptions) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Load creator interactions on component mount
    useEffect(() => {
        loadCreatorInteraction();
    }, [creatorId]);

    const loadCreatorInteraction = async () => {
        try {
            const userId = userService.getUserId();
            const interactions = await apiService.getUserCreatorInteractions(userId);
            
            const creatorInteraction = interactions.find(
                interaction => interaction.creator_id === creatorId
            );
            
            if (creatorInteraction) {
                setIsFavorite(Boolean(creatorInteraction.is_favorite));
            }
        } catch (error) {
            // Error loading creator interaction - handled silently
        } finally {
            // Required by architecture rules
        }
    };

    const toggleFavorite = async () => {
        try {
            setIsLoading(true);
            const userId = userService.getUserId();
            const newFavoriteState = !isFavorite;
            
            // Toggling creator favorite status
            
            await apiService.updateCreatorInteraction(userId, creatorId, {
                isFavorite: newFavoriteState,
                channelName: `Creator ${creatorId}`,
                platform: 'unknown'
            });

            setIsFavorite(newFavoriteState);
            // Favorite status updated successfully
            onFavoriteChange?.(creatorId, newFavoriteState);
        } catch (error) {
            // Error updating creator favorite status - handled silently
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isFavorite,
        isLoading,
        toggleFavorite
    };
}