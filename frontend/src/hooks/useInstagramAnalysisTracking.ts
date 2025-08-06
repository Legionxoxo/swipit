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
    const pollIntervals = useRef<{ [key: string]: number }>({});

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
        
        // Add initial analysis entry
        setInstagramAnalyses(prev => [...prev, {
            analysisId,
            status: 'processing',
            progress: 0
        }]);
        
        startPolling(analysisId);
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
        handleInstagramAnalysisStarted
    };
}