import { useState, useRef, useEffect } from 'react';
import type { CreatorHub } from '../../types/api';
import { apiService } from '../../services';
import { userService } from '../../services/userService';
import { Heart, MoreVertical } from 'lucide-react';

interface ChannelActionsProps {
    analysisId: string;
    channelId: string;
    channelName: string;
    thumbnailUrl: string;
    hubs: CreatorHub[];
    onHubsChange: (hubs: CreatorHub[]) => void;
    isLoading?: boolean;
}

export default function ChannelActions({
    analysisId,
    channelId,
    channelName,
    thumbnailUrl,
    hubs,
    onHubsChange,
    isLoading = false
}: ChannelActionsProps) {
    const [isFavorite, setIsFavorite] = useState<boolean>(false);
    const [showMenu, setShowMenu] = useState<boolean>(false);
    const [componentLoading, setComponentLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const menuRef = useRef<HTMLDivElement>(null);

    // Load creator interaction on mount
    useEffect(() => {
        loadCreatorInteraction();
    }, [analysisId]);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const loadCreatorInteraction = async () => {
        try {
            setError('');
            const userId = userService.getUserId();
            const interactions = await apiService.getUserCreatorInteractions(userId);
            
            const creatorInteraction = interactions.find(
                interaction => interaction.creator_id === analysisId
            );

            setIsFavorite(creatorInteraction?.is_favorite || false);
        } catch (error) {
            console.error('Error loading creator interaction:', error);
            setError('Failed to load creator data');
        } finally {
            setComponentLoading(false);
        }
    };

    const handleHeartClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            setError('');
            const userId = userService.getUserId();
            const newFavoriteState = !isFavorite;

            await apiService.updateCreatorInteraction(userId, analysisId, {
                isFavorite: newFavoriteState,
                channelName,
                channelId,
                thumbnailUrl,
                platform: 'youtube'
            });

            setIsFavorite(newFavoriteState);
        } catch (error) {
            console.error('Error updating favorite status:', error);
            setError('Failed to update favorite');
        } finally {
            // Required by architecture rules
        }
    };

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const handleMoveToHub = async (hubId: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        try {
            setError('');
            const userId = userService.getUserId();

            await apiService.updateCreatorInteraction(userId, analysisId, {
                hubId,
                channelName,
                channelId,
                thumbnailUrl,
                platform: 'youtube'
            });

            // Refresh hubs data
            const updatedHubs = await apiService.getUserHubs(userId);
            onHubsChange(updatedHubs);
            setShowMenu(false);
        } catch (error) {
            console.error('Error moving to hub:', error);
            setError('Failed to move to hub');
        } finally {
            // Required by architecture rules
        }
    };

    if (isLoading || componentLoading) return null;

    return (
        <>
            {error && (
                <div className="absolute -top-8 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    {error}
                </div>
            )}
            <div className="flex space-x-1">
                {/* Heart Icon */}
                <button
                    onClick={handleHeartClick}
                    className="p-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                    title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                >
                    <Heart 
                        className={`w-4 h-4 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`}
                    />
                </button>

                {/* Menu Icon */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={handleMenuClick}
                        className="p-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                        title="Options"
                    >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>

                    {/* Compact Dropdown Menu */}
                    {showMenu && (
                        <div className="absolute top-full right-0 mt-1 w-40 bg-white rounded-md shadow-lg border z-50">
                            <div className="py-1">
                                <div className="px-3 py-1 text-xs font-medium text-gray-500 border-b">Move to Hub</div>
                                {hubs.length > 0 ? (
                                    hubs.map(hub => (
                                        <button
                                            key={hub.id}
                                            onClick={(e) => handleMoveToHub(hub.id, e)}
                                            className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 cursor-pointer"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                            <span className="truncate">{hub.name}</span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-3 py-1.5 text-xs text-gray-400">No hubs available</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}