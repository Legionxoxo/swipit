import { useState } from 'react';
import { apiService } from '../services/api';
import Modal from './Modal';

interface TrackChannelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAnalysisStarted: (analysisId: string) => void;
}

export default function TrackChannelModal({ isOpen, onClose, onAnalysisStarted }: TrackChannelModalProps) {
    const [channelUrl, setChannelUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!channelUrl.trim()) {
            setError('Please enter a YouTube channel URL');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await apiService.startChannelAnalysis(channelUrl.trim());
            onAnalysisStarted(response.analysisId);
            
            // Reset form and close modal
            setChannelUrl('');
            setError(null);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start analysis');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setChannelUrl('');
            setError(null);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Track New YouTube Channel" maxWidth="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="channelUrl" className="block text-sm font-medium text-gray-700 mb-2">
                        YouTube Channel URL
                    </label>
                    <input
                        type="url"
                        id="channelUrl"
                        value={channelUrl}
                        onChange={(e) => setChannelUrl(e.target.value)}
                        placeholder="https://www.youtube.com/@channelname"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Supported URL formats:</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                        <p>• <code className="bg-gray-200 px-1 rounded">https://www.youtube.com/@channelname</code></p>
                        <p>• <code className="bg-gray-200 px-1 rounded">https://www.youtube.com/c/channelname</code></p>
                        <p>• <code className="bg-gray-200 px-1 rounded">https://www.youtube.com/channel/CHANNEL_ID</code></p>
                        <p>• <code className="bg-gray-200 px-1 rounded">https://www.youtube.com/user/username</code></p>
                    </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm text-blue-800">
                            <p className="font-medium">Analysis Process</p>
                            <p className="mt-1">The analysis typically takes 2-10 minutes depending on the channel size. You'll see real-time progress updates.</p>
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
                        disabled={isLoading || !channelUrl.trim()}
                        className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Starting Analysis...</span>
                            </div>
                        ) : (
                            'Start Analysis'
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}