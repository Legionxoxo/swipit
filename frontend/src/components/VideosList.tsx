import { useState } from 'react';
import type { VideoData, ChannelInfo, VideoSegments } from '../types/api';
import VideoCard from './video/VideoCard';
import { apiService } from '../services/api';

interface VideosListProps {
    channelInfo: ChannelInfo;
    videos: VideoData[];
    videoSegments: VideoSegments;
    analysisId: string;
    onBack: () => void;
}

export default function VideosList({ 
    channelInfo, 
    videos, 
    videoSegments, 
    analysisId, 
    onBack 
}: VideosListProps) {
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'viral' | 'veryHigh' | 'high' | 'medium' | 'low'>('all');
    const [isExporting, setIsExporting] = useState<'csv' | 'json' | null>(null);

    const getVideosToShow = (): VideoData[] => {
        switch (selectedCategory) {
            case 'viral': return videoSegments.viral;
            case 'veryHigh': return videoSegments.veryHigh;
            case 'high': return videoSegments.high;
            case 'medium': return videoSegments.medium;
            case 'low': return videoSegments.low;
            default: return videos;
        }
    };

    const handleExport = async (format: 'csv' | 'json') => {
        try {
            setIsExporting(format);
            
            const blob = format === 'csv' 
                ? await apiService.exportToCsv(analysisId)
                : await apiService.exportToJson(analysisId);
            
            const filename = `${channelInfo.channelName}_analysis_${new Date().toISOString().split('T')[0]}.${format}`;
            apiService.downloadFile(blob, filename);
        } catch (error) {
            alert(`Failed to export ${format.toUpperCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsExporting(null);
        }
    };

    const categories = [
        { key: 'all' as const, label: 'All Videos', count: videos.length },
        { key: 'viral' as const, label: 'Viral (1M+)', count: videoSegments.viral.length },
        { key: 'veryHigh' as const, label: 'Very High (100K-1M)', count: videoSegments.veryHigh.length },
        { key: 'high' as const, label: 'High (10K-100K)', count: videoSegments.high.length },
        { key: 'medium' as const, label: 'Medium (1K-10K)', count: videoSegments.medium.length },
        { key: 'low' as const, label: 'Low (<1K)', count: videoSegments.low.length },
    ];

    const videosToShow = getVideosToShow();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={onBack}
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                        >
                            <span>←</span>
                            <span>Back to Channels</span>
                        </button>
                        
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handleExport('csv')}
                                disabled={isExporting !== null}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium"
                            >
                                {isExporting === 'csv' ? 'Exporting...' : 'Export CSV'}
                            </button>
                            <button
                                onClick={() => handleExport('json')}
                                disabled={isExporting !== null}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 text-sm font-medium"
                            >
                                {isExporting === 'json' ? 'Exporting...' : 'Export JSON'}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-start space-x-4 mb-6">
                        <img
                            src={channelInfo.thumbnailUrl}
                            alt={`${channelInfo.channelName} profile`}
                            className="w-20 h-20 rounded-full object-cover"
                        />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{channelInfo.channelName}</h1>
                            <p className="text-gray-600 mt-1">
                                {channelInfo.subscriberCount.toLocaleString()} subscribers • {videos.length} videos
                            </p>
                            {channelInfo.description && (
                                <p className="text-gray-700 mt-2 max-w-3xl">{channelInfo.description}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {categories.map(category => (
                            <button
                                key={category.key}
                                onClick={() => setSelectedCategory(category.key)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                    selectedCategory === category.key
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                {category.label} ({category.count})
                            </button>
                        ))}
                    </div>
                </div>

                {videosToShow.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {videosToShow.map((video, index) => (
                            <VideoCard 
                                key={video.videoId || `video-${index}`} 
                                video={video} 
                                channelName={channelInfo.channelName} 
                                subscriberCount={channelInfo.subscriberCount}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-600 text-lg">
                            No videos found in this category.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}