import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services';
import type { VideoData, PaginationInfo } from '../types/api';

interface InfiniteScrollState {
    data: VideoData[];
    loading: boolean;
    hasMore: boolean;
    error: string | null;
    totalCount: number;
}

interface UseInfiniteScrollOptions {
    analysisId: string;
    pageSize?: number;
    autoLoad?: boolean;
}

export function useInfiniteScroll({ 
    analysisId, 
    pageSize = 50, 
    autoLoad = true 
}: UseInfiniteScrollOptions) {
    const [state, setState] = useState<InfiniteScrollState>({
        data: [],
        loading: false,
        hasMore: true,
        error: null,
        totalCount: 0
    });
    
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);

    const loadPage = useCallback(async (page: number, append: boolean = true) => {
        if (state.loading) return;

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const response = await apiService.getAnalysisStatus(analysisId, page, pageSize);
            
            if (response.status === 'completed' && response.videoData) {
                setState(prev => ({
                    ...prev,
                    data: append ? [...prev.data, ...response.videoData] : response.videoData,
                    loading: false,
                    hasMore: response.pagination?.hasNextPage ?? false,
                    totalCount: response.pagination?.totalVideos ?? response.totalVideos ?? 0
                }));
                
                setPagination(response.pagination ?? null);
                setCurrentPage(page);
            } else if (response.status === 'error') {
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: response.error ?? 'Analysis failed'
                }));
            } else {
                // Still processing, try again later
                setState(prev => ({ ...prev, loading: false }));
                setTimeout(() => loadPage(page, append), 3000);
            }
        } catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to load data'
            }));
        }
    }, [analysisId, pageSize, state.loading]);

    const loadMore = useCallback(() => {
        if (state.hasMore && !state.loading) {
            loadPage(currentPage + 1, true);
        }
    }, [currentPage, state.hasMore, state.loading, loadPage]);

    const refresh = useCallback(() => {
        setState({
            data: [],
            loading: false,
            hasMore: true,
            error: null,
            totalCount: 0
        });
        setCurrentPage(1);
        setPagination(null);
        loadPage(1, false);
    }, [loadPage]);

    // Auto-load first page
    useEffect(() => {
        if (autoLoad && analysisId && state.data.length === 0) {
            loadPage(1, false);
        }
    }, [analysisId, autoLoad, loadPage, state.data.length]);

    // Setup infinite scroll listener
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop >=
                document.documentElement.offsetHeight - 1000 // Load 1000px before bottom
            ) {
                loadMore();
            }
        };

        if (state.hasMore && !state.loading) {
            window.addEventListener('scroll', handleScroll);
            return () => window.removeEventListener('scroll', handleScroll);
        }
    }, [loadMore, state.hasMore, state.loading]);

    return {
        data: state.data,
        loading: state.loading,
        hasMore: state.hasMore,
        error: state.error,
        totalCount: state.totalCount,
        pagination,
        currentPage,
        loadMore,
        refresh
    };
}