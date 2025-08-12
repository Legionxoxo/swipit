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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 p-4">
            <div className="flex gap-4">
                <div className="relative flex-shrink-0 w-40 h-24 overflow-hidden rounded">
                    <VideoThumbnail video={video} subscriberCount={subscriberCount} />
                </div>
                <div className="flex-1 min-w-0">
                    <VideoDetails video={video} compact={true} />
                </div>
                <div className="flex-shrink-0 ml-4">
                    <VideoActions
                        videoId={video.videoId}
                        videoTitle={video.title}
                        channelName={channelName}
                        thumbnailUrl={video.thumbnailUrl}
                        videoUrl={video.videoUrl}
                        layout="inline"
                    />
                </div>
            </div>
        </div>
    );
}