import type { VideoData } from '../../types/api';

interface VideoDetailsProps {
    video: VideoData;
    compact?: boolean;
}

export default function VideoDetails({ video, compact = false }: VideoDetailsProps) {
    const formatNumber = (num: number): string => {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toString();
    };

    if (compact) {
        return (
            <div className="flex justify-between h-24">
                <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                            {video.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                            <span>👁️ {formatNumber(video.viewCount)}</span>
                            <span>👍 {formatNumber(video.likeCount)}</span>
                            <span>💬 {formatNumber(video.commentCount)}</span>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500">
                        {new Date(video.uploadDate).toLocaleDateString()}
                    </div>
                </div>
                <div className="flex-shrink-0 ml-3">
                    <a
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full transition-colors duration-200"
                        title="Watch on YouTube"
                    >
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                    </a>
                </div>
            </div>
        );
    }

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

            <div className="flex justify-between mb-4 text-sm text-gray-600">
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