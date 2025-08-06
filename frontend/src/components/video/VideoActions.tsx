import { useState, useRef, useEffect } from 'react';
import { localStorageService } from '../../services/localStorage';
import VideoCommentOverlay from './VideoCommentOverlay';
import VideoActionMenu from './VideoActionMenu';

interface VideoActionsProps {
    videoId: string;
    videoTitle: string;
    channelName: string;
    thumbnailUrl: string;
    videoUrl: string;
}

export default function VideoActions({ 
    videoId, 
    videoTitle, 
    channelName, 
    thumbnailUrl, 
    videoUrl 
}: VideoActionsProps) {
    const [isFavorite, setIsFavorite] = useState<boolean>(localStorageService.isVideoFavorite(videoId));
    const [starRating, setStarRating] = useState<number>(localStorageService.getVideoStarRating(videoId));
    const [showMenu, setShowMenu] = useState<boolean>(false);
    const [showComment, setShowComment] = useState<boolean>(false);
    const [comment, setComment] = useState<string>('');
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const existingComment = localStorageService.getVideoComment(videoId);
        setComment(existingComment?.comment || '');
    }, [videoId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
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
                localStorageService.removeFavoriteVideo(videoId);
                setIsFavorite(false);
            } else {
                localStorageService.addFavoriteVideo({
                    videoId,
                    title: videoTitle,
                    channelName,
                    thumbnailUrl,
                    videoUrl,
                    addedAt: new Date().toISOString()
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
                localStorageService.removeStarredVideo(videoId);
                setStarRating(0);
            } else {
                // Add or update star rating
                localStorageService.addStarredVideo({
                    videoId,
                    title: videoTitle,
                    channelName,
                    thumbnailUrl,
                    videoUrl,
                    rating: rating,
                    starredAt: new Date().toISOString()
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
                localStorageService.addOrUpdateVideoComment(videoId, comment.trim());
            } else {
                localStorageService.removeVideoComment(videoId);
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

    return (
        <>
            {/* Floating comment overlay */}
            {showComment && (
                <VideoCommentOverlay
                    videoId={videoId}
                    comment={comment}
                    setComment={setComment}
                    onClose={() => setShowComment(false)}
                    onSubmit={handleCommentSubmit}
                />
            )}

            {/* Icons: Comment, Heart, Menu */}
            <div className="absolute top-2 right-2 flex space-x-2">
                {/* Comment Icon - Only show if video has a comment */}
                {localStorageService.hasVideoComment(videoId) && (
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
                        <VideoActionMenu
                            videoId={videoId}
                            starRating={starRating}
                            onStarClick={handleStarClick}
                            onAddCommentClick={handleAddCommentClick}
                        />
                    )}
                </div>
            </div>
        </>
    );
}