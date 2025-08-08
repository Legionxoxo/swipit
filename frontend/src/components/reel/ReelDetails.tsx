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

interface ReelDetailsProps {
    reel: InstagramReel;
    compact?: boolean;
}

export default function ReelDetails({ reel, compact = false }: ReelDetailsProps) {
    const formatNumber = (num: number | undefined): string => {
        if (num === undefined || num === null) {
            return '0';
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    const formatDate = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - date.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) return '1 day ago';
            if (diffDays < 30) return `${diffDays} days ago`;
            if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
            return `${Math.floor(diffDays / 365)} years ago`;
        } catch {
            return 'Recently';
        }
    };

    // Use hashtags from either field, prioritizing reel_hashtags
    const hashtags = reel.reel_hashtags?.length > 0 ? reel.reel_hashtags : (reel.hashtags || []);

    if (compact) {
        return (
            <div className="flex flex-col justify-between h-24">
                <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                        {reel.reel_caption || 'Instagram Reel'}
                    </p>
                    <div className="flex items-center space-x-3 text-xs text-gray-600">
                        <span>❤️ {formatNumber(reel.reel_likes)}</span>
                        <span>💬 {formatNumber(reel.reel_comments)}</span>
                        {reel.reel_views > 0 && (
                            <span>👁️ {formatNumber(reel.reel_views)}</span>
                        )}
                    </div>
                </div>
                <div className="text-xs text-gray-500">
                    {formatDate(reel.reel_date_posted)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 flex-1 flex flex-col">
            {/* Caption */}
            <p className="text-sm text-gray-800 mb-3 line-clamp-3 flex-1">
                {reel.reel_caption || 'Instagram Reel'}
            </p>
            
            {/* Engagement Stats */}
            <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        {formatNumber(reel.reel_likes)}
                    </span>
                    <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {formatNumber(reel.reel_comments)}
                    </span>
                    {reel.reel_views > 0 && (
                        <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {formatNumber(reel.reel_views)}
                        </span>
                    )}
                </div>
            </div>
            
            {/* Hashtags */}
            {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {hashtags.slice(0, 3).map((hashtag: string, idx: number) => (
                        <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            #{hashtag}
                        </span>
                    ))}
                    {hashtags.length > 3 && (
                        <span className="text-xs text-gray-500">+{hashtags.length - 3}</span>
                    )}
                </div>
            )}

            {/* Footer with date */}
            <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
                <span>{formatDate(reel.reel_date_posted)}</span>
                {/* Platform indicator */}
                <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.017 0C8.396 0 7.853.016 6.625.071 5.398.126 4.56.336 3.842.637c-.75.293-1.386.683-2.019 1.316C1.19 2.587.8 3.223.507 3.973c-.301.718-.511 1.556-.566 2.783C-.054 7.984-.072 8.527-.072 12.148s.018 4.164.072 5.392c.055 1.227.265 2.065.566 2.783.293.75.683 1.386 1.316 2.019.633.633 1.269 1.023 2.019 1.316.718.301 1.556.511 2.783.566 1.228.055 1.771.073 5.392.073s4.164-.018 5.392-.073c1.227-.055 2.065-.265 2.783-.566.75-.293 1.386-.683 2.019-1.316.633-.633 1.023-1.269 1.316-2.019.301-.718.511-1.556.566-2.783.055-1.228.073-1.771.073-5.392s-.018-4.164-.073-5.392c-.055-1.227-.265-2.065-.566-2.783-.293-.75-.683-1.386-1.316-2.019C18.598.8 17.962.41 17.212.117 16.494-.184 15.656-.394 14.429-.449 13.201-.504 12.658-.522 9.037-.522H12.017z"/>
                        <path d="M12.017 5.838a6.31 6.31 0 100 12.62 6.31 6.31 0 000-12.62zm0 10.408a4.098 4.098 0 110-8.196 4.098 4.098 0 010 8.196z"/>
                        <circle cx="18.406" cy="5.594" r="1.44"/>
                    </svg>
                    <span>Instagram</span>
                </div>
            </div>
        </div>
    );
}