import { useState } from 'react';
import type { VideoData, ChannelInfo, VideoSegments } from '../types/api';
import VideoCard from './video/VideoCard';
import { apiService } from '../services';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { ChevronLeft } from 'lucide-react';

interface VideosListProps {
    channelInfo: ChannelInfo;
    videos?: VideoData[]; // Now optional, will use infinite scroll
    videoSegments: VideoSegments;
    analysisId: string;
    onBack: () => void;
}

export default function VideosList({
    channelInfo,
    videos: _initialVideos, // Unused, now using infinite scroll 
    videoSegments: _videoSegments, // Unused, now calculating dynamically
    analysisId,
    onBack
}: VideosListProps) {
    const [selectedOutlierCategory, setSelectedOutlierCategory] = useState<'all' | 'viral' | 'veryHigh' | 'high' | 'medium' | 'low'>('all');
    const [isExporting, setIsExporting] = useState<'csv' | 'json' | null>(null);

    // Use infinite scroll for loading videos
    const {
        data: videos,
        loading: videosLoading,
        hasMore,
        error: videosError,
        totalCount,
        loadMore
    } = useInfiniteScroll({
        analysisId,
        pageSize: 50,
        autoLoad: true
    });

    // Outlier calculation using same logic as VideoThumbnail component
    const getOutlierSegments = () => {
        const categorized = {
            viral: [] as VideoData[],
            veryHigh: [] as VideoData[],
            high: [] as VideoData[],
            medium: [] as VideoData[],
            low: [] as VideoData[]
        };

        videos.forEach(video => {
            const effectiveSubscriberCount = channelInfo.subscriberCount === 0 ? 1 : channelInfo.subscriberCount;
            const ratio = video.viewCount / effectiveSubscriberCount;

            if (ratio >= 100) categorized.viral.push(video);
            else if (ratio >= 75) categorized.veryHigh.push(video);
            else if (ratio >= 50) categorized.high.push(video);
            else if (ratio >= 25) categorized.medium.push(video);
            else categorized.low.push(video);
        });

        return categorized;
    };

    const outlierSegments = getOutlierSegments();

    const getVideosToShow = (): VideoData[] => {
        switch (selectedOutlierCategory) {
            case 'viral': return outlierSegments.viral;
            case 'veryHigh': return outlierSegments.veryHigh;
            case 'high': return outlierSegments.high;
            case 'medium': return outlierSegments.medium;
            case 'low': return outlierSegments.low;
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

    const outlierCategories = [
        { key: 'all' as const, label: 'All Videos', count: videos.length },
        { key: 'viral' as const, label: 'Viral (≥100x)', count: outlierSegments.viral.length },
        { key: 'veryHigh' as const, label: 'Very High (≥75x)', count: outlierSegments.veryHigh.length },
        { key: 'high' as const, label: 'High (≥50x)', count: outlierSegments.high.length },
        { key: 'medium' as const, label: 'Medium (≥25x)', count: outlierSegments.medium.length },
        { key: 'low' as const, label: 'Low (<25x)', count: outlierSegments.low.length },
    ];

    const videosToShow = getVideosToShow();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 pb-4">
                {/* Simple Header */}
                <div className="pb-4 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={onBack}
                                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                                aria-label="Back to channels"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                                <img
                                    src={channelInfo.thumbnailUrl}
                                    alt={`${channelInfo.channelName} logo`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                            parent.innerHTML = `
                                                <div class="w-full h-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-xs font-semibold">
                                                    ${channelInfo.channelName.slice(0, 2).toUpperCase()}
                                                </div>
                                            `;
                                        }
                                    }}
                                />
                            </div>

                            <h1 className="text-xl font-semibold text-gray-900">
                                {channelInfo.channelName}
                            </h1>
                        </div>

                        <button
                            onClick={() => handleExport('csv')}
                            disabled={isExporting !== null}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                            {isExporting === 'csv' ? 'Exporting...' : 'Export CSV'}
                        </button>
                    </div>

                    {/* Outlier Performance Controls */}
                    <div className="ml-12">
                        <p className="text-xs text-gray-500 mb-2">
                            Filter by performance ratio (views ÷ subscribers)
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {outlierCategories.map(category => (
                                <button
                                    key={category.key}
                                    onClick={() => setSelectedOutlierCategory(category.key)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${selectedOutlierCategory === category.key
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    {category.label} ({category.count})
                                </button>
                            ))}
                        </div>
                    </div>
                </div>


                {videosError && (
                    <div className="text-center py-12">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                            <p className="text-red-600 text-lg font-medium">Error loading videos</p>
                            <p className="text-red-500 mt-2">{videosError}</p>
                        </div>
                    </div>
                )}

                {videosToShow.length > 0 ? (
                    <>
                        <div className="space-y-4">
                            {videosToShow.map((video, index) => (
                                <VideoCard
                                    key={video.videoId || `video-${index}`}
                                    video={video}
                                    channelName={channelInfo.channelName}
                                    subscriberCount={channelInfo.subscriberCount}
                                />
                            ))}
                        </div>

                        {/* Infinite Scroll Loading States */}
                        {videosLoading && (
                            <div className="text-center py-8">
                                <div className="inline-flex items-center space-x-2">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    <span className="text-gray-600">Loading more videos...</span>
                                </div>
                            </div>
                        )}

                        {hasMore && !videosLoading && (
                            <div className="text-center py-8">
                                <button
                                    onClick={loadMore}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors cursor-pointer"
                                >
                                    Load More Videos
                                </button>
                                <p className="text-sm text-gray-500 mt-2">
                                    Showing {videosToShow.length} of {totalCount} videos
                                </p>
                            </div>
                        )}

                        {!hasMore && videos.length > 50 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">
                                    Showing all {videosToShow.length} videos
                                </p>
                            </div>
                        )}
                    </>
                ) : !videosLoading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 text-lg">
                            No videos found in this category.
                        </p>
                    </div>
                ) : null}
            </div>
        </div>
    );
}