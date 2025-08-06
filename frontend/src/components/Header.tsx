interface HeaderProps {
    onTrackChannelClick: () => void;
}

export default function Header({ onTrackChannelClick }: HeaderProps) {
    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            YouTube Analyzer
                        </h1>
                        <p className="mt-1 text-gray-600">
                            Analyze YouTube channels and get comprehensive video analytics
                        </p>
                    </div>
                    
                    <button
                        onClick={onTrackChannelClick}
                        className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors shadow-sm"
                    >
                        + Track New Channel
                    </button>
                </div>
            </div>
        </header>
    );
}