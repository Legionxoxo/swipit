import { useState } from 'react';

interface InstagramReel {
    reel_id: string;
    reel_shortcode: string;
    reel_url: string;
    reel_thumbnail_url: string;
    reel_caption: string;
    reel_likes: number;
    reel_comments: number;
    reel_views: number;
    reel_date_posted: string;
    reel_duration: number;
    reel_hashtags: string[];
    reel_mentions: string[];
    embed_link?: string;
    post_link?: string;
    hashtags?: string[];
}

interface ReelThumbnailProps {
    reel: InstagramReel;
    followerCount?: number;
}

export default function ReelThumbnail({ reel, followerCount }: ReelThumbnailProps) {
    const [imageError, setImageError] = useState(false);

    const formatDuration = (seconds: number): string => {
        if (seconds < 60) {
            return `${seconds}s`;
        }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const getEngagementRate = (): number => {
        if (!followerCount || followerCount === 0) return 0;
        const totalEngagement = reel.reel_likes + reel.reel_comments;
        return (totalEngagement / followerCount) * 100;
    };

    const getEngagementColor = (rate: number): string => {
        if (rate >= 10) return 'bg-red-500';
        if (rate >= 7) return 'bg-orange-500';
        if (rate >= 4) return 'bg-yellow-500';
        if (rate >= 2) return 'bg-blue-500';
        return 'bg-gray-500';
    };

    const engagementRate = getEngagementRate();

    return (
        <div className="relative aspect-[9/16] bg-gray-100">
            {reel.reel_thumbnail_url && !imageError ? (
                <img
                    src={reel.reel_thumbnail_url}
                    alt="Instagram Reel"
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                    loading="lazy"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400">
                    <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.017 0C8.396 0 7.853.016 6.625.071 5.398.126 4.56.336 3.842.637c-.75.293-1.386.683-2.019 1.316C1.19 2.587.8 3.223.507 3.973c-.301.718-.511 1.556-.566 2.783C-.054 7.984-.072 8.527-.072 12.148s.018 4.164.072 5.392c.055 1.227.265 2.065.566 2.783.293.75.683 1.386 1.316 2.019.633.633 1.269 1.023 2.019 1.316.718.301 1.556.511 2.783.566 1.228.055 1.771.073 5.392.073s4.164-.018 5.392-.073c1.227-.055 2.065-.265 2.783-.566.75-.293 1.386-.683 2.019-1.316.633-.633 1.023-1.269 1.316-2.019.301-.718.511-1.556.566-2.783.055-1.228.073-1.771.073-5.392s-.018-4.164-.073-5.392c-.055-1.227-.265-2.065-.566-2.783-.293-.75-.683-1.386-1.316-2.019C18.598.8 17.962.41 17.212.117 16.494-.184 15.656-.394 14.429-.449 13.201-.504 12.658-.522 9.037-.522H12.017z"/>
                        <path d="M12.017 5.838a6.31 6.31 0 100 12.62 6.31 6.31 0 000-12.62zm0 10.408a4.098 4.098 0 110-8.196 4.098 4.098 0 010 8.196z"/>
                        <circle cx="18.406" cy="5.594" r="1.44"/>
                    </svg>
                </div>
            )}

            {/* Duration Badge */}
            {reel.reel_duration > 0 && (
                <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(reel.reel_duration)}
                </div>
            )}

            {/* Engagement Rate Badge */}
            {followerCount && followerCount > 0 && engagementRate > 0 && (
                <div className={`absolute bottom-2 left-2 ${getEngagementColor(engagementRate)} text-white text-xs px-2 py-1 rounded font-medium`}>
                    {engagementRate.toFixed(1)}% ER
                </div>
            )}

            {/* Play Button Overlay */}
            <a 
                href={reel.reel_url || reel.post_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-30 transition-all group"
                onClick={(e) => e.stopPropagation()}
            >
                <svg className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
            </a>
        </div>
    );
}