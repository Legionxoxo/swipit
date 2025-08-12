import { useState, useRef, useEffect } from 'react';
import { apiService } from '../../services';
import { userService } from '../../services/userService';
import { transcriptionService } from '../../services/transcriptionService';
import VideoDualSidebar from './VideoDualSidebar';
import VideoActionMenu from './VideoActionMenu';
import { Youtube } from 'lucide-react';

interface VideoActionsProps {
    videoId: string;
    videoTitle: string;
    channelName: string;
    thumbnailUrl: string;
    videoUrl: string;
    platform?: string;
    layout?: 'overlay' | 'inline';
}

export default function VideoActions({ 
    videoId, 
    videoTitle, 
    channelName: _channelName, 
    thumbnailUrl: _thumbnailUrl, 
    videoUrl: _videoUrl,
    platform = 'youtube',
    layout = 'overlay'
}: VideoActionsProps) {
    const [isFavorite, setIsFavorite] = useState<boolean>(false);
    const [starRating, setStarRating] = useState<number>(0);
    const [showMenu, setShowMenu] = useState<boolean>(false);
    const [showCommentSidebar, setShowCommentSidebar] = useState<boolean>(false);
    const [showTranscriptionSidebar, setShowTranscriptionSidebar] = useState<boolean>(false);
    const [comment, setComment] = useState<string>('');
    const [hasComment, setHasComment] = useState<boolean>(false);
    const [hasTranscription, setHasTranscription] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const menuRef = useRef<HTMLDivElement>(null);

    // Load user video interactions on component mount
    useEffect(() => {
        loadVideoInteractions();
        checkTranscription();
    }, [videoId]);

    // Click outside handler
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

    const loadVideoInteractions = async () => {
        try {
            setIsLoading(true);
            setError('');
            
            const userId = userService.getUserId();
            const interactions = await apiService.getUserVideoInteractions(userId);
            
            // Find interaction for this specific video
            const videoInteraction = interactions.find(
                (interaction: any) => interaction.video_id === videoId && interaction.platform === platform
            );

            if (videoInteraction) {
                const hasCommentValue = !!videoInteraction.comment && videoInteraction.comment.trim().length > 0;
                setStarRating(videoInteraction.star_rating || 0);
                setComment(videoInteraction.comment || '');
                setIsFavorite(videoInteraction.is_favorite || false);
                setHasComment(hasCommentValue);
                
                // Debug logging for comment detection
                console.debug('VideoActions interaction found:', {
                    videoId,
                    comment: videoInteraction.comment ? `${videoInteraction.comment.length} chars` : 'none',
                    hasComment: hasCommentValue,
                    starRating: videoInteraction.star_rating,
                    isFavorite: videoInteraction.is_favorite
                });
            } else {
                // No interaction found, set defaults
                setStarRating(0);
                setComment('');
                setIsFavorite(false);
                setHasComment(false);
                
                console.debug('VideoActions no interaction found for:', { videoId, platform });
            }

        } catch (error) {
            console.error('Error loading video interactions:', error);
            // Don't show error for missing interaction data - it's optional
            // But log more details for debugging
            console.error('Video ID:', videoId, 'Platform:', platform);
            // setError('Failed to load video data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const checkTranscription = async () => {
        try {
            const transcription = await transcriptionService.getVideoTranscription(videoId, platform);
            setHasTranscription(!!transcription && transcription.status === 'completed');
        } catch (error) {
            console.error('Error checking transcription:', error);
            setHasTranscription(false);
        } finally {
            // Required by architecture rules
        }
    };

    const handleHeartClick = async () => {
        try {
            setError('');
            const userId = userService.getUserId();
            const newFavoriteState = !isFavorite;

            // Recording video interaction

            await apiService.updateVideoInteraction(userId, videoId, platform, {
                isFavorite: newFavoriteState
            });

            setIsFavorite(newFavoriteState);
        } catch (error) {
            console.error('Error updating favorite status:', error);
            setError('Failed to update favorite. Please try again.');
        } finally {
            // Required by architecture rules
        }
    };

    const handleStarClick = async (rating: number) => {
        try {
            setError('');
            const userId = userService.getUserId();
            const newRating = rating === starRating ? 0 : rating;

            await apiService.updateVideoInteraction(userId, videoId, platform, {
                starRating: newRating
            });

            setStarRating(newRating);
            setShowMenu(false);
        } catch (error) {
            console.error('Error updating star rating:', error);
            setError('Failed to update rating. Please try again.');
        } finally {
            // Required by architecture rules
        }
    };

    const handleCommentSubmit = async () => {
        try {
            setError('');
            const userId = userService.getUserId();
            const trimmedComment = comment.trim();

            await apiService.updateVideoInteraction(userId, videoId, platform, {
                comment: trimmedComment || undefined
            });

            const hasCommentAfterSave = !!trimmedComment && trimmedComment.length > 0;
            setComment(trimmedComment);
            setHasComment(hasCommentAfterSave);
            setShowCommentSidebar(false);
            setShowTranscriptionSidebar(false);
            
            // Debug logging for comment save
            console.debug('Comment saved:', {
                videoId,
                comment: trimmedComment ? `${trimmedComment.length} chars` : 'deleted',
                hasComment: hasCommentAfterSave
            });
        } catch (error) {
            console.error('Error updating comment:', error);
            setError('Failed to save comment. Please try again.');
        } finally {
            // Required by architecture rules
        }
    };


    const handleSidebarCommentClick = () => {
        setShowCommentSidebar(true);
    };

    const handleSidebarTranscriptionClick = () => {
        setShowTranscriptionSidebar(true);
    };

    const handleToggleComment = () => {
        setShowCommentSidebar(!showCommentSidebar);
    };

    const handleToggleTranscription = () => {
        setShowTranscriptionSidebar(!showTranscriptionSidebar);
    };

    const handleCloseSidebar = () => {
        setShowCommentSidebar(false);
        setShowTranscriptionSidebar(false);
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="absolute top-2 right-2 flex space-x-2">
                <div className="p-2 rounded-full bg-black bg-opacity-50">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Error message */}
            {error && (
                <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-xs p-2 rounded">
                    {error}
                </div>
            )}


            {/* Dual Sidebar for Comments and Transcriptions */}
            <VideoDualSidebar
                isCommentOpen={showCommentSidebar}
                isTranscriptionOpen={showTranscriptionSidebar}
                onToggleComment={handleToggleComment}
                onToggleTranscription={handleToggleTranscription}
                onClose={handleCloseSidebar}
                videoId={videoId}
                videoTitle={videoTitle}
                comment={comment}
                setComment={setComment}
                onSubmit={handleCommentSubmit}
                hasComment={hasComment}
                platform={platform}
            />

            {/* Icons: YouTube, Comment, Transcription, Heart, Menu */}
            <div className={layout === 'inline' 
                ? "flex space-x-2" 
                : "absolute top-2 right-2 flex space-x-2"
            }>
                {/* YouTube Link Icon */}
                <a
                    href={_videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-full transition-all duration-200 cursor-pointer ${
                        layout === 'inline'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-red-600 bg-opacity-90 hover:bg-opacity-100'
                    }`}
                    title="Watch on YouTube"
                >
                    <Youtube className="w-5 h-5 text-white" />
                </a>
                {/* Comment Icon */}
                <button
                    onClick={handleSidebarCommentClick}
                    className={`p-2 rounded-full transition-all duration-200 ${
                        layout === 'inline' 
                            ? (showCommentSidebar
                                ? 'bg-blue-500 hover:bg-blue-600'
                                : hasComment 
                                    ? 'bg-yellow-500 hover:bg-yellow-600' 
                                    : 'bg-gray-200 hover:bg-gray-300')
                            : (showCommentSidebar
                                ? 'bg-blue-500 bg-opacity-90 hover:bg-opacity-100'
                                : hasComment 
                                    ? 'bg-yellow-500 bg-opacity-90 hover:bg-opacity-100' 
                                    : 'bg-black bg-opacity-50 hover:bg-opacity-70')
                    }`}
                    title={hasComment ? "View/Edit Comment" : "Add Comment"}
                >
                    <svg className={`w-5 h-5 ${layout === 'inline' ? 'text-gray-700' : 'text-white'}`} fill={hasComment ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                </button>

                {/* Transcription Icon */}
                <button
                    onClick={handleSidebarTranscriptionClick}
                    className={`p-2 rounded-full transition-all duration-200 ${
                        layout === 'inline' 
                            ? (hasTranscription
                                ? 'bg-green-500 hover:bg-green-600'
                                : 'bg-gray-200 hover:bg-gray-300')
                            : (hasTranscription
                                ? 'bg-green-500 bg-opacity-90 hover:bg-opacity-100'
                                : 'bg-black bg-opacity-50 hover:bg-opacity-70')
                    }`}
                    title={hasTranscription ? "View Transcription" : "Generate Transcription"}
                >
                    <svg className={`w-5 h-5 ${layout === 'inline' ? 'text-gray-700' : 'text-white'}`} fill={hasTranscription ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                </button>

                {/* Heart Icon */}
                <button
                    onClick={handleHeartClick}
                    className={`p-2 rounded-full transition-all duration-200 ${
                        layout === 'inline' 
                            ? 'bg-gray-200 hover:bg-gray-300'
                            : 'bg-black bg-opacity-50 hover:bg-opacity-70'
                    }`}
                    title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                >
                    <svg 
                        className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : (layout === 'inline' ? 'text-gray-700' : 'text-white')}`} 
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
                        className={`p-2 rounded-full transition-all duration-200 ${
                            layout === 'inline' 
                                ? 'bg-gray-200 hover:bg-gray-300'
                                : 'bg-black bg-opacity-50 hover:bg-opacity-70'
                        }`}
                        title="Options"
                    >
                        <svg className={`w-5 h-5 ${layout === 'inline' ? 'text-gray-700' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                        </svg>
                    </button>

                    {/* Menu Dropdown */}
                    {showMenu && (
                        <VideoActionMenu
                            videoId={videoId}
                            starRating={starRating}
                            onStarClick={handleStarClick}
                            onAddCommentClick={handleSidebarCommentClick}
                        />
                    )}
                </div>
            </div>
        </>
    );
}