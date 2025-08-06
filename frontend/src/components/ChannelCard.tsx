import { useState, useRef, useEffect } from 'react';
import type { ChannelInfo, CreatorHub } from '../types/api';
import { localStorageService } from '../services/localStorage';

interface ChannelCardProps {
    channelInfo: ChannelInfo;
    totalVideos: number;
    progress?: number;
    isLoading?: boolean;
    onClick: () => void;
    analysisId: string;
    hubs: CreatorHub[];
    onHubsChange: (hubs: CreatorHub[]) => void;
}

export default function ChannelCard({ 
    channelInfo, 
    totalVideos, 
    progress, 
    isLoading = false, 
    onClick,
    analysisId,
    hubs,
    onHubsChange
}: ChannelCardProps) {
    const [isFavorite, setIsFavorite] = useState<boolean>(localStorageService.isCreatorFavorite(analysisId));
    const [showMenu, setShowMenu] = useState<boolean>(false);
    const menuRef = useRef<HTMLDivElement>(null);

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

    const handleHeartClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            if (isFavorite) {
                localStorageService.removeFavoriteCreator(analysisId);
                setIsFavorite(false);
            } else {
                localStorageService.addFavoriteCreator({
                    analysisId: analysisId,
                    channelId: channelInfo.channelId,
                    channelName: channelInfo.channelName,
                    thumbnailUrl: channelInfo.thumbnailUrl
                });
                setIsFavorite(true);
            }
        } catch (error) {
            console.error('Error updating favorite status:', error);
        } finally {
            // Required by architecture rules
        }
    };

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const handleMoveToHub = (hubId: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        try {
            localStorageService.addCreatorToHub(hubId, analysisId);
            // Remove from other hubs
            hubs.forEach(otherHub => {
                if (otherHub.id !== hubId) {
                    localStorageService.removeCreatorFromHub(otherHub.id, analysisId);
                }
            });
            onHubsChange(localStorageService.getHubs());
            setShowMenu(false);
        } catch (error) {
            console.error('Error moving to hub:', error);
        } finally {
            // Required by architecture rules
        }
    };
    const formatSubscribers = (count: number): string => {
        try {
            if (!count || count < 0) return '0';
            if (count >= 1000000) {
                return `${(count / 1000000).toFixed(1)}M`;
            } else if (count >= 1000) {
                return `${(count / 1000).toFixed(1)}K`;
            }
            return count.toString();
        } catch {
            return '0';
        }
    };

    return (
        <div 
            className={`bg-white rounded-xl shadow-md hover:shadow-lg border border-gray-200 p-6 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 relative ${
                isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:border-red-200'
            }`}
            onClick={isLoading ? undefined : onClick}
        >
            {/* Heart and Menu Icons */}
            {!isLoading && (
                <div className="absolute top-4 right-4 flex space-x-2">
                    {/* Heart Icon */}
                    <button
                        onClick={handleHeartClick}
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
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
                        >
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                            </svg>
                        </button>

                        {/* Menu Dropdown */}
                        {showMenu && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-10">
                                {hubs.length > 0 ? (
                                    <>
                                        <div className="p-2 border-b">
                                            <p className="text-sm font-medium text-gray-700">Move to Hub</p>
                                        </div>
                                        {hubs.map(hub => (
                                            <button
                                                key={hub.id}
                                                onClick={(e) => handleMoveToHub(hub.id, e)}
                                                className="w-full p-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
                                            >
                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                                                </svg>
                                                <span className="text-sm text-gray-700">{hub.name}</span>
                                            </button>
                                        ))}
                                    </>
                                ) : (
                                    <div className="p-4 text-center text-sm text-gray-500">
                                        No hubs available
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                    <img
                        src={channelInfo?.thumbnailUrl || 'https://via.placeholder.com/64x64?text=YT'}
                        alt={`${channelInfo?.channelName || 'Channel'} profile`}
                        className="w-16 h-16 rounded-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/64x64?text=YT';
                        }}
                    />
                </div>
                
                <div className="flex-1 min-w-0 pr-16">
                    <h3 className="text-xl font-bold text-gray-900 truncate">
                        {channelInfo?.channelName || 'Loading...'}
                    </h3>
                    
                    <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">
                                {formatSubscribers(channelInfo?.subscriberCount || 0)}
                            </span> subscribers
                        </p>
                        
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">{totalVideos || 0}</span> videos analyzed
                        </p>
                        
                        {channelInfo?.creationDate && (
                            <p className="text-sm text-gray-500">
                                Created: {new Date(channelInfo.creationDate).toLocaleDateString()}
                            </p>
                        )}
                    </div>

                    {channelInfo?.description && (
                        <p className="mt-3 text-sm text-gray-700 line-clamp-2">
                            {channelInfo.description}
                        </p>
                    )}

                    {isLoading && progress !== undefined && (
                        <div className="mt-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span className="font-medium">Analyzing videos...</span>
                                <span className="font-bold text-red-600">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {!isLoading && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                            Click to view details
                        </span>
                        <div className="flex items-center space-x-1 text-red-600">
                            <span className="text-sm font-medium">View Videos</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}