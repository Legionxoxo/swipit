import { useState } from 'react';
import { apiService } from '../services/api';
import ReelCard from './reel/ReelCard';
// import { useInfiniteScrollInstagram } from '../hooks/useInfiniteScrollInstagram'; // TODO: Implement for Instagram

interface InstagramProfile {
    instagram_user_id: string;
    username: string;
    full_name: string;
    biography: string;
    follower_count: number;
    following_count: number;
    media_count: number;
    is_private: boolean;
    is_verified: boolean;
    external_url?: string;
    profile_pic_url: string;
}

interface InstagramReel {
    reel_id: string;
    reel_shortcode: string;
    reel_url: string;
    reel_thumbnail_url: string;
    reel_caption: string;
    reel_likes: number;
    reel_comments: number;
    reel_views: number;
    reel_date_posted: string;
    reel_duration: number;
    reel_hashtags: string[];
    reel_mentions: string[];
    // Additional fields for Instagram posts tracked via oEmbed
    embed_link?: string;
    post_link?: string;
    hashtags?: string[];
}

interface ReelSegments {
    viral: InstagramReel[];
    veryHigh: InstagramReel[];
    high: InstagramReel[];
    medium: InstagramReel[];
    low: InstagramReel[];
}

interface InstagramReelsListProps {
    profileInfo: InstagramProfile;
    reels: InstagramReel[];
    reelSegments: ReelSegments | null;
    analysisId: string;
    onBack: () => void;
    viewMode: 'grid' | 'list';
}

export default function InstagramReelsList({ profileInfo, reels, reelSegments, analysisId, onBack, viewMode }: InstagramReelsListProps) {
    const [selectedSegment, setSelectedSegment] = useState<string>('all');
    const [isExporting, setIsExporting] = useState(false);

    const formatNumber = (num: number | undefined): string => {
        if (num === undefined || num === null) {
            return '0';
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };



    const getReelsForSegment = (segment: string): InstagramReel[] => {
        if (segment === 'all') return reels;
        if (!reelSegments) return [];
        
        switch (segment) {
            case 'viral': return reelSegments.viral;
            case 'veryHigh': return reelSegments.veryHigh;
            case 'high': return reelSegments.high;
            case 'medium': return reelSegments.medium;
            case 'low': return reelSegments.low;
            default: return reels;
        }
    };

    const getSegmentCount = (segment: string): number => {
        return getReelsForSegment(segment).length;
    };

    const handleExportCsv = async () => {
        try {
            setIsExporting(true);
            const csvBlob = await apiService.exportInstagramToCsv(analysisId);
            const filename = `instagram_analysis_${profileInfo.username}_${new Date().toISOString().split('T')[0]}.csv`;
            apiService.downloadFile(csvBlob, filename);
        } catch (error) {
            console.error('CSV export error:', error);
            alert('Failed to export CSV. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportJson = async () => {
        try {
            setIsExporting(true);
            const jsonBlob = await apiService.exportInstagramToJson(analysisId);
            const filename = `instagram_analysis_${profileInfo.username}_${new Date().toISOString().split('T')[0]}.json`;
            apiService.downloadFile(jsonBlob, filename);
        } catch (error) {
            console.error('JSON export error:', error);
            alert('Failed to export JSON. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const reelsToShow = getReelsForSegment(selectedSegment);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header with profile info and back button */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={onBack}
                                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to Profiles
                            </button>
                        </div>
                        
                        <div className="flex space-x-2">
                            <button
                                onClick={handleExportCsv}
                                disabled={isExporting}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {isExporting ? 'Exporting...' : 'Export CSV'}
                            </button>
                            <button
                                onClick={handleExportJson}
                                disabled={isExporting}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {isExporting ? 'Exporting...' : 'Export JSON'}
                            </button>
                        </div>
                    </div>
                    
                    {/* Profile Info */}
                    <div className="mt-6 flex items-center space-x-6">
                        <img 
                            src={profileInfo.profile_pic_url} 
                            alt={profileInfo.full_name}
                            className="w-20 h-20 rounded-full"
                        />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                                @{profileInfo.username}
                                {profileInfo.is_verified && (
                                    <svg className="w-6 h-6 text-blue-500 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </h1>
                            <p className="text-xl text-gray-600 mt-1">{profileInfo.full_name}</p>
                            <p className="text-gray-600 mt-2">{profileInfo.biography}</p>
                            <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                                <span><strong>{formatNumber(profileInfo.follower_count)}</strong> followers</span>
                                <span><strong>{formatNumber(profileInfo.following_count)}</strong> following</span>
                                <span><strong>{profileInfo.media_count}</strong> posts</span>
                                <span><strong>{reels.length}</strong> reels analyzed</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Segment Navigation */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex flex-wrap gap-2 mb-6">
                    {[
                        { key: 'all', label: 'All Reels', color: 'bg-gray-100 text-gray-800' },
                        { key: 'viral', label: 'Viral', color: 'bg-red-100 text-red-800' },
                        { key: 'veryHigh', label: 'Very High', color: 'bg-orange-100 text-orange-800' },
                        { key: 'high', label: 'High', color: 'bg-yellow-100 text-yellow-800' },
                        { key: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
                        { key: 'low', label: 'Low', color: 'bg-gray-100 text-gray-600' }
                    ].map(segment => (
                        <button
                            key={segment.key}
                            onClick={() => setSelectedSegment(segment.key)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                selectedSegment === segment.key 
                                    ? 'bg-purple-600 text-white' 
                                    : segment.color + ' hover:opacity-80'
                            }`}
                        >
                            {segment.label} ({getSegmentCount(segment.key)})
                        </button>
                    ))}
                </div>

                {/* Reels Grid */}
                {reelsToShow.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No reels found</h3>
                        <p className="text-gray-500">This segment doesn't contain any reels.</p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' 
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        : "space-y-4"
                    }>
                        {reelsToShow.map((reel) => (
                            <ReelCard
                                key={reel.reel_id}
                                reel={reel}
                                creatorName={profileInfo.username}
                                followerCount={profileInfo.follower_count}
                                viewMode={viewMode}
                            />
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}