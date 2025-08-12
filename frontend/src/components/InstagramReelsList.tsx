import { useState } from 'react';
import { apiService } from '../services';
import ReelCard from './reel/ReelCard';
import { useInfiniteScrollInstagram } from '../hooks/useInfiniteScrollInstagram';
import { ChevronLeft } from 'lucide-react';

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
    reels: InstagramReel[];  // Initial reels (now unused with infinite scroll)
    reelSegments: ReelSegments | null;  // Initial segments (now unused with infinite scroll)
    analysisId: string;
    onBack: () => void;
}

export default function InstagramReelsList({ profileInfo: _initialProfile, reels: _initialReels, reelSegments: _initialSegments, analysisId, onBack }: InstagramReelsListProps) {
    const [selectedSegment, setSelectedSegment] = useState<string>('all');
    const [isExporting, setIsExporting] = useState(false);

    // Use infinite scroll for loading reels
    const {
        reels,
        loading: reelsLoading,
        hasMore,
        error: reelsError,
        profile,
        reelSegments
    } = useInfiniteScrollInstagram({
        analysisId,
        pageSize: 50,
        autoLoad: true
    });

    // Use the profile from infinite scroll if available, otherwise use initial
    const profileInfo = profile || _initialProfile;

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
            alert('Failed to export CSV. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };


    const reelsToShow = getReelsForSegment(selectedSegment);

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
                                aria-label="Back to profiles"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                                <img
                                    src={profileInfo.profile_pic_url}
                                    alt={`@${profileInfo.username} profile picture`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                            parent.innerHTML = `
                                                <div class="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-semibold">
                                                    ${profileInfo.username.slice(0, 2).toUpperCase()}
                                                </div>
                                            `;
                                        }
                                    }}
                                />
                            </div>

                            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                                @{profileInfo.username}
                                {profileInfo.is_verified && (
                                    <svg className="w-4 h-4 text-blue-500 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </h1>
                        </div>

                        <button
                            onClick={handleExportCsv}
                            disabled={isExporting}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                            {isExporting ? 'Exporting...' : 'Export CSV'}
                        </button>
                    </div>

                    {/* Performance Segment Controls */}
                    <div className="ml-12">
                        <p className="text-xs text-gray-500 mb-2">
                            Filter reels by performance segments
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { key: 'all', label: 'All Reels' },
                                { key: 'viral', label: 'Viral' },
                                { key: 'veryHigh', label: 'Very High' },
                                { key: 'high', label: 'High' },
                                { key: 'medium', label: 'Medium' },
                                { key: 'low', label: 'Low' }
                            ].map(segment => (
                                <button
                                    key={segment.key}
                                    onClick={() => setSelectedSegment(segment.key)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${selectedSegment === segment.key
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    {segment.label} ({getSegmentCount(segment.key)})
                                </button>
                            ))}
                        </div>
                    </div>
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
                    <div className="space-y-4">
                        {reelsToShow.map((reel) => (
                            <ReelCard
                                key={reel.reel_id}
                                reel={reel}
                                creatorName={profileInfo.username}
                                followerCount={profileInfo.follower_count}
                            />
                        ))}
                    </div>
                )}

                {/* Infinite scroll loading indicator */}
                {hasMore && (
                    <div className="flex justify-center py-8">
                        {reelsLoading ? (
                            <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 border-3 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-gray-600">Loading more reels...</span>
                            </div>
                        ) : (
                            <div className="h-4" />
                        )}
                    </div>
                )}

                {/* Error message */}
                {reelsError && (
                    <div className="text-center py-4 text-red-600">
                        Error loading reels: {reelsError}
                    </div>
                )}
            </div>

        </div>
    );
}