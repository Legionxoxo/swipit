import type { ChannelInfo as ChannelInfoType, CreatorHub } from '../../types/api';
import ChannelActions from './ChannelActions';
import { Users, Video, Youtube } from 'lucide-react';

interface ChannelCardProps {
    channelInfo: ChannelInfoType;
    totalVideos: number;
    progress?: number;
    isLoading?: boolean;
    onClick: () => void;
    analysisId: string;
    hubs: CreatorHub[];
    onHubsChange: (hubs: CreatorHub[]) => void;
}

export default function ChannelCard({ 
    channelInfo, 
    totalVideos, 
    progress, 
    isLoading = false, 
    onClick,
    analysisId,
    hubs,
    onHubsChange
}: ChannelCardProps) {

    return (
        <div 
            className={`bg-white rounded-lg shadow-md hover:shadow-lg border border-gray-200 cursor-pointer transition-all duration-200 relative ${
                isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:border-red-200'
            }`}
            onClick={isLoading ? undefined : onClick}
        >
            {/* List View Layout */}
            <div className="flex items-center p-4 space-x-4">
                {/* Left side: Logo */}
                <div className="flex-shrink-0">
                    <div className="relative w-16 h-16 bg-gray-100 rounded-full overflow-hidden">
                        <img
                            src={channelInfo.thumbnailUrl}
                            alt={`${channelInfo.channelName} avatar`}
                            className="w-full h-full object-cover"
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
                </div>

                {/* Middle: Channel name and username */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 truncate text-lg">
                            {channelInfo.channelName}
                        </h3>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {(channelInfo.subscriberCount >= 1000000) 
                                ? `${(channelInfo.subscriberCount / 1000000).toFixed(1)}M` 
                                : (channelInfo.subscriberCount >= 1000) 
                                    ? `${(channelInfo.subscriberCount / 1000).toFixed(1)}K` 
                                    : channelInfo.subscriberCount.toString()
                            } subscribers
                        </span>
                        <span className="flex items-center">
                            <Video className="w-4 h-4 mr-1" />
                            {totalVideos} videos
                        </span>
                    </div>
                </div>

                {/* Right side: Icons */}
                <div className="flex items-center space-x-3">
                    {/* YouTube Link Icon - always available */}
                    <a
                        href={`https://www.youtube.com/channel/${channelInfo.channelId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                        title="Open YouTube Channel"
                    >
                        <Youtube className="w-5 h-5 text-gray-600" />
                    </a>
                    
                    {/* Channel Actions */}
                    <ChannelActions
                        analysisId={analysisId}
                        channelId={channelInfo.channelId}
                        channelName={channelInfo.channelName}
                        thumbnailUrl={channelInfo.thumbnailUrl}
                        hubs={hubs}
                        onHubsChange={onHubsChange}
                        isLoading={isLoading}
                    />
                </div>
            </div>

            {/* Progress bar for loading state */}
            {isLoading && typeof progress === 'number' && (
                <div className="absolute bottom-0 left-0 right-0">
                    <div className="w-full bg-gray-200 rounded-b-lg h-1">
                        <div 
                            className="bg-red-500 h-1 rounded-bl-lg transition-all duration-300"
                            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    );
}