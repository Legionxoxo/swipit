import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services';
import type { InstagramProfile, InstagramReel, InstagramReelSegments } from '../types/api';

interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalReels: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
}

interface InfiniteScrollInstagramState {
    reels: InstagramReel[];
    loading: boolean;
    hasMore: boolean;
    error: string | null;
    totalCount: number;
}

interface UseInfiniteScrollInstagramOptions {
    analysisId: string;
    pageSize?: number;
    autoLoad?: boolean;
}

export function useInfiniteScrollInstagram({ 
    analysisId, 
    pageSize = 50, 
    autoLoad = true 
}: UseInfiniteScrollInstagramOptions) {
    const [state, setState] = useState<InfiniteScrollInstagramState>({
        reels: [],
        loading: false,
        hasMore: true,
        error: null,
        totalCount: 0
    });
    
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [profile, setProfile] = useState<InstagramProfile | null>(null);
    const [reelSegments, setReelSegments] = useState<InstagramReelSegments | null>(null);

    const loadPage = useCallback(async (page: number, append: boolean = true) => {
        if (state.loading) return;

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const response = await apiService.getInstagramAnalysisStatus(analysisId, page, pageSize);
            
            if (response.status === 'completed' && response.reels) {
                const reels = response.reels || [];
                setState(prev => ({
                    ...prev,
                    reels: append ? [...prev.reels, ...reels] : reels,
                    loading: false,
                    hasMore: response.pagination?.hasNextPage ?? false,
                    totalCount: response.pagination?.totalReels ?? response.totalReels ?? 0
                }));
                
                if (response.pagination) {
                    setPagination({
                        currentPage: response.pagination.page || page,
                        totalPages: response.pagination.totalPages || 1,
                        totalReels: response.pagination.totalReels || response.totalReels || 0,
                        hasNextPage: response.pagination.hasNextPage || false,
                        hasPrevPage: response.pagination.hasPreviousPage || false,
                        limit: response.pagination.pageSize || 50
                    });
                } else {
                    setPagination(null);
                }
                setCurrentPage(page);
                
                // Store profile and segments on first load
                if (page === 1) {
                    setProfile(response.profile ?? null);
                    setReelSegments(response.reelSegments ?? null);
                }
            } else if (response.status === 'failed') {
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
            reels: [],
            loading: false,
            hasMore: true,
            error: null,
            totalCount: 0
        });
        setCurrentPage(1);
        setPagination(null);
        setProfile(null);
        setReelSegments(null);
        loadPage(1, false);
    }, [loadPage]);

    // Auto-load first page
    useEffect(() => {
        if (autoLoad && analysisId && state.reels.length === 0) {
            loadPage(1, false);
        }
    }, [analysisId, autoLoad, loadPage, state.reels.length]);

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
        reels: state.reels,
        loading: state.loading,
        hasMore: state.hasMore,
        error: state.error,
        totalCount: state.totalCount,
        pagination,
        currentPage,
        profile,
        reelSegments,
        loadMore,
        refresh
    };
}