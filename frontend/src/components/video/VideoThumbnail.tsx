import type { VideoData } from '../../types/api';

interface VideoThumbnailProps {
    video: VideoData;
}

export default function VideoThumbnail({ video }: VideoThumbnailProps) {
    const formatDuration = (duration: string): string => {
        try {
            const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (!match) return duration;
            
            const hours = parseInt(match[1] || '0');
            const minutes = parseInt(match[2] || '0');
            const seconds = parseInt(match[3] || '0');
            
            if (hours > 0) {
                return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        } catch {
            return duration;
        }
    };

    const getPerformanceTag = (viewCount: number): { label: string; color: string } => {
        if (viewCount > 1000000) return { label: 'Viral', color: 'bg-red-100 text-red-800' };
        if (viewCount > 100000) return { label: 'Very High', color: 'bg-orange-100 text-orange-800' };
        if (viewCount > 10000) return { label: 'High', color: 'bg-yellow-100 text-yellow-800' };
        if (viewCount > 1000) return { label: 'Medium', color: 'bg-green-100 text-green-800' };
        return { label: 'Low', color: 'bg-gray-100 text-gray-800' };
    };

    const performanceTag = getPerformanceTag(video.viewCount);

    return (
        <div className="relative">
            <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/480x270?text=Video';
                }}
            />
            
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {formatDuration(video.duration)}
            </div>
            
            <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${performanceTag.color}`}>
                {performanceTag.label}
            </div>
        </div>
    );
}