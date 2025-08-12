import { useState } from 'react';

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

interface InstagramAnalysisData {
    analysisId: string;
    status: 'processing' | 'completed' | 'failed';
    progress: number;
    profile?: InstagramProfile;
    reels?: any[];
    reelSegments?: any;
    totalReels?: number;
    error?: string;
}

interface InstagramProfilesViewProps {
    analyses: InstagramAnalysisData[];
    loadingAnalyses: string[];
    onProfileClick: (analysis: InstagramAnalysisData) => void;
    onProfileRightClick?: (event: React.MouseEvent, analysis: InstagramAnalysisData) => void;
    onTrackProfile: () => void;
}

export default function InstagramProfilesView({ 
    analyses, 
    loadingAnalyses, 
    onProfileClick, 
    onProfileRightClick,
    onTrackProfile 
}: InstagramProfilesViewProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const formatNumber = (num: number): string => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-600';
            case 'failed': return 'text-red-600';
            case 'processing': return 'text-blue-600';
            default: return 'text-gray-600';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return (
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                );
            case 'failed':
                return (
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                );
            case 'processing':
                return (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                );
            default:
                return null;
        }
    };

    const filteredAnalyses = analyses.filter(analysis =>
        analysis.profile?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.profile?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.analysisId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (analyses.length === 0 && loadingAnalyses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-4">
                <div className="text-center max-w-md">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-12 h-12 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.017 0C8.396 0 7.853.016 6.625.071 5.398.126 4.56.336 3.842.637c-.75.293-1.386.683-2.019 1.316C1.19 2.587.8 3.223.507 3.973c-.301.718-.511 1.556-.566 2.783C-.054 7.984-.072 8.527-.072 12.148s.018 4.164.072 5.392c.055 1.227.265 2.065.566 2.783.293.75.683 1.386 1.316 2.019.633.633 1.269 1.023 2.019 1.316.718.301 1.556.511 2.783.566 1.228.055 1.771.073 5.392.073s4.164-.018 5.392-.073c1.227-.055 2.065-.265 2.783-.566.75-.293 1.386-.683 2.019-1.316.633-.633 1.023-1.269 1.316-2.019.301-.718.511-1.556.566-2.783.055-1.228.073-1.771.073-5.392s-.018-4.164-.073-5.392c-.055-1.227-.265-2.065-.566-2.783-.293-.75-.683-1.386-1.316-2.019C18.598.8 17.962.41 17.212.117 16.494-.184 15.656-.394 14.429-.449 13.201-.504 12.658-.522 9.037-.522H12.017z"/>
                        </svg>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No Instagram profiles tracked yet
                    </h3>
                    
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Start tracking your first Instagram profile to see detailed reel analytics, engagement metrics, and performance insights.
                    </p>
                    
                    <button
                        onClick={onTrackProfile}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all shadow-sm"
                    >
                        Track Your First Profile
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Instagram Profiles</h1>
                    <p className="text-gray-600 mt-1">
                        {analyses.length} profile{analyses.length !== 1 ? 's' : ''} tracked
                        {loadingAnalyses.length > 0 && `, ${loadingAnalyses.length} analyzing`}
                    </p>
                </div>
                <button
                    onClick={onTrackProfile}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                    Track New Profile
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    placeholder="Search profiles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
            </div>

            {/* Profiles List */}
            <div className="space-y-4">
                {filteredAnalyses.map((analysis) => {
                    const isClickable = analysis.status === 'completed';
                    const isLoading = loadingAnalyses.includes(analysis.analysisId);

                    return (
                        <div
                            key={analysis.analysisId}
                            className={`bg-white rounded-lg shadow-md hover:shadow-lg border border-gray-200 overflow-hidden transition-all duration-200 ${
                                isClickable 
                                    ? 'cursor-pointer' 
                                    : 'cursor-default'
                            }`}
                            onClick={() => isClickable && onProfileClick(analysis)}
                            onContextMenu={(e) => onProfileRightClick?.(e, analysis)}
                        >
                            {/* Profile Header */}
                            <div className="relative">
                                <div className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 h-20"></div>
                                <div className="absolute -bottom-8 left-4">
                                    <img
                                        src={analysis.profile?.profile_pic_url || '/placeholder-avatar.png'}
                                        alt={analysis.profile?.full_name || 'Profile'}
                                        className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                                    />
                                </div>
                                {/* Status indicator */}
                                <div className="absolute top-3 right-3 flex items-center space-x-1">
                                    {getStatusIcon(analysis.status)}
                                    <span className={`text-xs font-medium ${getStatusColor(analysis.status)}`}>
                                        {analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)}
                                    </span>
                                </div>
                            </div>

                            {/* Profile Content */}
                            <div className="pt-10 p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <h3 className="font-bold text-gray-900 text-lg truncate">
                                        @{analysis.profile?.username || 'Unknown'}
                                    </h3>
                                    {analysis.profile?.is_verified && (
                                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                                
                                <p className="text-gray-600 font-medium mb-2 truncate">
                                    {analysis.profile?.full_name || 'Loading...'}
                                </p>
                                
                                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                                    {analysis.profile?.biography || 'No bio available'}
                                </p>

                                {/* Stats */}
                                {analysis.profile && (
                                    <div className="flex justify-around text-center text-sm mb-4">
                                        <div>
                                            <p className="font-bold text-gray-900">
                                                {formatNumber(analysis.profile.follower_count)}
                                            </p>
                                            <p className="text-gray-500 text-xs">Followers</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">
                                                {formatNumber(analysis.profile.media_count)}
                                            </p>
                                            <p className="text-gray-500 text-xs">Posts</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">
                                                {analysis.totalReels || 0}
                                            </p>
                                            <p className="text-gray-500 text-xs">Reels</p>
                                        </div>
                                    </div>
                                )}

                                {/* Progress bar for loading */}
                                {isLoading && (
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                                            <span>Analyzing...</span>
                                            <span>{analysis.progress || 0}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${analysis.progress || 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}

                                {/* Error message */}
                                {analysis.status === 'failed' && analysis.error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                        <p className="text-red-700 text-sm">{analysis.error}</p>
                                    </div>
                                )}

                                {/* Action button */}
                                {analysis.status === 'completed' && (
                                    <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                                        View Reels
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* No results */}
            {filteredAnalyses.length === 0 && searchTerm && (
                <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No profiles found</h3>
                    <p className="text-gray-500">Try adjusting your search terms.</p>
                </div>
            )}
        </div>
    );
}