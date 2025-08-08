import type { VideoData } from '../../types/api';
import VideoThumbnail from './VideoThumbnail';
import VideoActions from './VideoActions';
import VideoDetails from './VideoDetails';

interface VideoCardProps {
    video: VideoData;
    channelName: string;
    subscriberCount?: number;
    viewMode?: 'grid' | 'list';
}

export default function VideoCard({ video, channelName, subscriberCount, viewMode = 'grid' }: VideoCardProps) {
    if (viewMode === 'list') {
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

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 relative flex flex-col h-full">
            <div className="relative h-48">
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