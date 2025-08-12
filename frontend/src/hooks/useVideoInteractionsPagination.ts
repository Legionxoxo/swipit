import { useState, useEffect, useCallback } from 'react';
import { userInteractionService } from '../services/userInteractionService';
import type { UserVideoInteraction } from '../types/api';

interface UseVideoInteractionsPaginationOptions {
    userId: string;
    filter?: 'favorites' | 'starred';
    pageSize?: number;
}

interface UseVideoInteractionsPaginationReturn {
    data: UserVideoInteraction[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    loadMore: () => void;
    refresh: () => void;
}

/**
 * Custom hook for paginated video interactions (favorites, starred, etc.)
 * Handles loading, pagination, and error states for user video interactions
 */
export function useVideoInteractionsPagination({
    userId,
    filter,
    pageSize = 20
}: UseVideoInteractionsPaginationOptions): UseVideoInteractionsPaginationReturn {
    const [data, setData] = useState<UserVideoInteraction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(false);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

    /**
     * Load video interactions data from API
     * @param page - Page number to load
     * @param isLoadMore - Whether this is loading more data (append) or fresh load
     */
    const loadData = useCallback(async (page: number = 1, isLoadMore: boolean = false) => {
        try {
            // Set appropriate loading state
            if (isLoadMore) {
                setIsLoadingMore(true);
            } else {
                setLoading(true);
                setError(null);
            }

            // Fetch data from API
            const response = await userInteractionService.getUserVideoInteractions(
                userId,
                page,
                pageSize,
                filter
            );

            // Process response
            if (isLoadMore) {
                // Append new data to existing data
                setData(prevData => [...prevData, ...response.data]);
            } else {
                // Replace existing data with new data
                setData(response.data);
            }

            // Update pagination state
            setCurrentPage(page);
            setHasMore(response.pagination.hasNextPage);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load video interactions';
            setError(errorMessage);
            
            // If this was a load more request and failed, don't clear existing data
            if (!isLoadMore) {
                setData([]);
            }
        } finally {
            setLoading(false);
            setIsLoadingMore(false);
        }
    }, [userId, filter, pageSize]);

    /**
     * Load more data (next page)
     */
    const loadMore = useCallback(() => {
        if (!hasMore || isLoadingMore || loading) {
            return;
        }
        
        const nextPage = currentPage + 1;
        loadData(nextPage, true);
    }, [hasMore, isLoadingMore, loading, currentPage, loadData]);

    /**
     * Refresh data from beginning
     */
    const refresh = useCallback(() => {
        setCurrentPage(1);
        loadData(1, false);
    }, [loadData]);

    // Initial data load
    useEffect(() => {
        if (userId) {
            loadData(1, false);
        } else {
            // No user ID provided
            setLoading(false);
            setError('User ID is required');
            setData([]);
        }
    }, [userId, filter, loadData]);

    return {
        data,
        loading: loading && !isLoadingMore, // Only show loading when not loading more
        error,
        hasMore,
        loadMore,
        refresh
    };
}