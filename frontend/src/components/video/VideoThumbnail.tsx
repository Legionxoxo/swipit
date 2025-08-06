import type { VideoData } from '../../types/api';

interface VideoThumbnailProps {
    video: VideoData;
    subscriberCount?: number;
}

export default function VideoThumbnail({ video, subscriberCount }: VideoThumbnailProps) {
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

    const getPerformanceTag = (viewCount: number, subscriberCount?: number): { label: string; color: string; ratio: number; tooltip: string } | null => {
        // If no subscriber count available, don't show performance tag
        if (subscriberCount === undefined || subscriberCount === null) {
            return null;
        }
        
        // Avoid division by zero - if subscriber count is 0, use 1 as minimum for calculation
        const originalSubscriberCount = subscriberCount;
        const effectiveSubscriberCount = subscriberCount === 0 ? 1 : subscriberCount;
        
        const ratio = viewCount / effectiveSubscriberCount;
        const formatNumber = (num: number) => num.toLocaleString();
        
        // Create tooltip explaining the calculation
        const tooltip = originalSubscriberCount === 0 
            ? `${formatNumber(viewCount)} views ÷ 1* subscribers = ${ratio.toFixed(1)}x ratio (*minimum estimated, actual: 0)`
            : `${formatNumber(viewCount)} views ÷ ${formatNumber(subscriberCount)} subscribers = ${ratio.toFixed(1)}x ratio`;
        
        if (ratio >= 100) return { label: 'Viral', color: 'bg-red-100 text-red-800', ratio, tooltip: tooltip + '\n(≥100x = Viral)' };
        if (ratio >= 75) return { label: 'Very High', color: 'bg-orange-100 text-orange-800', ratio, tooltip: tooltip + '\n(≥75x = Very High)' };
        if (ratio >= 50) return { label: 'High', color: 'bg-yellow-100 text-yellow-800', ratio, tooltip: tooltip + '\n(≥50x = High)' };
        if (ratio >= 25) return { label: 'Medium', color: 'bg-green-100 text-green-800', ratio, tooltip: tooltip + '\n(≥25x = Medium)' };
        return { label: 'Low', color: 'bg-gray-100 text-gray-800', ratio, tooltip: tooltip + '\n(<25x = Low)' };
    };

    const performanceTag = getPerformanceTag(video.viewCount, subscriberCount);

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
            
            {performanceTag && (
                <div 
                    className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium cursor-help ${performanceTag.color}`}
                    title={performanceTag.tooltip}
                >
                    {performanceTag.label}
                </div>
            )}
        </div>
    );
}