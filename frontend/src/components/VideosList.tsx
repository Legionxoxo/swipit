import { useState } from 'react';
import type { VideoData, ChannelInfo, VideoSegments } from '../types/api';
import VideoCard from './video/VideoCard';
import { apiService } from '../services';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

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
    videoSegments, 
    analysisId, 
    onBack
}: VideosListProps) {
    const [activeTab, setActiveTab] = useState<'views' | 'outlier'>('views');
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'viral' | 'veryHigh' | 'high' | 'medium' | 'low'>('all');
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
        if (activeTab === 'outlier') {
            switch (selectedOutlierCategory) {
                case 'viral': return outlierSegments.viral;
                case 'veryHigh': return outlierSegments.veryHigh;
                case 'high': return outlierSegments.high;
                case 'medium': return outlierSegments.medium;
                case 'low': return outlierSegments.low;
                default: return videos;
            }
        } else {
            switch (selectedCategory) {
                case 'viral': return safeVideoSegments.viral;
                case 'veryHigh': return safeVideoSegments.veryHigh;
                case 'high': return safeVideoSegments.high;
                case 'medium': return safeVideoSegments.medium;
                case 'low': return safeVideoSegments.low;
                default: return videos;
            }
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

    const safeVideoSegments = videoSegments || {
        viral: [],
        veryHigh: [],
        high: [],
        medium: [],
        low: []
    };

    const viewsCategories = [
        { key: 'all' as const, label: 'All Videos', count: videos.length },
        { key: 'viral' as const, label: 'Viral (1M+)', count: safeVideoSegments.viral.length },
        { key: 'veryHigh' as const, label: 'Very High (100K-1M)', count: safeVideoSegments.veryHigh.length },
        { key: 'high' as const, label: 'High (10K-100K)', count: safeVideoSegments.high.length },
        { key: 'medium' as const, label: 'Medium (1K-10K)', count: safeVideoSegments.medium.length },
        { key: 'low' as const, label: 'Low (<1K)', count: safeVideoSegments.low.length },
    ];

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

                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200 mb-4">
                        <nav className="flex space-x-8">
                            <button
                                onClick={() => {
                                    setActiveTab('views');
                                    setSelectedCategory('all');
                                }}
                                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'views'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Views
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('outlier');
                                    setSelectedOutlierCategory('all');
                                }}
                                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'outlier'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Outlier Performance
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'views' && (
                        <div>
                            <p className="text-sm text-gray-600 mb-4">
                                Filter videos by absolute view count ranges.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {viewsCategories.map(category => (
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
                    )}

                    {activeTab === 'outlier' && (
                        <div>
                            <p className="text-sm text-gray-600 mb-4">
                                Filter videos by performance ratio (views ÷ subscribers). Higher ratios indicate outlier performance.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {outlierCategories.map(category => (
                                    <button
                                        key={category.key}
                                        onClick={() => setSelectedOutlierCategory(category.key)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                            selectedOutlierCategory === category.key
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        {category.label} ({category.count})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
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
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
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