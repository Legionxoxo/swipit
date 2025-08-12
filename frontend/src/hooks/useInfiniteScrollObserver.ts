import { useEffect, useRef } from 'react';

interface UseInfiniteScrollObserverOptions {
    hasMore: boolean;
    isLoading: boolean;
    onLoadMore?: () => void;
    threshold?: number;
}

/**
 * Custom hook for handling infinite scroll with intersection observer
 * Extracted from CreatorsView to keep components under 250 lines
 */
export function useInfiniteScrollObserver({
    hasMore,
    isLoading,
    onLoadMore,
    threshold = 0.1
}: UseInfiniteScrollObserverOptions) {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect();
        
        // Setting up intersection observer for infinite scroll
        observerRef.current = new IntersectionObserver(
            entries => {
                // Observer triggered - checking intersection state
                if (entries[0].isIntersecting && hasMore && !isLoading && onLoadMore) {
                    // Loading more content
                    onLoadMore();
                }
            },
            { threshold }
        );
        
        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current);
            // Observer attached to load more element
            
            // Check if the element is already visible (viewport not full)
            // This can happen when there are few items
            setTimeout(() => {
                if (loadMoreRef.current) {
                    const rect = loadMoreRef.current.getBoundingClientRect();
                    const isVisible = rect.top < window.innerHeight;
                    // Checking initial visibility of load trigger
                    if (isVisible && hasMore && !isLoading && onLoadMore) {
                        // Triggering initial load for visible trigger
                        onLoadMore();
                    }
                }
            }, 100);
        } else {
            // No load more element available for observer
        }
        
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [hasMore, isLoading, onLoadMore, threshold]);

    return { loadMoreRef };
}