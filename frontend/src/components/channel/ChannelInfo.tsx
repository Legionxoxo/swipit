import type { ChannelInfo as ChannelInfoType } from '../../types/api';

interface ChannelInfoProps {
    channelInfo: ChannelInfoType;
    totalVideos: number;
    progress?: number;
    isLoading?: boolean;
}

export default function ChannelInfo({ 
    channelInfo, 
    totalVideos, 
    progress, 
    isLoading = false 
}: ChannelInfoProps) {
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
        <>
            {/* Channel Avatar and Info */}
            <div className="flex items-start space-x-4 mb-4">
                <div className="relative">
                    <img
                        src={channelInfo.thumbnailUrl}
                        alt={`${channelInfo.channelName} avatar`}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/64x64?text=YT';
                        }}
                    />
                    {isLoading && (
                        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-full flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
                
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                        {channelInfo.channelName}
                    </h3>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                                {formatSubscribers(channelInfo.subscriberCount)}
                            </span>
                            
                            <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                {totalVideos} videos
                            </span>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                            Created: {new Date(channelInfo.creationDate).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Description */}
            {channelInfo.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {channelInfo.description}
                </p>
            )}

            {/* Progress Bar */}
            {isLoading && typeof progress === 'number' && (
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            Processing videos...
                        </span>
                        <span className="text-sm text-gray-500">
                            {Math.round(progress)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-red-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="text-center py-2">
                    <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Analyzing channel...</span>
                    </div>
                </div>
            )}

            {/* Action Button */}
            {!isLoading && (
                <div className="text-center">
                    <div className="inline-flex items-center space-x-2 text-sm text-red-600 font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>View Analysis</span>
                    </div>
                </div>
            )}
        </>
    );
}