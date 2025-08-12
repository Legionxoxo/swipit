import type { ChannelInfo as ChannelInfoType, CreatorHub } from '../../types/api';
import ChannelActions from './ChannelActions';

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
            className={`bg-white rounded-lg border border-gray-100 cursor-pointer transition-all duration-200 relative group ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-sm hover:border-gray-200'
                }`}
            onClick={isLoading ? undefined : onClick}
        >
            {/* Minimal Layout */}
            <div className="flex items-center p-3 space-x-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div className="relative w-12 h-12 bg-gray-50 rounded-lg overflow-hidden">
                        <img
                            src={channelInfo.thumbnailUrl}
                            alt={`${channelInfo.channelName} avatar`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://via.placeholder.com/48x48?text=YT';
                            }}
                        />
                        {isLoading && (
                            <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Channel info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                        {channelInfo.channelName}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                        {(channelInfo.subscriberCount >= 1000000)
                            ? `${(channelInfo.subscriberCount / 1000000).toFixed(1)}M subscribers`
                            : (channelInfo.subscriberCount >= 1000)
                                ? `${(channelInfo.subscriberCount / 1000).toFixed(1)}K subscribers`
                                : `${channelInfo.subscriberCount} subscribers`
                        }
                        {totalVideos > 0 && ` • ${totalVideos} videos`}
                    </p>
                </div>

                {/* Actions - only show on hover */}
                <div className="opacity-100 group-hover:opacity-100 transition-opacity duration-200">
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