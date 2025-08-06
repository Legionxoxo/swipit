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