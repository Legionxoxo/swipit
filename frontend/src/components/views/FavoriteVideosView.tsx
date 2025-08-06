import VideoCard from '../video/VideoCard';
import { localStorageService } from '../../services/localStorage';
import type { VideoData } from '../../types/api';

export default function FavoriteVideosView() {
    const favoriteVideos = localStorageService.getFavoriteVideos();

    if (favoriteVideos.length === 0) {
        return (
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Favorite Videos</h2>
                <div className="text-center py-12">
                    <p className="text-gray-600">No favorite videos yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Favorite Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {favoriteVideos.map(video => {
                    // Convert FavoriteVideo to VideoData format
                    const videoData: VideoData = {
                        videoId: video.videoId,
                        title: video.title,
                        description: '',
                        thumbnailUrl: video.thumbnailUrl,
                        videoUrl: video.videoUrl,
                        uploadDate: video.addedAt,
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