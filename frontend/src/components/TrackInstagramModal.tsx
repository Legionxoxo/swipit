import { useState } from 'react';
import { apiService } from '../services/api';
import Modal from './Modal';

interface TrackInstagramModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAnalysisStarted: (analysisId: string) => void;
}

export default function TrackInstagramModal({ isOpen, onClose, onAnalysisStarted }: TrackInstagramModalProps) {
    const [instagramUrl, setInstagramUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!instagramUrl.trim()) {
            setError('Please enter an Instagram profile URL');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const input = instagramUrl.trim();
            const username = extractUsernameFromUrl(input);
            
            // Check if this looks like a YouTube URL and suggest using the YouTube tracker
            const isYouTubeUrl = /youtube\.com|youtu\.be/i.test(input);
            if (isYouTubeUrl) {
                setError('This looks like a YouTube URL. Please use the "Track YouTube Channel" button instead for YouTube analysis.');
                return;
            }
            
            const response = await apiService.startInstagramAnalysis(username);
            onAnalysisStarted(response.analysisId);
            
            // Reset form and close modal
            setInstagramUrl('');
            setError(null);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start Instagram analysis');
        } finally {
            setIsLoading(false);
        }
    };

    const extractUsernameFromUrl = (input: string): string => {
        // Remove @ if present at the start
        if (input.startsWith('@')) {
            return input.slice(1);
        }

        // Handle various URL patterns for both Instagram and YouTube
        const urlPatterns = [
            // Instagram patterns
            /https?:\/\/(?:www\.)?instagram\.com\/([^\/\?]+)/,
            /instagram\.com\/([^\/\?]+)/,
            // YouTube patterns (in case user pastes YouTube URL by mistake)
            /https?:\/\/(?:www\.)?youtube\.com\/@([^\/\?]+)/,
            /https?:\/\/(?:www\.)?youtube\.com\/c\/([^\/\?]+)/,
            /https?:\/\/(?:www\.)?youtube\.com\/channel\/([^\/\?]+)/,
            /https?:\/\/(?:www\.)?youtube\.com\/user\/([^\/\?]+)/,
            /youtube\.com\/@([^\/\?]+)/,
            /youtube\.com\/c\/([^\/\?]+)/,
            /youtube\.com\/channel\/([^\/\?]+)/,
            /youtube\.com\/user\/([^\/\?]+)/,
            // Just username pattern
            /^([a-zA-Z0-9_\.]+)$/
        ];

        for (const pattern of urlPatterns) {
            const match = input.match(pattern);
            if (match) {
                return match[1];
            }
        }

        // Return as-is if no pattern matches
        return input;
    };

    const handleClose = () => {
        if (!isLoading) {
            setInstagramUrl('');
            setError(null);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Track New Instagram Profile" maxWidth="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="instagramUrl" className="block text-sm font-medium text-gray-700 mb-2">
                        Profile URL or Username
                    </label>
                    <input
                        type="text"
                        id="instagramUrl"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        placeholder="Instagram: @username, YouTube: @channelname, or any profile URL"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        disabled={isLoading}
                        autoFocus
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Supported formats:</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                        <p className="font-medium text-purple-700 mb-1">Instagram:</p>
                        <p>• <code className="bg-gray-200 px-1 rounded">https://www.instagram.com/username</code></p>
                        <p>• <code className="bg-gray-200 px-1 rounded">@username</code></p>
                        <p className="font-medium text-red-700 mb-1 mt-2">YouTube (use YouTube tracker instead):</p>
                        <p>• YouTube URLs will show an error message</p>
                        <p>• Use the "Track YouTube Channel" button for YouTube analysis</p>
                        <p className="font-medium text-gray-700 mb-1 mt-2">General:</p>
                        <p>• <code className="bg-gray-200 px-1 rounded">username</code> (plain text)</p>
                    </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm text-purple-800">
                            <p className="font-medium">Instagram Analysis</p>
                            <p className="mt-1">Profile analysis typically takes 1-3 minutes. We'll extract profile info, reels, and engagement data. Authentication may be required for private profiles.</p>
                        </div>
                    </div>
                </div>

                <div className="flex space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !instagramUrl.trim()}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Starting Analysis...</span>
                            </div>
                        ) : (
                            'Start Instagram Analysis'
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}