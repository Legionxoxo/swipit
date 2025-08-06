import type { ChannelInfo as ChannelInfoType, CreatorHub } from '../../types/api';
import ChannelActions from './ChannelActions';
import ChannelInfoComponent from './ChannelInfo';

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
            className={`bg-white rounded-xl shadow-md hover:shadow-lg border border-gray-200 p-6 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 relative ${
                isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:border-red-200'
            }`}
            onClick={isLoading ? undefined : onClick}
        >
            <ChannelActions
                analysisId={analysisId}
                channelId={channelInfo.channelId}
                channelName={channelInfo.channelName}
                thumbnailUrl={channelInfo.thumbnailUrl}
                hubs={hubs}
                onHubsChange={onHubsChange}
                isLoading={isLoading}
            />
            
            <ChannelInfoComponent
                channelInfo={channelInfo}
                totalVideos={totalVideos}
                progress={progress}
                isLoading={isLoading}
            />
        </div>
    );
}