import { useEffect, useRef, useState } from 'react';
import type { VideoTranscription } from '../../types/api';
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
    platform?: string;
    instagramCaption?: string;
    instagramHashtags?: string[];
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
    hasComment,
    platform = 'youtube',
    instagramCaption,
    instagramHashtags
}: VideoDualSidebarProps) {
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [transcription, setTranscription] = useState<VideoTranscription | null>(null);
    const [isLoadingTranscription, setIsLoadingTranscription] = useState<boolean>(false);
    const [transcriptionError, setTranscriptionError] = useState<string>('');

    const isAnyPanelOpen = isCommentOpen || isTranscriptionOpen;
    
    // Debug logging for comment display issues
    console.debug('VideoDualSidebar render:', {
        videoId,
        isCommentOpen,
        hasComment,
        comment: comment?.length ? `${comment.length} characters` : 'empty',
        isAnyPanelOpen,
        platform
    });

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

    // Load transcription when transcription panel opens
    useEffect(() => {
        const loadTranscription = async () => {
            if (!isTranscriptionOpen || !videoId) return;

            try {
                setIsLoadingTranscription(true);
                setTranscriptionError('');

                // Check if transcription already exists
                const existing = await transcriptionService.getVideoTranscription(videoId, platform);
                setTranscription(existing);

                if (!existing) {
                    // No transcription exists yet
                    setIsLoadingTranscription(false);
                } else if (existing.status === 'processing') {
                    // Transcription is in progress, continue polling
                    startPollingTranscription(existing.transcriptionId);
                } else {
                    // Transcription is completed or failed
                    setIsLoadingTranscription(false);
                }
            } catch (error) {
                console.error('Error loading transcription:', error);
                setTranscriptionError('Failed to load transcription.');
                setTranscription(null);
                setIsLoadingTranscription(false);
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
            let textToCopy = '';
            
            if (platform === 'instagram' && instagramCaption) {
                // For Instagram, copy caption and hashtags
                textToCopy = instagramCaption;
                if (instagramHashtags && instagramHashtags.length > 0) {
                    textToCopy += '\n\nHashtags: ' + instagramHashtags.map(tag => `#${tag}`).join(' ');
                }
            } else {
                // For regular transcription
                textToCopy = transcription?.formattedTranscript || 
                           transcription?.rawTranscript || 
                           transcription?.transcription || '';
            }
            
            if (textToCopy) {
                navigator.clipboard.writeText(textToCopy);
                // You might want to show a toast notification here
            }
        } catch (error) {
            console.error('Error copying content:', error);
        } finally {
            // Required by architecture rules
        }
    };

    const handleGenerateTranscription = async () => {
        try {
            setIsLoadingTranscription(true);
            setTranscriptionError('');
            
            // Start transcription without waiting for completion
            const response = await transcriptionService.generateTranscription(videoId, platform);
            setTranscription(response);
            
            // If it's still processing, start polling
            if (response.status === 'processing') {
                startPollingTranscription(response.transcriptionId);
            } else {
                setIsLoadingTranscription(false);
            }
        } catch (error) {
            console.error('Error generating transcription:', error);
            setTranscriptionError(`Failed to generate transcription: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setIsLoadingTranscription(false);
        }
    };

    const startPollingTranscription = (transcriptionId: string) => {
        const pollInterval = setInterval(async () => {
            try {
                const updatedTranscription = await transcriptionService.getTranscriptionStatus(transcriptionId);
                setTranscription(updatedTranscription);
                
                if (updatedTranscription.status === 'completed' || updatedTranscription.status === 'failed') {
                    clearInterval(pollInterval);
                    setIsLoadingTranscription(false);
                    
                    if (updatedTranscription.status === 'failed') {
                        setTranscriptionError(updatedTranscription.errorMessage || 'Transcription failed');
                    }
                }
            } catch (error) {
                console.error('Error polling transcription:', error);
                clearInterval(pollInterval);
                setIsLoadingTranscription(false);
                setTranscriptionError('Failed to check transcription status');
            }
        }, 3000); // Poll every 3 seconds
        
        // Clear interval after 10 minutes to prevent infinite polling
        setTimeout(() => {
            clearInterval(pollInterval);
            if (isLoadingTranscription) {
                setIsLoadingTranscription(false);
                setTranscriptionError('Transcription is taking longer than expected. Please refresh to check status.');
            }
        }, 600000);
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
                            <div className={`flex items-center justify-between p-4 border-b border-gray-200 ${platform === 'instagram' ? 'bg-purple-50' : 'bg-green-50'}`}>
                                <div className="flex items-center space-x-2">
                                    {platform === 'instagram' ? (
                                        <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                    )}
                                    <h2 className={`text-lg font-semibold ${platform === 'instagram' ? 'text-purple-900' : 'text-green-900'}`}>
                                        {platform === 'instagram' ? 'Content & Transcription' : 'Transcription'}
                                    </h2>
                                </div>
                                <button
                                    onClick={onToggleTranscription}
                                    className={`p-2 rounded-md transition-colors ${platform === 'instagram' ? 'hover:bg-purple-100' : 'hover:bg-green-100'}`}
                                    title="Collapse panel"
                                >
                                    <svg className={`w-5 h-5 ${platform === 'instagram' ? 'text-purple-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                
                                {/* Instagram Caption and Hashtags Section */}
                                {platform === 'instagram' && (instagramCaption || instagramHashtags?.length) && (
                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 mb-4 relative">
                                        {/* Copy button for Instagram content */}
                                        <button
                                            onClick={handleCopyTranscription}
                                            className="absolute top-2 right-2 p-1.5 rounded-md bg-white hover:bg-gray-100 transition-colors shadow-sm border border-gray-200"
                                            title="Copy caption and hashtags"
                                        >
                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                        
                                        <div className="flex items-center space-x-2 mb-3">
                                            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                            </svg>
                                            <h4 className="font-semibold text-purple-900">Instagram Content</h4>
                                        </div>
                                        
                                        {instagramCaption && (
                                            <div className="mb-4">
                                                <h5 className="text-sm font-medium text-purple-800 mb-2">Caption</h5>
                                                <div className="text-sm text-gray-700 whitespace-pre-wrap font-sans pr-8 bg-white p-3 rounded border">
                                                    {instagramCaption}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {instagramHashtags && instagramHashtags.length > 0 && (
                                            <div>
                                                <h5 className="text-sm font-medium text-purple-800 mb-2">Hashtags ({instagramHashtags.length})</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {instagramHashtags.map((hashtag, idx) => (
                                                        <span key={idx} className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                                                            #{hashtag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {/* Regular Transcription Section */}
                                {isLoadingTranscription ? (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                                        <div className="flex items-center justify-center space-x-2 mb-2">
                                            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-sm text-gray-600">
                                                {transcription?.status === 'processing' ? 'Processing transcription...' : 'Starting transcription...'}
                                            </span>
                                        </div>
                                        {transcription?.progress && (
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                                                    style={{ width: `${transcription.progress}%` }}
                                                ></div>
                                            </div>
                                        )}
                                    </div>
                                ) : transcription && transcription.status === 'completed' ? (
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
                                        
                                        <div className="flex items-center space-x-2 mb-3">
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                            </svg>
                                            <h4 className="font-semibold text-green-900">AI Transcription</h4>
                                        </div>
                                        
                                        <div className="mb-2 text-xs text-gray-500">
                                            Generated on: {new Date(transcription.processingCompletedAt || transcription.createdAt).toLocaleString()} 
                                            {transcription.confidenceScore && ` • Confidence: ${Math.round(transcription.confidenceScore * 100)}%`}
                                            {transcription.languageDetected && ` • Language: ${transcription.languageDetected.toUpperCase()}`}
                                            {transcription.processingTimeSeconds && ` • Processing Time: ${transcription.processingTimeSeconds}s`}
                                        </div>
                                        <div className="text-sm text-gray-700 whitespace-pre-wrap font-sans pr-8">
                                            {transcription.formattedTranscript || transcription.rawTranscript || transcription.transcription}
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
                                            {transcription?.status === 'failed' ? 'Transcription Failed' : `No ${platform === 'instagram' ? 'Audio' : ''} Transcription Available`}
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-6">
                                            {transcription?.status === 'failed' 
                                                ? `Transcription failed: ${transcription.errorMessage || 'Unknown error'}`
                                                : platform === 'instagram' 
                                                    ? 'Generate an AI audio transcription of this Instagram reel content.'
                                                    : 'Generate a transcription of this video content using AI speech-to-text technology.'
                                            }
                                        </p>
                                        <button
                                            onClick={handleGenerateTranscription}
                                            disabled={isLoadingTranscription}
                                            className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-md ${
                                                isLoadingTranscription 
                                                    ? 'bg-gray-400 cursor-not-allowed' 
                                                    : 'bg-green-500 hover:bg-green-600'
                                            }`}
                                            title={transcription?.status === 'failed' ? "Retry transcription" : "Generate transcription"}
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                            </svg>
                                            {transcription?.status === 'failed' ? 'Retry Audio Transcription' : `Generate ${platform === 'instagram' ? 'Audio ' : ''}Transcription`}
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