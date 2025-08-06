import { useState, useRef, useEffect } from 'react';
import type { VideoData } from '../types/api';
import { localStorageService } from '../services/localStorage';

interface VideoCardProps {
    video: VideoData;
    channelName: string;
}

export default function VideoCard({ video, channelName }: VideoCardProps) {
    const [isFavorite, setIsFavorite] = useState<boolean>(localStorageService.isVideoFavorite(video.videoId));
    const [starRating, setStarRating] = useState<number>(localStorageService.getVideoStarRating(video.videoId));
    const [showMenu, setShowMenu] = useState<boolean>(false);
    const [showComment, setShowComment] = useState<boolean>(false);
    const [comment, setComment] = useState<string>('');
    const menuRef = useRef<HTMLDivElement>(null);
    const commentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const existingComment = localStorageService.getVideoComment(video.videoId);
        setComment(existingComment?.comment || '');
    }, [video.videoId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
            if (commentRef.current && !commentRef.current.contains(event.target as Node)) {
                setShowComment(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleHeartClick = () => {
        try {
            if (isFavorite) {
                localStorageService.removeFavoriteVideo(video.videoId);
                setIsFavorite(false);
            } else {
                localStorageService.addFavoriteVideo({
                    videoId: video.videoId,
                    title: video.title,
                    channelName: channelName,
                    thumbnailUrl: video.thumbnailUrl,
                    videoUrl: video.videoUrl
                });
                setIsFavorite(true);
            }
        } catch (error) {
            console.error('Error updating favorite status:', error);
        } finally {
            // Required by architecture rules
        }
    };

    const handleStarClick = (rating: number) => {
        try {
            if (rating === starRating) {
                // Remove star rating
                localStorageService.removeStarredVideo(video.videoId);
                setStarRating(0);
            } else {
                // Add or update star rating
                localStorageService.addStarredVideo({
                    videoId: video.videoId,
                    title: video.title,
                    channelName: channelName,
                    thumbnailUrl: video.thumbnailUrl,
                    videoUrl: video.videoUrl,
                    rating: rating
                });
                setStarRating(rating);
            }
            setShowMenu(false);
        } catch (error) {
            console.error('Error updating star rating:', error);
        } finally {
            // Required by architecture rules
        }
    };

    const handleCommentSubmit = () => {
        try {
            if (comment.trim()) {
                localStorageService.addOrUpdateVideoComment(video.videoId, comment.trim());
            } else {
                localStorageService.removeVideoComment(video.videoId);
            }
            setShowComment(false);
        } catch (error) {
            console.error('Error updating comment:', error);
        } finally {
            // Required by architecture rules
        }
    };

    const handleAddCommentClick = () => {
        setShowComment(true);
    };
    const formatNumber = (num: number): string => {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toString();
    };

    const formatDuration = (duration: string): string => {
        try {
            const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (!match) return duration;
            
            const hours = parseInt(match[1] || '0');
            const minutes = parseInt(match[2] || '0');
            const seconds = parseInt(match[3] || '0');
            
            if (hours > 0) {
                return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        } catch {
            return duration;
        }
    };

    const getPerformanceTag = (viewCount: number): { label: string; color: string } => {
        if (viewCount > 1000000) return { label: 'Viral', color: 'bg-red-100 text-red-800' };
        if (viewCount > 100000) return { label: 'Very High', color: 'bg-orange-100 text-orange-800' };
        if (viewCount > 10000) return { label: 'High', color: 'bg-yellow-100 text-yellow-800' };
        if (viewCount > 1000) return { label: 'Medium', color: 'bg-green-100 text-green-800' };
        return { label: 'Low', color: 'bg-gray-100 text-gray-800' };
    };

    const performanceTag = getPerformanceTag(video.viewCount);

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 relative flex flex-col h-full">
            {/* Floating comment overlay */}
            {showComment && (
                <div 
                    ref={commentRef}
                    className="absolute top-4 left-4 right-4 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 z-[100]"
                >
                    <div className="mb-2">
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Add your comment..."
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-gray-800"
                            rows={4}
                            autoFocus
                        />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                        {localStorageService.hasVideoComment(video.videoId) && (
                            <button
                                onClick={() => {
                                    localStorageService.removeVideoComment(video.videoId);
                                    setComment('');
                                    setShowComment(false);
                                }}
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
                            >
                                Delete
                            </button>
                        )}
                        <button
                            onClick={handleCommentSubmit}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
                        >
                            Save
                        </button>
                    </div>
                </div>
            )}
            <div className="relative">
                <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/480x270?text=Video';
                    }}
                />
                
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration)}
                </div>
                
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${performanceTag.color}`}>
                    {performanceTag.label}
                </div>

                {/* Icons: Comment, Heart, Menu */}
                <div className="absolute top-2 right-2 flex space-x-2">
                    {/* Comment Icon - Only show if video has a comment */}
                    {localStorageService.hasVideoComment(video.videoId) && (
                        <button
                            onClick={handleAddCommentClick}
                            className="p-2 rounded-full bg-yellow-500 bg-opacity-90 hover:bg-opacity-100 transition-all duration-200"
                            title="View/Edit Comment"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                        </button>
                    )}

                    {/* Heart Icon */}
                    <button
                        onClick={handleHeartClick}
                        className="p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all duration-200"
                        title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    >
                        <svg 
                            className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-white'}`} 
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
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all duration-200"
                            title="Options"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                            </svg>
                        </button>

                        {/* Menu Dropdown */}
                        {showMenu && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-10">
                                {/* Star Rating Section */}
                                <div className="p-4 border-b">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Rate this video</p>
                                    <div className="flex space-x-1">
                                        {[1, 2, 3, 4, 5].map((rating) => (
                                            <button
                                                key={rating}
                                                onClick={() => handleStarClick(rating)}
                                                className="p-1 hover:bg-gray-100 rounded transition-colors duration-200"
                                            >
                                                <svg 
                                                    className={`w-5 h-5 ${rating <= starRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                                    fill={rating <= starRating ? 'currentColor' : 'none'}
                                                    stroke="currentColor" 
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                </svg>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Comments Section */}
                                <button
                                    onClick={handleAddCommentClick}
                                    className="w-full p-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
                                >
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                    </svg>
                                    <span className="text-sm text-gray-700">
                                        {localStorageService.hasVideoComment(video.videoId) ? 'Edit Comment' : 'Add Comment'}
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                    {video.title}
                </h3>
                
                {video.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {video.description}
                    </p>
                )}

                <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                        <span className="font-medium">👁️</span>
                        <span>{formatNumber(video.viewCount)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                        <span className="font-medium">👍</span>
                        <span>{formatNumber(video.likeCount)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                        <span className="font-medium">💬</span>
                        <span>{formatNumber(video.commentCount)}</span>
                    </div>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                    Uploaded: {new Date(video.uploadDate).toLocaleDateString()}
                </div>

                {/* Push button to bottom */}
                <div className="mt-auto">
                    <a
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium"
                    >
                        <span className="mr-2">▶️</span>
                        Watch on YouTube
                    </a>
                </div>
            </div>
        </div>
    );
}