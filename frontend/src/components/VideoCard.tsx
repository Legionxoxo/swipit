import type { VideoData } from '../types/api';

interface VideoCardProps {
    video: VideoData;
}

export default function VideoCard({ video }: VideoCardProps) {
    const formatNumber = (num: number): string => {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toString();
    };

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
        <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
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

            <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                    {video.title}
                </h3>
                
                {video.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {video.description}
                    </p>
                )}

                <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                        <span className="font-medium">👁️</span>
                        <span>{formatNumber(video.viewCount)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                        <span className="font-medium">👍</span>
                        <span>{formatNumber(video.likeCount)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                        <span className="font-medium">💬</span>
                        <span>{formatNumber(video.commentCount)}</span>
                    </div>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                    Uploaded: {new Date(video.uploadDate).toLocaleDateString()}
                </div>

                <a
                    href={video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium"
                >
                    <span className="mr-2">▶️</span>
                    Watch on YouTube
                </a>
            </div>
        </div>
    );
}