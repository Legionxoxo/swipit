import type { ChannelInfo } from '../types/api';

interface ChannelCardProps {
    channelInfo: ChannelInfo;
    totalVideos: number;
    progress?: number;
    isLoading?: boolean;
    onClick: () => void;
}

export default function ChannelCard({ 
    channelInfo, 
    totalVideos, 
    progress, 
    isLoading = false, 
    onClick 
}: ChannelCardProps) {
    const formatSubscribers = (count: number): string => {
        try {
            if (!count || count < 0) return '0';
            if (count >= 1000000) {
                return `${(count / 1000000).toFixed(1)}M`;
            } else if (count >= 1000) {
                return `${(count / 1000).toFixed(1)}K`;
            }
            return count.toString();
        } catch {
            return '0';
        }
    };

    return (
        <div 
            className={`bg-white rounded-xl shadow-md hover:shadow-lg border border-gray-200 p-6 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 ${
                isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:border-red-200'
            }`}
            onClick={isLoading ? undefined : onClick}
        >
            <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                    <img
                        src={channelInfo?.thumbnailUrl || 'https://via.placeholder.com/64x64?text=YT'}
                        alt={`${channelInfo?.channelName || 'Channel'} profile`}
                        className="w-16 h-16 rounded-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/64x64?text=YT';
                        }}
                    />
                </div>
                
                <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 truncate">
                        {channelInfo?.channelName || 'Loading...'}
                    </h3>
                    
                    <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">
                                {formatSubscribers(channelInfo?.subscriberCount || 0)}
                            </span> subscribers
                        </p>
                        
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">{totalVideos || 0}</span> videos analyzed
                        </p>
                        
                        {channelInfo?.creationDate && (
                            <p className="text-sm text-gray-500">
                                Created: {new Date(channelInfo.creationDate).toLocaleDateString()}
                            </p>
                        )}
                    </div>

                    {channelInfo?.description && (
                        <p className="mt-3 text-sm text-gray-700 line-clamp-2">
                            {channelInfo.description}
                        </p>
                    )}

                    {isLoading && progress !== undefined && (
                        <div className="mt-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span className="font-medium">Analyzing videos...</span>
                                <span className="font-bold text-red-600">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {!isLoading && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                            Click to view details
                        </span>
                        <div className="flex items-center space-x-1 text-red-600">
                            <span className="text-sm font-medium">View Videos</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}