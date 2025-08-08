interface HeaderProps {
    onTrackChannelClick: () => void;
    videoViewMode: 'grid' | 'list';
    onVideoViewModeChange: (mode: 'grid' | 'list') => void;
}

export default function Header({ onTrackChannelClick, videoViewMode, onVideoViewModeChange }: HeaderProps) {
    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium text-gray-700 mr-3">View:</span>
                        
                        {/* Grid View Button */}
                        <button
                            onClick={() => onVideoViewModeChange('grid')}
                            className={`p-2 rounded-md transition-colors ${
                                videoViewMode === 'grid'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                            title="Grid view"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>

                        {/* List View Button */}
                        <button
                            onClick={() => onVideoViewModeChange('list')}
                            className={`p-2 rounded-md transition-colors ${
                                videoViewMode === 'list'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                            title="List view"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                        </button>
                    </div>

                    <button
                        onClick={onTrackChannelClick}
                        className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors shadow-sm"
                    >
                        + Track New Creator
                    </button>
                </div>
            </div>
        </header>
    );
}