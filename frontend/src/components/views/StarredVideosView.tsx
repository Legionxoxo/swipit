import VideoCard from '../video/VideoCard';
import ReelCard from '../reel/ReelCard';
import { userService } from '../../services/userService';
import { useVideoInteractionsPagination } from '../../hooks/useVideoInteractionsPagination';
import { useInfiniteScrollObserver } from '../../hooks/useInfiniteScrollObserver';
import type { VideoData } from '../../types/api';

interface StarRatingDisplayProps {
    rating: number;
}

function StarRatingDisplay({ rating }: StarRatingDisplayProps) {
    const getStarIcon = (filled: boolean = true) => (
        <svg 
            className={`w-5 h-5 inline ${filled ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            fill={filled ? 'currentColor' : 'none'}
            stroke="currentColor" 
            viewBox="0 0 24 24"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
    );

    return (
        <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => getStarIcon(star <= rating))}
        </div>
    );
}

interface StarredVideosSectionProps {
    rating: number;
    videos: any[];
}

function StarredVideosSection({ rating, videos }: StarredVideosSectionProps) {
    if (videos.length === 0) return null;
    
    return (
        <div>
            <div className="flex items-center space-x-3 mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                    {rating} Star Videos
                </h3>
                <StarRatingDisplay rating={rating} />
                <span className="text-sm text-gray-500">
                    ({videos.length} video{videos.length !== 1 ? 's' : ''})
                </span>
            </div>
            
            <div className="space-y-4">
                {videos.map(interaction => {
                    if (interaction.platform === 'instagram') {
                        // Convert interaction to Instagram reel format
                        const reelData = {
                            reel_id: interaction.video_id,
                            reel_shortcode: interaction.video_id,
                            reel_url: interaction.video_url || interaction.post_link || '',
                            reel_thumbnail_url: interaction.thumbnail_url || '',
                            reel_caption: interaction.title || interaction.description || (interaction.channel_name ? `Post by ${interaction.channel_name}` : `Instagram Post`),
                            reel_likes: interaction.like_count || 0,
                            reel_comments: interaction.comment_count || 0,
                            reel_views: interaction.view_count || 0,
                            reel_date_posted: interaction.upload_date || interaction.created_at,
                            reel_duration: 0,
                            reel_hashtags: [],
                            reel_mentions: [],
                            embed_link: interaction.embed_link,
                            post_link: interaction.video_url || interaction.post_link,
                            hashtags: []
                        };
                        
                        return (
                            <ReelCard
                                key={`starred-reel-${interaction.video_id}-${interaction.star_rating}`}
                                reel={reelData}
                                creatorName={interaction.channel_name || 'Unknown Creator'}
                                followerCount={interaction.subscriber_count || 0}
                            />
                        );
                    } else {
                        // Convert interaction to YouTube video format
                        const videoData: VideoData = {
                            videoId: interaction.video_id,
                            title: interaction.title || `Video ${interaction.video_id.slice(0, 8)}...`,
                            description: interaction.description || '',
                            thumbnailUrl: interaction.thumbnail_url || '',
                            videoUrl: interaction.video_url || `https://youtube.com/watch?v=${interaction.video_id}`,
                            uploadDate: interaction.upload_date || interaction.created_at,
                            duration: interaction.duration || 'PT0S',
                            viewCount: interaction.view_count || 0,
                            likeCount: interaction.like_count || 0,
                            commentCount: interaction.comment_count || 0,
                            categoryId: interaction.category_id || '28'
                        };
                        
                        return (
                            <VideoCard 
                                key={`starred-video-${interaction.video_id}-${interaction.star_rating}`}
                                video={videoData} 
                                channelName={interaction.channel_name || 'Unknown Channel'}
                                subscriberCount={interaction.subscriber_count || 0}
                            />
                        );
                    }
                })}
            </div>
        </div>
    );
}

export default function StarredVideosView() {
    const userId = userService.getUserId();
    
    const {
        data: starredVideos,
        loading: isLoading,
        error,
        hasMore,
        loadMore
    } = useVideoInteractionsPagination({
        userId,
        filter: 'starred',
        pageSize: 20
    });

    const { loadMoreRef } = useInfiniteScrollObserver({
        hasMore,
        isLoading,
        onLoadMore: loadMore
    });

    if (isLoading && starredVideos.length === 0) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                    {error}
                </div>
            </div>
        );
    }

    if (starredVideos.length === 0 && !isLoading) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">No starred videos yet.</p>
            </div>
        );
    }

    // Group videos by star rating (5 to 1)
    const videosByRating = {
        5: starredVideos.filter(video => video.star_rating === 5),
        4: starredVideos.filter(video => video.star_rating === 4),
        3: starredVideos.filter(video => video.star_rating === 3),
        2: starredVideos.filter(video => video.star_rating === 2),
        1: starredVideos.filter(video => video.star_rating === 1)
    };

    return (
        <div>
            <div className="space-y-12">
                {[5, 4, 3, 2, 1].map(rating => (
                    <StarredVideosSection
                        key={rating}
                        rating={rating}
                        videos={videosByRating[rating as keyof typeof videosByRating]}
                    />
                ))}
            </div>
            
            {/* Infinite scroll trigger */}
            {hasMore && (
                <div ref={loadMoreRef} className="flex justify-center py-8">
                    {isLoading ? (
                        <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-gray-600">Loading more videos...</span>
                        </div>
                    ) : (
                        <div className="h-4" />
                    )}
                </div>
            )}
        </div>
    );
}