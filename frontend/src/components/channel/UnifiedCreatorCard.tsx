import { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/api';
import { userService } from '../../services/userService';

interface UnifiedCreator {
    analysisId: string;
    platform: 'youtube' | 'instagram';
    data?: any;
    instagramData?: any;
}

interface UnifiedCreatorCardProps {
    creator: UnifiedCreator;
    isLoading?: boolean;
    onClick?: (creator: UnifiedCreator) => void;
    onRightClick?: (e: React.MouseEvent, analysisId: string) => void;
    onHubAssign?: (analysisId: string, hubId: string) => void;
    hubs?: any[];
}

export default function UnifiedCreatorCard({ 
    creator, 
    isLoading = false, 
    onClick, 
    onRightClick,
    onHubAssign,
    hubs = []
}: UnifiedCreatorCardProps) {
    const [imageError, setImageError] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Load creator interactions on component mount
    useEffect(() => {
        loadCreatorInteraction();
    }, [creator.analysisId]);

    // Click outside handler for menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showMenu && menuRef.current && !menuRef.current.contains(event.target as Node)) {
                // Only close if click is outside the dropdown area too
                const dropdownElement = document.querySelector('[data-dropdown-menu="true"]');
                if (!dropdownElement || !dropdownElement.contains(event.target as Node)) {
                    setShowMenu(false);
                }
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [showMenu]);

    const loadCreatorInteraction = async () => {
        try {
            const userId = userService.getUserId();
            const interactions = await apiService.getUserCreatorInteractions(userId);
            
            const creatorInteraction = interactions.find(
                interaction => interaction.creator_id === creator.analysisId
            );
            
            if (creatorInteraction) {
                setIsFavorite(creatorInteraction.is_favorite === 1 || creatorInteraction.is_favorite === true);
            }
        } catch (error) {
            console.error('Error loading creator interaction:', error);
        }
    };


    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            const userId = userService.getUserId();
            const newFavoriteState = !isFavorite;
            const info = getCreatorInfo();
            
            await apiService.updateCreatorInteraction(userId, creator.analysisId, {
                isFavorite: newFavoriteState,
                channelName: info.name,
                channelId: creator.platform === 'youtube' ? creator.data?.channelInfo?.youtubeChannelId : creator.analysisId,
                thumbnailUrl: info.thumbnail,
                platform: creator.platform
            });
            
            setIsFavorite(newFavoriteState);
        } catch (error) {
            console.error('Error updating favorite status:', error);
        }
    };

    const handleMenuClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const handleHubAssign = async (e: React.MouseEvent, hubId: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            const userId = userService.getUserId();
            const info = getCreatorInfo();
            
            await apiService.updateCreatorInteraction(userId, creator.analysisId, {
                hubId: hubId,
                channelName: info.name,
                channelId: creator.platform === 'youtube' ? creator.data?.channelInfo?.youtubeChannelId : creator.analysisId,
                thumbnailUrl: info.thumbnail,
                platform: creator.platform
            });
            
            setShowMenu(false);
            onHubAssign?.(creator.analysisId, hubId);
        } catch (error) {
            console.error('Error assigning creator to hub:', error);
        }
    };

    const getCreatorInfo = () => {
        if (creator.platform === 'youtube' && creator.data) {
            return {
                name: creator.data.channelInfo?.channelName || 'Unknown Channel',
                subscriber_count: creator.data.channelInfo?.subscriberCount || 0,
                video_count: creator.data.totalVideos || 0,
                thumbnail: creator.data.channelInfo?.thumbnailUrl || '',
                description: creator.data.channelInfo?.description || '',
                status: creator.data.status,
                platform: 'youtube' as const
            };
        } else if (creator.platform === 'instagram' && creator.instagramData) {
            return {
                name: creator.instagramData.profile?.username || 'Unknown Profile',
                subscriber_count: creator.instagramData.profile?.follower_count || 0,
                video_count: creator.instagramData.totalReels || 0,
                thumbnail: creator.instagramData.profile?.profile_pic_url || '',
                description: creator.instagramData.profile?.biography || '',
                status: creator.instagramData.status,
                platform: 'instagram' as const,
                full_name: creator.instagramData.profile?.full_name,
                is_verified: creator.instagramData.profile?.is_verified
            };
        }
        
        return {
            name: 'Loading...',
            subscriber_count: 0,
            video_count: 0,
            thumbnail: '',
            description: '',
            status: 'processing',
            platform: creator.platform
        };
    };

    const info = getCreatorInfo();
    const isClickable = info.status === 'completed';

    const formatNumber = (num: number): string => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };


    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return (
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                );
            case 'failed':
                return (
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                );
            case 'processing':
                return (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                );
            default:
                return null;
        }
    };

    const getPlatformIcon = (platform: string) => {
        if (platform === 'youtube') {
            return (
                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
            );
        } else {
            return (
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C8.396 0 7.853.016 6.625.071 5.398.126 4.56.336 3.842.637c-.75.293-1.386.683-2.019 1.316C1.19 2.587.8 3.223.507 3.973c-.301.718-.511 1.556-.566 2.783C-.054 7.984-.072 8.527-.072 12.148s.018 4.164.072 5.392c.055 1.227.265 2.065.566 2.783.293.75.683 1.386 1.316 2.019.633.633 1.269 1.023 2.019 1.316.718.301 1.556.511 2.783.566 1.228.055 1.771.073 5.392.073s4.164-.018 5.392-.073c1.227-.055 2.065-.265 2.783-.566.75-.293 1.386-.683 2.019-1.316.633-.633 1.023-1.269 1.316-2.019.301-.718.511-1.556.566-2.783.055-1.228.073-1.771.073-5.392s-.018-4.164-.073-5.392c-.055-1.227-.265-2.065-.566-2.783-.293-.75-.683-1.386-1.316-2.019C18.598.8 17.962.41 17.212.117 16.494-.184 15.656-.394 14.429-.449 13.201-.504 12.658-.522 9.037-.522H12.017z"/>
                    <path d="M12.017 5.838a6.31 6.31 0 100 12.62 6.31 6.31 0 000-12.62zm0 10.408a4.098 4.098 0 110-8.196 4.098 4.098 0 010 8.196z"/>
                    <circle cx="18.406" cy="5.594" r="1.44"/>
                </svg>
            );
        }
    };

    return (
        <div
            className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-visible relative ${
                isClickable ? 'cursor-pointer' : 'cursor-default'
            }`}
            onClick={() => isClickable && onClick?.(creator)}
            onContextMenu={(e) => onRightClick?.(e, creator.analysisId)}
        >
            {/* Thumbnail */}
            <div className="relative h-32 bg-gray-100">
                {info.thumbnail && !imageError ? (
                    <img
                        src={info.thumbnail}
                        alt={info.name}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        {getPlatformIcon(info.platform)}
                    </div>
                )}
                
                {/* Platform badge */}
                <div className="absolute top-2 left-2 flex items-center space-x-1 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                    {getPlatformIcon(info.platform)}
                    <span className="uppercase font-medium">
                        {info.platform}
                    </span>
                </div>

                {/* Status indicator */}
                <div className="absolute top-2 right-2 flex items-center space-x-1 bg-white bg-opacity-90 px-2 py-1 rounded">
                    {getStatusIcon(info.status)}
                </div>

                {/* Action icons - only show for completed creators */}
                {isClickable && (
                    <div className="absolute bottom-2 right-2 flex space-x-2">
                        {/* Favorite Icon */}
                        <button
                            onClick={handleFavoriteClick}
                            className="p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all duration-200"
                            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                        >
                            <svg 
                                className={`w-4 h-4 ${isFavorite ? 'text-red-500 fill-current' : 'text-white'}`} 
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
                                className={`p-2 rounded-full bg-black transition-all duration-200 ${
                                    showMenu 
                                        ? 'bg-opacity-70 ring-2 ring-white ring-opacity-50' 
                                        : 'bg-opacity-50 hover:bg-opacity-70'
                                }`}
                                title="Creator Options"
                            >
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

            </div>

            {/* Hub Dropdown Menu */}
            {showMenu && (
                <div 
                    data-dropdown-menu="true"
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10000
                    }}
                    className="bg-white rounded-lg shadow-2xl border border-gray-200 min-w-48"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-3 py-2 border-b border-gray-100">
                        <div className="flex items-center justify-center text-xs font-semibold text-gray-600">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                            </svg>
                            Move to Hub
                        </div>
                    </div>
                    
                    {/* Hub List */}
                    <div className="py-1">
                        {hubs.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500">
                                No hubs available
                            </div>
                        ) : (
                            hubs.map((hub) => (
                                <div
                                    key={hub.id}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-150 flex items-center justify-between group cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleHubAssign(e, hub.id);
                                    }}
                                >
                                    <span className="font-medium">{hub.name}</span>
                                    <span className="text-xs text-gray-500 group-hover:text-blue-600">({hub.creatorIds?.length || 0})</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate text-lg">
                            {info.platform === 'instagram' && info.full_name ? info.full_name : info.name}
                        </h3>
                        {info.platform === 'instagram' && info.full_name && (
                            <p className="text-sm text-gray-600 truncate">@{info.name}</p>
                        )}
                        {info.platform === 'instagram' && info.is_verified && (
                            <div className="flex items-center mt-1">
                                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs text-gray-500 ml-1">Verified</span>
                            </div>
                        )}
                    </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {info.description || 'No description available'}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                        {formatNumber(info.subscriber_count)} {info.platform === 'youtube' ? 'subscribers' : 'followers'}
                    </span>
                    <span>
                        {info.video_count} {info.platform === 'youtube' ? 'videos' : 'reels'}
                    </span>
                </div>

                {/* Loading indicator */}
                {isLoading && (
                    <div className="mt-3 bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                )}

                {/* Action prompt */}
                {isClickable && (
                    <div className="mt-3 text-center">
                        <span className="text-xs text-gray-500">
                            Click to view {info.platform === 'youtube' ? 'videos' : 'reels'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}