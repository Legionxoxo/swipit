import type { VideoData } from '../../types/api';

interface VideoDetailsProps {
    video: VideoData;
}

export default function VideoDetails({ video }: VideoDetailsProps) {
    const formatNumber = (num: number): string => {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toString();
    };

    return (
        <div className="p-4 flex flex-col flex-1">
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

            {/* Push button to bottom */}
            <div className="mt-auto">
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