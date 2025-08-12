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
            const validAnalyses = analysesData
                .filter((analysis: AnalysisResponse) => analysis && analysis.analysisId && analysis.status === 'completed')
                .map((analysis: AnalysisResponse) => ({
                    analysisId: analysis.analysisId,
                    data: analysis
                })) as AnalysisData[];

            // Prevent resetting existing analyses to avoid flicker on refresh
            setAnalyses(prev => {
                // If we already have data and the new data is the same length, keep existing
                // This prevents unnecessary re-renders during navigation
                if (prev.length > 0 && validAnalyses.length === prev.length) {
                    const existingIds = new Set(prev.map(a => a.analysisId));
                    const newIds = new Set(validAnalyses.map(a => a.analysisId));
                    
                    // If the sets are identical, keep existing state
                    if (existingIds.size === newIds.size && [...existingIds].every(id => newIds.has(id))) {
                        return prev;
                    }
                }
                return validAnalyses;
            });
            
            setTotalCount(total);
            setHasMore(more);
            setCurrentPage(1);
        } catch (error) {
            // Error loading completed analyses - handled silently
            console.error('Error loading completed analyses:', error);
            // Only reset if we don't have existing data to avoid losing state on error
            setAnalyses(prev => prev.length > 0 ? prev : []);
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
            const validAnalyses = analysesData
                .filter((analysis: AnalysisResponse) => analysis && analysis.analysisId && analysis.status === 'completed')
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

            let retryCount = 0;
            const MAX_RETRIES = 60; // 5 minutes maximum (60 * 5 seconds)
            const startTime = Date.now();
            const MAX_POLLING_TIME = 10 * 60 * 1000; // 10 minutes maximum

            const checkStatus = async () => {
                try {
                    // Check if we've exceeded maximum polling time or retry count
                    if (Date.now() - startTime > MAX_POLLING_TIME || retryCount >= MAX_RETRIES) {
                        console.warn(`Analysis polling timeout for ${analysisId} after ${retryCount} retries`);
                        setLoadingAnalyses(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(analysisId);
                            return newSet;
                        });
                        return;
                    }

                    retryCount++;
                    const response = await apiService.getAnalysisStatus(analysisId);

                    if (response.status === 'completed') {
                        setAnalyses(prev => {
                            const existing = prev.find(a => a.analysisId === analysisId);
                            if (existing) {
                                // Update existing analysis without losing other state
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
                        console.error(`Analysis failed: ${response.error || 'Unknown error'}`);
                        setLoadingAnalyses(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(analysisId);
                            return newSet;
                        });
                    } else {
                        setAnalyses(prev => {
                            const existing = prev.find(a => a.analysisId === analysisId);
                            if (existing) {
                                // Update existing analysis progress
                                return prev.map(a =>
                                    a.analysisId === analysisId
                                        ? { ...a, data: response }
                                        : a
                                );
                            } else {
                                return [...prev, { analysisId, data: response }];
                            }
                        });
                        setTimeout(checkStatus, 5000); // Increased to 5 seconds to reduce server load
                    }
                } catch (error) {
                    console.error('Error checking analysis status:', error);
                    
                    // Stop polling after too many errors
                    if (retryCount >= MAX_RETRIES) {
                        console.error(`Analysis polling failed for ${analysisId} after ${retryCount} retries`);
                        setLoadingAnalyses(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(analysisId);
                            return newSet;
                        });
                        return;
                    }
                    
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