import VideoCard from '../video/VideoCard';
import ReelCard from '../reel/ReelCard';
import { userService } from '../../services/userService';
import { useVideoInteractionsPagination } from '../../hooks/useVideoInteractionsPagination';
import { useInfiniteScrollObserver } from '../../hooks/useInfiniteScrollObserver';
import type { VideoData } from '../../types/api';

export default function FavoriteVideosView() {
    const userId = userService.getUserId();
    
    const {
        data: favoriteVideos,
        loading: isLoading,
        error,
        hasMore,
        loadMore
    } = useVideoInteractionsPagination({
        userId,
        filter: 'favorites',
        pageSize: 20
    });

    const { loadMoreRef } = useInfiniteScrollObserver({
        hasMore,
        isLoading,
        onLoadMore: loadMore
    });

    if (isLoading && favoriteVideos.length === 0) {
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

    if (favoriteVideos.length === 0 && !isLoading) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">No favorite videos yet.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="space-y-4">
                {favoriteVideos.map(interaction => {
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
                                key={`reel-${interaction.video_id}`}
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
                                key={`video-${interaction.video_id}`}
                                video={videoData} 
                                channelName={interaction.channel_name || 'Unknown Channel'}
                                subscriberCount={interaction.subscriber_count || 0}
                            />
                        );
                    }
                })}
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