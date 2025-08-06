import { useState, useEffect } from 'react';
import VideoCard from '../video/VideoCard';
import { apiService } from '../../services/api';
import { userService } from '../../services/userService';
import type { VideoData } from '../../types/api';

export default function FavoriteVideosView() {
    const [favoriteVideos, setFavoriteVideos] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        loadFavoriteVideos();
    }, []);

    const loadFavoriteVideos = async () => {
        try {
            setError('');
            const userId = userService.getUserId();
            const videoInteractions = await apiService.getUserVideoInteractions(userId);
            
            // Filter for favorite videos only
            const favoriteVideoInteractions = videoInteractions.filter(
                interaction => interaction.is_favorite === true
            );

            setFavoriteVideos(favoriteVideoInteractions);
        } catch (error) {
            console.error('Error loading favorite videos:', error);
            setError('Failed to load favorite videos. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Favorite Videos</h2>
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Favorite Videos</h2>
                <div className="text-center py-12">
                    <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

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
                {favoriteVideos.map(interaction => {
                    // Convert interaction to VideoData format
                    const videoData: VideoData = {
                        videoId: interaction.video_id,
                        title: `Video ${interaction.video_id.slice(0, 8)}...`, // We don't have full video data
                        description: interaction.comment || '',
                        thumbnailUrl: '', // We don't have thumbnail URL in interactions
                        videoUrl: `https://youtube.com/watch?v=${interaction.video_id}`,
                        uploadDate: interaction.created_at,
                        duration: 'PT0S',
                        viewCount: 0,
                        likeCount: 0,
                        commentCount: 0,
                        categoryId: '28'
                    };
                    return (
                        <VideoCard 
                            key={interaction.video_id} 
                            video={videoData} 
                            channelName="Unknown Channel" // We don't have channel info in interactions
                        />
                    );
                })}
            </div>
        </div>
    );
}