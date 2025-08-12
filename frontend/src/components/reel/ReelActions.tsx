import { useState, useRef, useEffect } from 'react';
import { apiService } from '../../services';
import { userService } from '../../services/userService';
import { transcriptionService } from '../../services/transcriptionService';
import VideoDualSidebar from '../video/VideoDualSidebar';
import VideoActionMenu from '../video/VideoActionMenu';

interface ReelActionsProps {
    reelId: string;
    reelTitle: string;
    thumbnailUrl: string;
    reelUrl: string;
    embedLink?: string;
    postLink?: string;
    reelCaption?: string;
    reelHashtags?: string[];
    layout?: 'overlay' | 'inline';
}

export default function ReelActions({
    reelId,
    reelTitle,
    thumbnailUrl: _thumbnailUrl,
    reelUrl: _reelUrl,
    embedLink,
    postLink,
    reelCaption,
    reelHashtags,
    layout = 'overlay'
}: ReelActionsProps) {
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
    }, [reelId]);

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

            // Find interaction for this specific reel (using reelId as videoId)
            const reelInteraction = interactions.find(
                (interaction: any) => interaction.video_id === reelId && interaction.platform === 'instagram'
            );

            if (reelInteraction) {
                setStarRating(reelInteraction.star_rating || 0);
                setComment(reelInteraction.comment || '');
                setIsFavorite(reelInteraction.is_favorite || false);
                setHasComment(!!reelInteraction.comment);
            } else {
                // No interaction found, set defaults
                setStarRating(0);
                setComment('');
                setIsFavorite(false);
                setHasComment(false);
            }

        } catch (error) {
            console.error('Error loading reel interactions:', error);
            // Don't show error for missing interaction data - it's optional
            // setError('Failed to load reel data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const checkTranscription = async () => {
        try {
            const transcription = await transcriptionService.getVideoTranscription(reelId, 'instagram');
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

            await apiService.updateVideoInteraction(userId, reelId, 'instagram', {
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

            await apiService.updateVideoInteraction(userId, reelId, 'instagram', {
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

            await apiService.updateVideoInteraction(userId, reelId, 'instagram', {
                comment: trimmedComment || undefined
            });

            setComment(trimmedComment);
            setHasComment(!!trimmedComment);
            setShowCommentSidebar(false);
            setShowTranscriptionSidebar(false);
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
                videoId={reelId}
                videoTitle={reelTitle}
                comment={comment}
                setComment={setComment}
                onSubmit={handleCommentSubmit}
                hasComment={hasComment}
                platform="instagram"
                instagramCaption={reelCaption}
                instagramHashtags={reelHashtags}
            />

            {/* Icons: Embed, Comment, Transcription, Heart, Menu */}
            <div className={layout === 'inline'
                ? "flex space-x-2"
                : "absolute top-2 right-2 flex space-x-2"
            }>
                {/* Instagram Link Icon - direct link to Instagram post */}

                {(postLink || embedLink) && (

                    <a
                        href={postLink || embedLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 transition-all duration-200"
                        title="Open on Instagram"
                    >
                        <svg className="w-5 h-5 text-white " fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                    </a>


                )}

                {/* Comment Icon */}
                <button
                    onClick={handleSidebarCommentClick}
                    className={`p-2 rounded-full transition-all duration-200 ${layout === 'inline'
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
                    className={`p-2 rounded-full transition-all duration-200 ${layout === 'inline'
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
                    className={`p-2 rounded-full transition-all duration-200 ${layout === 'inline'
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
                        className={`p-2 rounded-full transition-all duration-200 ${layout === 'inline'
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
                            videoId={reelId}
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