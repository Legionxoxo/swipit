import { Heart } from 'lucide-react';
import type { UnifiedCreator, CreatorHub } from '../../types/api';
import { useCreatorInteraction } from '../../hooks/useCreatorInteraction';
import CreatorCardMenu from './CreatorCardMenu';
import CreatorInfo from './CreatorInfo';

interface UnifiedCreatorCardProps {
    creator: UnifiedCreator;
    isLoading?: boolean;
    onClick?: (creator: UnifiedCreator) => void;
    onRightClick?: (e: React.MouseEvent, analysisId: string) => void;
    onHubAssign?: (analysisId: string, hubId: string) => void;
    onFavoriteChange?: (analysisId: string, isFavorite: boolean) => void;
    hubs?: CreatorHub[];
}

/**
 * Unified creator card component for displaying YouTube and Instagram creators
 * Refactored to use custom hooks and sub-components to stay under 250 lines
 */
export default function UnifiedCreatorCard({
    creator,
    isLoading = false,
    onClick,
    onRightClick,
    onHubAssign,
    onFavoriteChange,
    hubs = []
}: UnifiedCreatorCardProps) {
    // Use custom hook for creator interactions
    const { isFavorite, isLoading: favoriteLoading, toggleFavorite } = useCreatorInteraction({
        creatorId: creator.analysisId,
        onFavoriteChange
    });

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite();
    };

    const handleRightClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onRightClick?.(e, creator.analysisId);
    };

    const isCompleted = creator.platform === 'youtube'
        ? creator.data?.status === 'completed'
        : creator.instagramData?.status === 'completed';

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="animate-pulse">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                        <div className="flex-1">
                            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't trigger navigation if clicking on interactive elements
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('a')) {
            return;
        }

        if (isCompleted && onClick) {
            onClick(creator);
        }
    };

    return (
        <div
            className={`
                bg-white rounded-lg border border-gray-100 transition-all duration-200 p-3 group
                ${isCompleted
                    ? 'cursor-pointer hover:shadow-sm hover:border-gray-200'
                    : 'hover:shadow-sm'
                }
            `}
            onClick={handleCardClick}
            onContextMenu={handleRightClick}
        >
            <div className="flex items-center justify-between">
                <CreatorInfo creator={creator} />

                <div className="flex items-center space-x-1 opacity-100 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={handleFavoriteClick}
                        disabled={favoriteLoading}
                        className={`
                            p-1.5 rounded-md transition-colors
                            ${isFavorite
                                ? 'text-red-500'
                                : 'text-gray-400 hover:text-red-500'
                            }
                            ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>

                    <CreatorCardMenu
                        analysisId={creator.analysisId}
                        hubs={hubs}
                        creatorName={creator.platform === 'youtube'
                            ? creator.data?.channelInfo?.channelName || 'YouTube Channel'
                            : creator.instagramData?.profile?.full_name || creator.instagramData?.profile?.username || 'Instagram Profile'
                        }
                        creatorId={creator.platform === 'youtube'
                            ? creator.data?.channelInfo?.channelId
                            : creator.instagramData?.profile?.instagram_user_id
                        }
                        thumbnailUrl={creator.platform === 'youtube'
                            ? creator.data?.channelInfo?.thumbnailUrl
                            : creator.instagramData?.profile?.profile_pic_url
                        }
                        platform={creator.platform}
                        onHubAssign={onHubAssign}
                    />
                </div>
            </div>
        </div>
    );
}