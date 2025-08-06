import type { StarredVideo, VideoComment } from '../../types/api';

const STARRED_VIDEOS_KEY = 'starred_videos';
const VIDEO_COMMENTS_KEY = 'video_comments';

export const starsAndCommentsStorage = {
    // Starred Videos
    getStarredVideos(): StarredVideo[] {
        try {
            const data = localStorage.getItem(STARRED_VIDEOS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting starred videos:', error);
            return [];
        } finally {
            // Required by architecture rules
        }
    },

    setStarredVideos(videos: StarredVideo[]): void {
        try {
            localStorage.setItem(STARRED_VIDEOS_KEY, JSON.stringify(videos));
        } catch (error) {
            console.error('Error setting starred videos:', error);
        } finally {
            // Required by architecture rules
        }
    },

    addStarredVideo(video: StarredVideo): void {
        try {
            const starred = this.getStarredVideos();
            const existing = starred.findIndex(s => s.videoId === video.videoId);
            
            if (existing >= 0) {
                starred[existing] = { ...video, starredAt: new Date().toISOString() };
            } else {
                starred.push({ ...video, starredAt: new Date().toISOString() });
            }
            
            this.setStarredVideos(starred);
        } catch (error) {
            console.error('Error adding starred video:', error);
        } finally {
            // Required by architecture rules
        }
    },

    removeStarredVideo(videoId: string): void {
        try {
            const starred = this.getStarredVideos();
            const filtered = starred.filter(s => s.videoId !== videoId);
            this.setStarredVideos(filtered);
        } catch (error) {
            console.error('Error removing starred video:', error);
        } finally {
            // Required by architecture rules
        }
    },

    getVideoStarRating(videoId: string): number {
        try {
            const starred = this.getStarredVideos();
            const video = starred.find(s => s.videoId === videoId);
            return video ? video.rating : 0;
        } catch (error) {
            console.error('Error getting video star rating:', error);
            return 0;
        } finally {
            // Required by architecture rules
        }
    },

    // Video Comments
    getVideoComments(): VideoComment[] {
        try {
            const data = localStorage.getItem(VIDEO_COMMENTS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting video comments:', error);
            return [];
        } finally {
            // Required by architecture rules
        }
    },

    setVideoComments(comments: VideoComment[]): void {
        try {
            localStorage.setItem(VIDEO_COMMENTS_KEY, JSON.stringify(comments));
        } catch (error) {
            console.error('Error setting video comments:', error);
        } finally {
            // Required by architecture rules
        }
    },

    addOrUpdateVideoComment(videoId: string, comment: string): void {
        try {
            const comments = this.getVideoComments();
            const existing = comments.findIndex(c => c.videoId === videoId);
            
            if (existing >= 0) {
                comments[existing] = { 
                    videoId, 
                    comment, 
                    updatedAt: new Date().toISOString() 
                };
            } else {
                comments.push({ 
                    videoId, 
                    comment, 
                    updatedAt: new Date().toISOString() 
                });
            }
            
            this.setVideoComments(comments);
        } catch (error) {
            console.error('Error adding/updating video comment:', error);
        } finally {
            // Required by architecture rules
        }
    },

    removeVideoComment(videoId: string): void {
        try {
            const comments = this.getVideoComments();
            const filtered = comments.filter(c => c.videoId !== videoId);
            this.setVideoComments(filtered);
        } catch (error) {
            console.error('Error removing video comment:', error);
        } finally {
            // Required by architecture rules
        }
    },

    getVideoComment(videoId: string): VideoComment | null {
        try {
            const comments = this.getVideoComments();
            return comments.find(c => c.videoId === videoId) || null;
        } catch (error) {
            console.error('Error getting video comment:', error);
            return null;
        } finally {
            // Required by architecture rules
        }
    },

    hasVideoComment(videoId: string): boolean {
        try {
            const comments = this.getVideoComments();
            return comments.some(c => c.videoId === videoId);
        } catch (error) {
            console.error('Error checking if video has comment:', error);
            return false;
        } finally {
            // Required by architecture rules
        }
    }
};