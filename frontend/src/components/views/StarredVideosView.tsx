import VideoCard from '../video/VideoCard';
import { localStorageService } from '../../services/localStorage';
import type { VideoData, StarredVideo } from '../../types/api';

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
    videos: StarredVideo[];
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map(video => {
                    // Convert StarredVideo to VideoData format
                    const videoData: VideoData = {
                        videoId: video.videoId,
                        title: video.title,
                        description: video.note || '',
                        thumbnailUrl: video.thumbnailUrl,
                        videoUrl: video.videoUrl,
                        uploadDate: video.starredAt,
                        duration: 'PT0S', // Default duration
                        viewCount: 0, // Default view count
                        likeCount: 0,
                        commentCount: 0,
                        categoryId: '28'
                    };
                    return (
                        <VideoCard 
                            key={video.videoId} 
                            video={videoData} 
                            channelName={video.channelName} 
                        />
                    );
                })}
            </div>
        </div>
    );
}

export default function StarredVideosView() {
    const starredVideos = localStorageService.getStarredVideos();
    
    if (starredVideos.length === 0) {
        return (
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Starred Videos</h2>
                <div className="text-center py-12">
                    <p className="text-gray-600">No starred videos yet.</p>
                </div>
            </div>
        );
    }

    // Group videos by star rating (5 to 1)
    const videosByRating = {
        5: starredVideos.filter(video => video.rating === 5),
        4: starredVideos.filter(video => video.rating === 4),
        3: starredVideos.filter(video => video.rating === 3),
        2: starredVideos.filter(video => video.rating === 2),
        1: starredVideos.filter(video => video.rating === 1)
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Starred Videos</h2>
            <div className="space-y-12">
                {[5, 4, 3, 2, 1].map(rating => (
                    <StarredVideosSection
                        key={rating}
                        rating={rating}
                        videos={videosByRating[rating as keyof typeof videosByRating]}
                    />
                ))}
            </div>
        </div>
    );
}