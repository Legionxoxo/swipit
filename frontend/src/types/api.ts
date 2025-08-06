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

export interface AnalysisResponse {
    analysisId: string;
    status: 'processing' | 'completed' | 'error';
    progress: number;
    totalVideos: number;
    channelInfo: ChannelInfo;
    videoData: VideoData[];
    videoSegments: VideoSegments;
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