export interface ChannelInfo {
    channelId: string;
    channelName: string;
    channelUrl: string;
    subscriberCount: number;
    videoCount: number;
    creationDate: string;
    description: string;
    thumbnailUrl: string;
}

export interface VideoData {
    videoId: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    videoUrl: string;
    uploadDate: string;
    duration: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    categoryId: string;
}

export interface VideoSegments {
    viral: VideoData[];
    veryHigh: VideoData[];
    high: VideoData[];
    medium: VideoData[];
    low: VideoData[];
}

export interface PaginationInfo {
    page: number;
    pageSize: number;
    totalVideos?: number;
    totalReels?: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface AnalysisResponse {
    analysisId: string;
    status: 'processing' | 'completed' | 'error';
    progress: number;
    totalVideos: number;
    channelInfo: ChannelInfo;
    videoData: VideoData[];
    videoSegments: VideoSegments;
    pagination?: PaginationInfo;
    processingTime?: string;
    error?: string;
}

export interface StartAnalysisRequest {
    channelUrl: string;
}

export interface StartAnalysisResponse {
    analysisId: string;
    estimatedCompletionTime: string;
}

export interface ApiError {
    error: string;
    message: string;
}

// Extended types for organization features
export interface CreatorHub {
    id: string;
    name: string;
    createdAt: string;
    creatorIds: string[];
}

export interface FavoriteCreator {
    analysisId: string;
    channelId: string;
    channelName: string;
    thumbnailUrl: string;
    addedAt: string;
}

export interface FavoriteVideo {
    videoId: string;
    title: string;
    channelName: string;
    thumbnailUrl: string;
    videoUrl: string;
    addedAt: string;
}

export interface StarredVideo {
    videoId: string;
    title: string;
    channelName: string;
    thumbnailUrl: string;
    videoUrl: string;
    starredAt: string;
    rating: number; // Star rating 1-5
    note?: string; // Optional note for starred videos
}

export interface VideoComment {
    videoId: string;
    comment: string;
    updatedAt: string;
}

export interface VideoTranscription {
    transcriptionId: string;
    videoId: string;
    userId: string;
    videoUrl: string;
    platform: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    videoTitle: string;
    videoDuration: string;
    videoThumbnailUrl: string;
    rawTranscript?: string;
    formattedTranscript?: string;
    languageDetected?: string;
    confidenceScore?: number;
    processingStartedAt?: string;
    processingCompletedAt?: string;
    processingTimeSeconds?: number;
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
    // Legacy fields for backward compatibility
    transcription?: string;
    confidence?: number;
    language?: string;
    generatedAt?: string;
}

export interface AppData {
    hubs: CreatorHub[];
    favoriteCreators: FavoriteCreator[];
    favoriteVideos: FavoriteVideo[];
    starredVideos: StarredVideo[];
    videoComments: VideoComment[];
    videoTranscriptions: VideoTranscription[];
}

export interface AnalysisData {
    analysisId: string;
    data: AnalysisResponse;
}

// Instagram related interfaces
export interface InstagramProfile {
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

export interface InstagramReel {
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

export interface InstagramReelSegments {
    viral: InstagramReel[];
    veryHigh: InstagramReel[];
    high: InstagramReel[];
    medium: InstagramReel[];
    low: InstagramReel[];
}

export interface InstagramAnalysisData {
    analysisId: string;
    status: 'processing' | 'completed' | 'failed';
    progress: number;
    profile?: InstagramProfile;
    reels?: InstagramReel[];
    reelSegments?: InstagramReelSegments;
    totalReels?: number;
    pagination?: PaginationInfo;
    error?: string;
}

export interface UnifiedCreator {
    analysisId: string;
    platform: 'youtube' | 'instagram';
    data?: AnalysisResponse;
    instagramData?: InstagramAnalysisData;
}

// User interaction interfaces
export interface UserVideoInteraction {
    id: string;
    user_id: string;
    video_id: string;
    platform: string;
    is_favorite: boolean;
    star_rating: number;
    comment: string;
    created_at: string;
    updated_at: string;
    // Joined video data fields (from backend JOIN query)
    title?: string;
    description?: string;
    thumbnail_url?: string;
    video_url?: string;
    upload_date?: string;
    duration?: string;
    view_count?: number;
    like_count?: number;
    comment_count?: number;
    category_id?: string;
    channel_name?: string;
    channel_thumbnail_url?: string;
    subscriber_count?: number;
    // Instagram-specific fields
    embed_link?: string;
    post_link?: string;
}

export interface UserCreatorInteraction {
    id: string;
    user_id: string;
    creator_id: string;
    platform: string;
    is_favorite: boolean;
    created_at: string;
    updated_at: string;
}

// Utility interfaces
export interface BackendVideoData {
    videoId: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    videoUrl: string;
    uploadDate: string;
    duration: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    categoryId: string;
}

export interface OEmbedPostData {
    url: string;
    embed_html?: string;
    author_name?: string;
    author_url?: string;
    provider_name?: string;
    provider_url?: string;
    title?: string;
    type?: string;
    version?: string;
    width?: number;
    height?: number;
    // Additional properties for Instagram posts
    username?: string;
    instagram_id?: string;
    post_link?: string;
    thumbnail_url?: string;
    caption?: string;
    hashtags?: string[];
    embed_link?: string;
}