import { useEffect, useRef, useState } from 'react';
import type { VideoComment, VideoTranscription } from '../../types/api';
import { transcriptionService } from '../../services/transcriptionService';

interface VideoDualSidebarProps {
    isCommentOpen: boolean;
    isTranscriptionOpen: boolean;
    onToggleComment: () => void;
    onToggleTranscription: () => void;
    onClose: () => void;
    videoId: string;
    videoTitle: string;
    comment: string;
    setComment: (comment: string) => void;
    onSubmit: () => void;
    hasComment: boolean;
}

export default function VideoDualSidebar({
    isCommentOpen,
    isTranscriptionOpen,
    onToggleComment,
    onToggleTranscription,
    onClose,
    videoId,
    videoTitle,
    comment,
    setComment,
    onSubmit,
    hasComment
}: VideoDualSidebarProps) {
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [transcription, setTranscription] = useState<VideoTranscription | null>(null);
    const [isLoadingTranscription, setIsLoadingTranscription] = useState<boolean>(false);
    const [transcriptionError, setTranscriptionError] = useState<string>('');

    const isAnyPanelOpen = isCommentOpen || isTranscriptionOpen;

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isAnyPanelOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isAnyPanelOpen, onClose]);

    // Clear mock transcriptions and load real ones when transcription panel opens
    useEffect(() => {
        const loadTranscription = async () => {
            if (!isTranscriptionOpen || !videoId) return;

            try {
                setIsLoadingTranscription(false);
                setTranscriptionError('');

                // Clear any existing mock transcriptions (one-time cleanup)
                transcriptionService.clearAllTranscriptions();
                
                // Since we cleared everything, there won't be any existing transcriptions
                setTranscription(null);
            } catch (error) {
                console.error('Error loading transcription:', error);
                setTranscriptionError('Failed to load transcription.');
                setTranscription(null);
            }
        };

        loadTranscription();
    }, [isTranscriptionOpen, videoId]);

    const handleDelete = () => {
        try {
            setComment('');
            onSubmit(); // This will handle the API call to remove the comment
        } catch (error) {
            console.error('Error deleting comment:', error);
        } finally {
            // Required by architecture rules
        }
    };

    const handleCopyTranscription = () => {
        try {
            if (transcription?.transcription) {
                navigator.clipboard.writeText(transcription.transcription);
                // You might want to show a toast notification here
            }
        } catch (error) {
            console.error('Error copying transcription:', error);
        } finally {
            // Required by architecture rules
        }
    };

    const handleGenerateTranscription = async () => {
        try {
            setIsLoadingTranscription(true);
            setTranscriptionError('');
            
            const newTranscription = await transcriptionService.generateTranscription(videoId);
            setTranscription(newTranscription);
        } catch (error) {
            console.error('Error generating transcription:', error);
            setTranscriptionError('Failed to generate transcription. Please try again.');
        } finally {
            setIsLoadingTranscription(false);
        }
    };

    if (!isAnyPanelOpen) return null;

    // Calculate widths based on what's open
    const getWidthClasses = () => {
        if (isCommentOpen && isTranscriptionOpen) {
            return {
                container: 'w-[800px]',
                comment: 'w-[400px]',
                transcription: 'w-[400px]'
            };
        } else if (isCommentOpen || isTranscriptionOpen) {
            return {
                container: 'w-[400px]',
                comment: isCommentOpen ? 'w-[400px]' : 'w-0',
                transcription: isTranscriptionOpen ? 'w-[400px]' : 'w-0'
            };
        }
        return {
            container: 'w-0',
            comment: 'w-0',
            transcription: 'w-0'
        };
    };

    const widths = getWidthClasses();

    return (
        <>            
            {/* Dual Sidebar Container */}
            <div
                ref={sidebarRef}
                className={`fixed top-0 right-0 h-full ${widths.container} bg-white shadow-2xl z-[100] transform transition-all duration-300 ease-in-out flex border-l border-gray-200`}
            >
                {/* Global Close Button - Always visible when any panel is open */}
                {isAnyPanelOpen && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shadow-md"
                        title="Close all panels"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
                {/* Comments Panel */}
                <div className={`${widths.comment} transition-all duration-300 ease-in-out overflow-hidden border-r border-gray-200 flex flex-col`}>
                    {isCommentOpen && (
                        <>
                            {/* Comment Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50">
                                <div className="flex items-center space-x-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                    </svg>
                                    <h2 className="text-lg font-semibold text-blue-900">Comments</h2>
                                </div>
                                <button
                                    onClick={onToggleComment}
                                    className="p-2 rounded-md hover:bg-blue-100 transition-colors"
                                    title="Collapse comments"
                                >
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Video Title */}
                            <div className="p-4 border-b border-gray-100">
                                <h3 className="text-sm font-medium text-gray-900 line-clamp-2" title={videoTitle}>
                                    {videoTitle}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Video ID: {videoId}</p>
                            </div>

                            {/* Comment Content */}
                            <div className="flex-1 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-medium text-gray-700">Your Comment</h4>
                                    {hasComment && (
                                        <button
                                            onClick={handleDelete}
                                            className="text-xs text-red-600 hover:text-red-800 transition-colors"
                                            title="Delete comment"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                                
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Add your comment about this video..."
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                                    rows={15}
                                />
                                
                                <div className="flex justify-end mt-3">
                                    <button
                                        onClick={onSubmit}
                                        className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
                                    >
                                        Save Comment
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Transcription Panel */}
                <div className={`${widths.transcription} transition-all duration-300 ease-in-out overflow-hidden flex flex-col`}>
                    {isTranscriptionOpen && (
                        <>
                            {/* Transcription Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-green-50">
                                <div className="flex items-center space-x-2">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                    <h2 className="text-lg font-semibold text-green-900">Transcription</h2>
                                </div>
                                <button
                                    onClick={onToggleTranscription}
                                    className="p-2 rounded-md hover:bg-green-100 transition-colors"
                                    title="Collapse transcription"
                                >
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Video Title */}
                            <div className="p-4 border-b border-gray-100">
                                <h3 className="text-sm font-medium text-gray-900 line-clamp-2" title={videoTitle}>
                                    {videoTitle}
                                </h3>
                            </div>

                            {/* Transcription Content */}
                            <div className="flex-1 p-4 overflow-y-auto">
                                {transcriptionError && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
                                        <p className="text-xs text-red-600">{transcriptionError}</p>
                                    </div>
                                )}
                                
                                {isLoadingTranscription ? (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-sm text-gray-600">Generating transcription...</span>
                                        </div>
                                    </div>
                                ) : transcription ? (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 relative">
                                        {/* Copy button positioned in top-right of transcription text */}
                                        <button
                                            onClick={handleCopyTranscription}
                                            className="absolute top-2 right-2 p-1.5 rounded-md bg-white hover:bg-gray-100 transition-colors shadow-sm border border-gray-200"
                                            title="Copy transcription"
                                        >
                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                        
                                        <div className="mb-2 text-xs text-gray-500">
                                            Generated on: {new Date(transcription.generatedAt).toLocaleString()} 
                                            {transcription.confidence && ` • Confidence: ${Math.round(transcription.confidence * 100)}%`}
                                            {transcription.language && ` • Language: ${transcription.language.toUpperCase()}`}
                                        </div>
                                        <div className="text-sm text-gray-700 whitespace-pre-wrap font-sans pr-8">
                                            {transcription.transcription}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                                        <div className="text-gray-400 mb-4">
                                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            No Transcription Available
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-6">
                                            Transcription service integration is coming soon. This feature will allow you to generate transcriptions of video content for better searchability and accessibility.
                                        </p>
                                        <button
                                            onClick={handleGenerateTranscription}
                                            disabled={true}
                                            className="inline-flex items-center px-4 py-2 bg-gray-400 text-white text-sm font-medium rounded-md cursor-not-allowed"
                                            title="Transcription service coming soon"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Coming Soon
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}