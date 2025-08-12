import { useState } from 'react';
import { Users, Video, CheckCircle2, Instagram, Youtube } from 'lucide-react';
import type { UnifiedCreator } from '../../types/api';

interface CreatorInfoProps {
    creator: UnifiedCreator;
}

/**
 * Creator information display component with platform-specific logic
 * Extracted from UnifiedCreatorCard to keep components under 250 lines
 */
export default function CreatorInfo({ creator }: CreatorInfoProps) {
    const [imageError, setImageError] = useState(false);


    const getCreatorName = () => {
        if (creator.platform === 'youtube') {
            return creator.data?.channelInfo?.channelName || 'YouTube Channel';
        }
        if (creator.platform === 'instagram') {
            return creator.instagramData?.profile?.username 
                ? `@${creator.instagramData.profile.username}` 
                : 'Instagram Profile';
        }
        return 'Unknown Creator';
    };

    const getCreatorImage = () => {
        if (creator.platform === 'youtube' && creator.data?.channelInfo?.thumbnailUrl) {
            return creator.data.channelInfo.thumbnailUrl;
        }
        if (creator.platform === 'instagram' && creator.instagramData?.profile?.profile_pic_url) {
            return creator.instagramData.profile.profile_pic_url;
        }
        return '';
    };

    const getCreatorStats = () => {
        if (creator.platform === 'youtube' && creator.data?.channelInfo) {
            const channelInfo = creator.data.channelInfo;
            return {
                subscribers: channelInfo.subscriberCount?.toLocaleString() || '0',
                content: `${channelInfo.videoCount?.toLocaleString() || '0'} videos`
            };
        }
        if (creator.platform === 'instagram' && creator.instagramData?.profile) {
            const profile = creator.instagramData.profile;
            return {
                subscribers: profile.follower_count?.toLocaleString() || '0',
                content: `${profile.media_count?.toLocaleString() || '0'} posts`
            };
        }
        return { subscribers: '0', content: '0 items' };
    };

    const getCreatorProfileUrl = () => {
        if (creator.platform === 'youtube' && creator.data?.channelInfo?.channelUrl) {
            return creator.data.channelInfo.channelUrl;
        }
        if (creator.platform === 'instagram' && creator.instagramData?.profile?.username) {
            return `https://www.instagram.com/${creator.instagramData.profile.username}/`;
        }
        return null;
    };

    const getStatusInfo = () => {
        if (creator.platform === 'youtube') {
            if (creator.data?.status === 'processing') {
                return {
                    text: `Processing... ${creator.data.progress || 0}%`,
                    color: 'text-blue-600',
                    icon: null
                };
            }
            if (creator.data?.status === 'completed') {
                return {
                    text: 'Analysis Complete',
                    color: 'text-green-600',
                    icon: <CheckCircle2 className="w-4 h-4" />
                };
            }
            return {
                text: 'Pending Analysis',
                color: 'text-gray-500',
                icon: null
            };
        }
        
        // Instagram
        if (creator.instagramData?.status === 'processing') {
            return {
                text: `Processing... ${creator.instagramData.progress || 0}%`,
                color: 'text-blue-600',
                icon: null
            };
        }
        if (creator.instagramData?.status === 'completed') {
            return {
                text: 'Analysis Complete',
                color: 'text-green-600',
                icon: <CheckCircle2 className="w-4 h-4" />
            };
        }
        return {
            text: 'Pending Analysis',
            color: 'text-gray-500',
            icon: null
        };
    };


    const creatorName = getCreatorName();
    const creatorImage = getCreatorImage();
    const stats = getCreatorStats();
    const status = getStatusInfo();
    const profileUrl = getCreatorProfileUrl();
    const PlatformIcon = creator.platform === 'youtube' ? Youtube : Instagram;
    const platformColor = creator.platform === 'youtube' ? 'text-red-600' : 'text-pink-600';

    const handlePlatformClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (profileUrl) {
            window.open(profileUrl, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                {!imageError && creatorImage ? (
                    <img
                        src={creatorImage}
                        alt={`${creatorName} profile`}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                        <PlatformIcon className={`w-6 h-6 ${platformColor}`} />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {creatorName}
                    </h3>
                    <PlatformIcon className={`w-4 h-4 ${platformColor} flex-shrink-0`} />
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {stats.subscribers}
                    </span>
                    <span className="flex items-center">
                        <Video className="w-4 h-4 mr-1" />
                        {stats.content}
                    </span>
                </div>
                
                <div className={`flex items-center space-x-1 text-sm mt-1 ${status.color}`}>
                    {status.icon}
                    <span>{status.text}</span>
                </div>
            </div>

            {profileUrl && (
                <button
                    onClick={handlePlatformClick}
                    className={`
                        flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200
                        ${creator.platform === 'youtube' 
                            ? 'bg-red-50 hover:bg-red-100 text-red-600' 
                            : 'bg-pink-50 hover:bg-pink-100 text-pink-600'
                        }
                        opacity-100
                    `}
                    title={`Visit ${creator.platform === 'youtube' ? 'YouTube' : 'Instagram'} profile`}
                    aria-label={`Visit ${creatorName} on ${creator.platform === 'youtube' ? 'YouTube' : 'Instagram'}`}
                >
                    <PlatformIcon className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}