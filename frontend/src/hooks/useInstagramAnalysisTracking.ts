import { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';

interface InstagramAnalysisData {
    analysisId: string;
    status: 'processing' | 'completed' | 'failed';
    progress: number;
    profile?: {
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
    };
    reels?: any[];
    reelSegments?: any;
    totalReels?: number;
    error?: string;
}

export function useInstagramAnalysisTracking() {
    const [instagramAnalyses, setInstagramAnalyses] = useState<InstagramAnalysisData[]>([]);
    const [loadingInstagramAnalyses, setLoadingInstagramAnalyses] = useState<string[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [currentOffset, setCurrentOffset] = useState<number>(0);
    const pollIntervals = useRef<{ [key: string]: number }>({});
    const ITEMS_PER_PAGE = 20;

    // Load initial Instagram analyses from backend on mount
    useEffect(() => {
        loadCompletedInstagramAnalyses();
    }, []);

    const loadCompletedInstagramAnalyses = async (loadMore: boolean = false) => {
        try {
            if (isLoadingMore) return;
            
            const offset = loadMore ? currentOffset : 0;
            setIsLoadingMore(true);
            
            const result = await apiService.getAllCompletedInstagramAnalyses(ITEMS_PER_PAGE, offset);
            
            // Set total count
            setTotalCount(result.total);
            setHasMore(result.hasMore);
            
            // Transform backend data to frontend format
            const analysesWithData = await Promise.all(
                result.data.map(async (analysis: any) => {
                    try {
                        const analysisId = analysis.analysisId || analysis.analysis_id;
                        
                        // Skip individual post analyses (but allow creator analyses)
                        if (analysisId.startsWith('post_') || analysisId.startsWith('oembed_')) {
                            return null;
                        }
                        
                        const fullAnalysisData = await apiService.getInstagramAnalysisStatus(analysisId);
                        return {
                            analysisId: analysisId,
                            status: fullAnalysisData.status,
                            progress: fullAnalysisData.progress || 0,
                            profile: fullAnalysisData.profile,
                            reels: fullAnalysisData.reels || [],
                            reelSegments: fullAnalysisData.reelSegments,
                            totalReels: fullAnalysisData.totalReels || 0,
                            error: fullAnalysisData.error
                        };
                    } catch (error) {
                        console.error(`Error loading Instagram analysis ${analysis.analysis_id}:`, error);
                        return null;
                    }
                })
            );

            const validAnalyses = analysesWithData.filter(Boolean) as InstagramAnalysisData[];
            
            if (loadMore) {
                // Append to existing analyses
                setInstagramAnalyses(prev => [...prev, ...validAnalyses]);
                setCurrentOffset(offset + ITEMS_PER_PAGE);
            } else {
                // Replace analyses
                setInstagramAnalyses(validAnalyses);
                setCurrentOffset(ITEMS_PER_PAGE);
            }
        } catch (error) {
            console.error('Error loading completed Instagram analyses:', error);
        } finally {
            setIsLoadingMore(false);
        }
    };
    
    const loadMoreAnalyses = () => {
        if (hasMore && !isLoadingMore) {
            loadCompletedInstagramAnalyses(true);
        }
    };

    const startPolling = (analysisId: string) => {
        if (pollIntervals.current[analysisId]) {
            return; // Already polling
        }

        const poll = async () => {
            try {
                const analysis = await apiService.getInstagramAnalysisStatus(analysisId);
                
                setInstagramAnalyses(prev => {
                    const existingIndex = prev.findIndex(a => a.analysisId === analysisId);
                    const newAnalysis = { ...analysis };
                    
                    if (existingIndex >= 0) {
                        const updated = [...prev];
                        updated[existingIndex] = newAnalysis;
                        return updated;
                    } else {
                        return [...prev, newAnalysis];
                    }
                });

                // Stop polling if completed or failed
                if (analysis.status === 'completed' || analysis.status === 'failed') {
                    stopPolling(analysisId);
                    setLoadingInstagramAnalyses(prev => prev.filter(id => id !== analysisId));
                }
            } catch (error) {
                console.error(`Error polling Instagram analysis ${analysisId}:`, error);
                
                // Stop polling on error and mark as failed
                stopPolling(analysisId);
                setLoadingInstagramAnalyses(prev => prev.filter(id => id !== analysisId));
                
                setInstagramAnalyses(prev => {
                    const existingIndex = prev.findIndex(a => a.analysisId === analysisId);
                    if (existingIndex >= 0) {
                        const updated = [...prev];
                        updated[existingIndex] = {
                            ...updated[existingIndex],
                            status: 'failed',
                            error: 'Failed to get analysis status'
                        };
                        return updated;
                    }
                    return prev;
                });
            }
        };

        // Poll immediately, then every 3 seconds
        poll();
        pollIntervals.current[analysisId] = setInterval(poll, 3000);
    };

    const stopPolling = (analysisId: string) => {
        if (pollIntervals.current[analysisId]) {
            clearInterval(pollIntervals.current[analysisId]);
            delete pollIntervals.current[analysisId];
        }
    };

    const handleInstagramAnalysisStarted = (analysisId: string) => {
        setLoadingInstagramAnalyses(prev => [...prev, analysisId]);
        
        // Add initial analysis entry (check for duplicates)
        setInstagramAnalyses(prev => {
            const existingIndex = prev.findIndex(a => a.analysisId === analysisId);
            if (existingIndex >= 0) {
                return prev; // Already exists, don't add duplicate
            }
            return [...prev, {
                analysisId,
                status: 'processing',
                progress: 0
            }];
        });
        
        startPolling(analysisId);
    };

    const handleInstagramPostTracked = (postData: any) => {
        // Use username as the analysis ID to group posts by creator
        const analysisId = `creator_${postData.username}`;
        
        // Create the new post/reel data
        const newReel = {
            reel_id: postData.instagram_id,
            reel_shortcode: postData.instagram_id,
            reel_url: postData.post_link || '',
            reel_thumbnail_url: postData.thumbnail_url,
            reel_caption: postData.caption,
            reel_likes: 0, // Not available from oEmbed
            reel_comments: 0, // Not available from oEmbed
            reel_views: 0, // Not available from oEmbed
            reel_date_posted: new Date().toISOString(),
            reel_duration: 0, // Not available from oEmbed
            reel_hashtags: postData.hashtags || [],
            reel_mentions: [],
            // Add embed data for Instagram posts
            embed_link: postData.embed_link,
            post_link: postData.post_link,
            hashtags: postData.hashtags || []
        };

        setInstagramAnalyses(prev => {
            // Check if creator already exists
            const existingIndex = prev.findIndex(a => a.analysisId === analysisId);
            
            if (existingIndex >= 0) {
                // Add post to existing creator
                const updated = [...prev];
                const existingAnalysis = updated[existingIndex];
                
                // Check if this specific post already exists to avoid duplicates
                const existingReels = existingAnalysis.reels || [];
                const postExists = existingReels.some(reel => reel.reel_id === postData.instagram_id);
                
                if (!postExists) {
                    updated[existingIndex] = {
                        ...existingAnalysis,
                        reels: [...existingReels, newReel],
                        totalReels: (existingAnalysis.totalReels || 0) + 1,
                        profile: existingAnalysis.profile ? {
                            ...existingAnalysis.profile,
                            media_count: (existingAnalysis.profile.media_count || 0) + 1
                        } : undefined
                    };
                }
                return updated;
            } else {
                // Create new creator entry with this post
                const newAnalysis: InstagramAnalysisData = {
                    analysisId,
                    status: 'completed',
                    progress: 100,
                    profile: {
                        instagram_user_id: postData.username, // Use username as user ID
                        username: postData.username,
                        full_name: postData.username, // Use username as full name for posts
                        biography: '', // Not available for individual posts
                        follower_count: 0, // Not available for individual posts
                        following_count: 0, // Not available for individual posts
                        media_count: 1, // Starting with this one post
                        is_private: false, // Assume public if we can get post data
                        is_verified: false, // Not available for individual posts
                        profile_pic_url: postData.thumbnail_url || '' // Use post thumbnail as temp profile pic
                    },
                    reels: [newReel],
                    totalReels: 1,
                    reelSegments: {
                        viral: [],
                        veryHigh: [],
                        high: [],
                        medium: [],
                        low: []
                    }
                };
                return [...prev, newAnalysis];
            }
        });
    };

    // Cleanup intervals on unmount
    useEffect(() => {
        return () => {
            Object.values(pollIntervals.current).forEach(clearInterval);
        };
    }, []);

    return {
        instagramAnalyses,
        loadingInstagramAnalyses,
        handleInstagramAnalysisStarted,
        handleInstagramPostTracked,
        totalCount,
        hasMore,
        isLoadingMore,
        loadMoreAnalyses
    };
}