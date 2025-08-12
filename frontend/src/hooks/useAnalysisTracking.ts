import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services';
import type { AnalysisResponse } from '../types/api';

interface AnalysisData {
    analysisId: string;
    data: AnalysisResponse;
}


export function useAnalysisTracking() {
    const [analyses, setAnalyses] = useState<AnalysisData[]>([]);
    const [loadingAnalyses, setLoadingAnalyses] = useState<Set<string>>(new Set());
    const [totalCount, setTotalCount] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const ITEMS_PER_PAGE = 20;

    // Load completed analyses from backend on mount
    useEffect(() => {
        loadCompletedAnalyses();
    }, []);

    const loadCompletedAnalyses = async () => {
        try {
            // Request full data in single API call to avoid N+1 queries
            const result = await apiService.getAllCompletedAnalyses(ITEMS_PER_PAGE, 0, true);
            
            // Handle both old format (array) and new format (with pagination)
            const analysesData = Array.isArray(result) ? result : result.data;
            const total = Array.isArray(result) ? result.length : result.total;
            const more = Array.isArray(result) ? false : result.hasMore;
            
            // Transform backend data to frontend format - now data is already full
            // Filter out malformed entries with invalid analysisIds
            const validAnalyses = analysesData
                .filter((analysis: AnalysisResponse) => {
                    // Check for basic validity
                    if (!analysis || !analysis.analysisId || analysis.status !== 'completed') {
                        return false;
                    }
                    
                    // Check for malformed analysisId
                    const analysisId = analysis.analysisId;
                    const isValidId = (
                        typeof analysisId === 'string' &&
                        analysisId.trim().length > 0 &&
                        analysisId !== '[object Object]' &&
                        !analysisId.includes('[object') &&
                        !analysisId.includes('undefined') &&
                        !analysisId.includes('null')
                    );
                    
                    if (!isValidId) {
                        console.warn('Filtered malformed analysis entry:', {
                            analysisId,
                            channelName: analysis.channelInfo?.channelName || 'Unknown'
                        });
                        return false;
                    }
                    
                    return true;
                })
                .map((analysis: AnalysisResponse) => ({
                    analysisId: analysis.analysisId,
                    data: analysis
                })) as AnalysisData[];

            setAnalyses(validAnalyses);
            setTotalCount(total);
            setHasMore(more);
            setCurrentPage(1);
        } catch (error) {
            // Error loading completed analyses - handled silently
            console.error('Error loading completed analyses:', error);
            setAnalyses([]);
            setTotalCount(0);
            setHasMore(false);
        } finally {
            // Required by architecture rules
        }
    };
    
    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;
        
        try {
            setIsLoadingMore(true);
            const offset = currentPage * ITEMS_PER_PAGE;
            // Request full data in single API call to avoid N+1 queries
            const result = await apiService.getAllCompletedAnalyses(ITEMS_PER_PAGE, offset, true);
            
            // Handle both old format (array) and new format (with pagination)
            const analysesData = Array.isArray(result) ? result : result.data;
            const more = Array.isArray(result) ? false : result.hasMore;
            
            // Transform backend data to frontend format - now data is already full
            // Filter out malformed entries with invalid analysisIds
            const validAnalyses = analysesData
                .filter((analysis: AnalysisResponse) => {
                    // Check for basic validity
                    if (!analysis || !analysis.analysisId || analysis.status !== 'completed') {
                        return false;
                    }
                    
                    // Check for malformed analysisId
                    const analysisId = analysis.analysisId;
                    const isValidId = (
                        typeof analysisId === 'string' &&
                        analysisId.trim().length > 0 &&
                        analysisId !== '[object Object]' &&
                        !analysisId.includes('[object') &&
                        !analysisId.includes('undefined') &&
                        !analysisId.includes('null')
                    );
                    
                    if (!isValidId) {
                        console.warn('Filtered malformed analysis entry:', {
                            analysisId,
                            channelName: analysis.channelInfo?.channelName || 'Unknown'
                        });
                        return false;
                    }
                    
                    return true;
                })
                .map((analysis: AnalysisResponse) => ({
                    analysisId: analysis.analysisId,
                    data: analysis
                })) as AnalysisData[];

            setAnalyses(prev => [...prev, ...validAnalyses]);
            setHasMore(more);
            setCurrentPage(prev => prev + 1);
        } catch (error) {
            // Error loading more analyses - handled silently
            console.error('Error loading more analyses:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [currentPage, hasMore, isLoadingMore]);

    const handleAnalysisStarted = async (analysisId: string) => {
        try {
            setLoadingAnalyses(prev => new Set([...prev, analysisId]));

            const checkStatus = async () => {
                try {
                    const response = await apiService.getAnalysisStatus(analysisId);

                    if (response.status === 'completed') {
                        setAnalyses(prev => {
                            const existing = prev.find(a => a.analysisId === analysisId);
                            if (existing) {
                                return prev.map(a =>
                                    a.analysisId === analysisId
                                        ? { ...a, data: response }
                                        : a
                                );
                            } else {
                                return [...prev, { analysisId, data: response }];
                            }
                        });
                        setLoadingAnalyses(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(analysisId);
                            return newSet;
                        });
                    } else if (response.status === 'error') {
                        alert(`Analysis failed: ${response.error || 'Unknown error'}`);
                        setLoadingAnalyses(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(analysisId);
                            return newSet;
                        });
                    } else {
                        setAnalyses(prev => {
                            const existing = prev.find(a => a.analysisId === analysisId);
                            if (existing) {
                                return prev.map(a =>
                                    a.analysisId === analysisId
                                        ? { ...a, data: response }
                                        : a
                                );
                            } else {
                                return [...prev, { analysisId, data: response }];
                            }
                        });
                        setTimeout(checkStatus, 3000);
                    }
                } catch (error) {
                    console.error('Error checking analysis status:', error);
                    setTimeout(checkStatus, 5000);
                }
            };

            checkStatus();
        } catch (error) {
            console.error('Error starting analysis tracking:', error);
            setLoadingAnalyses(prev => {
                const newSet = new Set(prev);
                newSet.delete(analysisId);
                return newSet;
            });
        } finally {
            // Required by architecture rules
        }
    };

    return {
        analyses,
        loadingAnalyses,
        handleAnalysisStarted,
        totalCount,
        hasMore,
        isLoadingMore,
        loadMore
    };
}