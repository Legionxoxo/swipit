import { useState, useEffect, useRef, useMemo } from 'react';
import type { UnifiedCreator, CreatorHub } from '../types/api';
import { getFavoriteCreatorsAsync, getUnorganizedCreatorsAsync } from '../utils/creatorFilters';

interface UseCreatorFilteringOptions {
    currentView: string;
    unifiedCreators: UnifiedCreator[];
    hubs: CreatorHub[];
}

/**
 * Custom hook for filtering unified creators based on current view
 * Extracted from CreatorsView to keep components under 250 lines
 */
export function useCreatorFiltering({
    currentView,
    unifiedCreators,
    hubs
}: UseCreatorFilteringOptions) {
    const [filteredUnifiedCreators, setFilteredUnifiedCreators] = useState<UnifiedCreator[]>(unifiedCreators);
    const [isFiltering, setIsFiltering] = useState(false);
    const previousUnifiedCountRef = useRef<number>(unifiedCreators.length);

    // Memoize hub IDs to prevent unnecessary effect triggers
    const hubIds = useMemo(() => hubs.map(h => h.id).sort().join(','), [hubs]);
    
    // Memoize unified creator IDs to prevent unnecessary effect triggers  
    const unifiedCreatorIds = useMemo(() => 
        unifiedCreators.map(c => c.analysisId).sort().join(','), [unifiedCreators]
    );

    // Filter unified creators based on current view
    useEffect(() => {
        // Check if this is a pagination update (new creators added) vs initial load or view change
        const isPaginationUpdate = unifiedCreators.length > previousUnifiedCountRef.current;
        
        if (currentView === 'favorite-creators') {
            filterFavoriteCreators();
        } else if (currentView === 'home') {
            if (isPaginationUpdate) {
                // For pagination, only filter and append new creators
                filterUnorganizedCreatorsIncremental();
            } else {
                // For initial load or view change, filter all
                filterUnorganizedCreators();
            }
        } else if (currentView.startsWith('hub-')) {
            filterHubCreators();
        } else {
            setFilteredUnifiedCreators(unifiedCreators);
        }
        
        // Update the ref for next comparison
        previousUnifiedCountRef.current = unifiedCreators.length;
    }, [currentView, unifiedCreatorIds, hubIds]);

    const filterFavoriteCreators = async () => {
        try {
            setIsFiltering(true);
            const favoriteCreatorIds = await getFavoriteCreatorsAsync();
            const favoriteCreators = unifiedCreators.filter(
                creator => favoriteCreatorIds.includes(creator.analysisId)
            );
            setFilteredUnifiedCreators(favoriteCreators);
        } catch (error) {
            // Error filtering favorite creators - handled silently
            console.error('Error filtering favorite creators:', error);
            setFilteredUnifiedCreators([]);
        } finally {
            setIsFiltering(false);
        }
    };

    const filterUnorganizedCreators = async () => {
        try {
            setIsFiltering(true);
            const allCreatorIds = unifiedCreators.map(creator => creator.analysisId);
            console.debug('Filtering unorganized creators:', {
                allCreatorIds,
                totalCreators: unifiedCreators.length
            });
            
            const unorganizedCreatorIds = await getUnorganizedCreatorsAsync(allCreatorIds);
            console.debug('Unorganized creator IDs:', unorganizedCreatorIds);
            
            const unorganizedCreators = unifiedCreators.filter(
                creator => unorganizedCreatorIds.includes(creator.analysisId)
            );
            console.debug('Filtered unorganized creators:', {
                unorganizedCount: unorganizedCreators.length,
                unorganizedIds: unorganizedCreators.map(c => c.analysisId)
            });
            
            setFilteredUnifiedCreators(unorganizedCreators);
        } catch (error) {
            // Error filtering unorganized creators - handled silently
            console.error('Error filtering unorganized creators:', error);
            setFilteredUnifiedCreators(unifiedCreators); // Fallback to show all
        } finally {
            setIsFiltering(false);
        }
    };
    
    const filterUnorganizedCreatorsIncremental = async () => {
        try {
            // Only process new creators that were just added
            const newCreators = unifiedCreators.slice(previousUnifiedCountRef.current);
            if (newCreators.length === 0) return;
            
            const newCreatorIds = newCreators.map(creator => creator.analysisId);
            const unorganizedCreatorIds = await getUnorganizedCreatorsAsync(newCreatorIds);
            const newUnorganizedCreators = newCreators.filter(
                creator => unorganizedCreatorIds.includes(creator.analysisId)
            );
            
            // Incrementally filtered new unorganized creators
            
            // Append new filtered creators to existing ones
            setFilteredUnifiedCreators(prev => [...prev, ...newUnorganizedCreators]);
        } catch (error) {
            // Error filtering new unorganized creators - handled silently
            console.error('Error filtering new unorganized creators:', error);
            // On error, just add all new creators
            const newCreators = unifiedCreators.slice(previousUnifiedCountRef.current);
            setFilteredUnifiedCreators(prev => [...prev, ...newCreators]);
        } finally {
            // Required by architecture rules
        }
    };

    const filterHubCreators = async () => {
        try {
            setIsFiltering(true);
            const hubId = currentView.replace('hub-', '');
            const currentHub = hubs.find(h => h.id === hubId);
            
            console.debug('DEBUG filterHubCreators:', {
                hubId,
                currentHub,
                hubsAvailable: hubs.map(h => ({id: h.id, name: h.name, creatorCount: h.creatorIds?.length || 0})),
                unifiedCreatorsCount: unifiedCreators.length
            });
            
            if (currentHub) {
                const hubCreators = unifiedCreators.filter(
                    creator => currentHub.creatorIds.includes(creator.analysisId)
                );
                console.debug('DEBUG hub creators found:', {
                    hubCreatorIds: currentHub.creatorIds,
                    matchedCreatorIds: hubCreators.map(c => c.analysisId)
                });
                setFilteredUnifiedCreators(hubCreators);
            } else {
                console.debug('DEBUG hub not found, showing empty');
                setFilteredUnifiedCreators([]);
            }
        } catch (error) {
            // Error filtering hub creators - handled silently
            console.error('Error filtering hub creators:', error);
            setFilteredUnifiedCreators([]);
        } finally {
            setIsFiltering(false);
        }
    };

    return {
        filteredUnifiedCreators,
        isFiltering
    };
}