interface EmptyStateProps {
    onTrackChannel: () => void;
}

export default function EmptyState({ onTrackChannel }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-24 px-4">
            <div className="text-center max-w-md">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <svg
                        className="w-12 h-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                    </svg>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No channels tracked yet
                </h3>
                
                <p className="text-gray-600 mb-8 leading-relaxed">
                    Start by adding your first YouTube channel to analyze. Get comprehensive insights about video performance, engagement metrics, and detailed analytics.
                </p>
                
                <button
                    onClick={onTrackChannel}
                    className="bg-red-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors shadow-sm"
                >
                    Track Your First Channel
                </button>
                
                <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                    <div className="p-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h4 className="font-medium text-gray-900 text-sm">Complete Analysis</h4>
                        <p className="text-xs text-gray-600 mt-1">Extract all video data and metadata</p>
                    </div>
                    
                    <div className="p-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                            </svg>
                        </div>
                        <h4 className="font-medium text-gray-900 text-sm">Performance Insights</h4>
                        <p className="text-xs text-gray-600 mt-1">Categorize videos by view ranges</p>
                    </div>
                    
                    <div className="p-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h4 className="font-medium text-gray-900 text-sm">Export Data</h4>
                        <p className="text-xs text-gray-600 mt-1">Download as CSV or JSON format</p>
                    </div>
                </div>
            </div>
        </div>
    );
}