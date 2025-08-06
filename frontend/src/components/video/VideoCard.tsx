import type { VideoData } from '../../types/api';
import VideoThumbnail from './VideoThumbnail';
import VideoActions from './VideoActions';
import VideoDetails from './VideoDetails';

interface VideoCardProps {
    video: VideoData;
    channelName: string;
    subscriberCount?: number;
}

export default function VideoCard({ video, channelName, subscriberCount }: VideoCardProps) {
    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 relative flex flex-col h-full">
            <div className="relative">
                <VideoThumbnail video={video} subscriberCount={subscriberCount} />
                <VideoActions
                    videoId={video.videoId}
                    videoTitle={video.title}
                    channelName={channelName}
                    thumbnailUrl={video.thumbnailUrl}
                    videoUrl={video.videoUrl}
                />
            </div>
            <VideoDetails video={video} />
        </div>
    );
}