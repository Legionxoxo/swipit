import { useState, useRef, useEffect } from 'react';
import type { CreatorHub } from '../../types/api';
import { apiService } from '../../services/api';
import { userService } from '../../services/userService';

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
                <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-xs p-1 rounded">
                    {error}
                </div>
            )}
            <div className="absolute top-4 right-4 flex space-x-2">
                {/* Heart Icon */}
                <button
                    onClick={handleHeartClick}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                    title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                >
                    <svg 
                        className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`} 
                        fill={isFavorite ? 'currentColor' : 'none'} 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </button>

                {/* Menu Icon */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={handleMenuClick}
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                        title="Options"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showMenu && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-10">
                            <div className="py-2">
                                <div className="px-4 py-2 text-sm font-semibold text-gray-700 border-b">Move to Hub</div>
                                {hubs.length > 0 ? (
                                    hubs.map(hub => (
                                        <button
                                            key={hub.id}
                                            onClick={(e) => handleMoveToHub(hub.id, e)}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center space-x-2"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                            <span>{hub.name}</span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-2 text-sm text-gray-400">No hubs available</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}