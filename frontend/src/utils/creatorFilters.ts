import { apiService } from '../services/api';
import { userService } from '../services/userService';

interface AnalysisData {
    analysisId: string;
    data: any;
}

export function getUnorganizedCreators(allCreatorIds: string[]): string[] {
    // Note: This function is now synchronous but needs async database calls
    // For compatibility, return all creators for now
    console.warn('getUnorganizedCreators needs async refactoring for database support');
    return allCreatorIds;
}

export function getCreatorsForView(
    currentView: string, 
    analyses: AnalysisData[]
): AnalysisData[] {
    // Note: This function needs to be refactored to be async for database support
    // For now, return basic filtering
    
    if (currentView === 'home') {
        // Return all analyses for now - needs async refactoring
        return analyses;
    } else if (currentView.startsWith('hub-')) {
        // This will need to be handled by parent component with async hub data
        return [];
    } else if (currentView === 'favorite-creators') {
        // This will need to be handled by parent component with async favorite data
        return [];
    }
    return [];
}

// New async versions for database support
export async function getUnorganizedCreatorsAsync(allCreatorIds: string[]): Promise<string[]> {
    try {
        const userId = userService.getUserId();
        const hubs = await apiService.getUserHubs(userId);
        const organizedIds = new Set<string>();
        
        hubs.forEach(hub => {
            hub.creatorIds.forEach(id => organizedIds.add(id));
        });
        
        return allCreatorIds.filter(id => !organizedIds.has(id));
    } catch (error) {
        console.error('Error getting unorganized creators:', error);
        return allCreatorIds;
    } finally {
        // Required by architecture rules
    }
}

export async function getFavoriteCreatorsAsync(): Promise<string[]> {
    try {
        const userId = userService.getUserId();
        const interactions = await apiService.getUserCreatorInteractions(userId);
        return interactions
            .filter(interaction => interaction.is_favorite)
            .map(interaction => interaction.creator_id);
    } catch (error) {
        console.error('Error getting favorite creators:', error);
        return [];
    } finally {
        // Required by architecture rules
    }
}

export async function getCreatorsForViewAsync(
    currentView: string, 
    analyses: AnalysisData[]
): Promise<AnalysisData[]> {
    try {
        const allCreatorIds = analyses.map(a => a.analysisId);
        
        if (currentView === 'home') {
            const unorganizedIds = await getUnorganizedCreatorsAsync(allCreatorIds);
            return analyses.filter(a => unorganizedIds.includes(a.analysisId));
        } else if (currentView.startsWith('hub-')) {
            const hubId = currentView.replace('hub-', '');
            const userId = userService.getUserId();
            const hubs = await apiService.getUserHubs(userId);
            const hub = hubs.find(h => h.id === hubId);
            const creatorIds = hub ? hub.creatorIds : [];
            return analyses.filter(a => creatorIds.includes(a.analysisId));
        } else if (currentView === 'favorite-creators') {
            const favoriteIds = await getFavoriteCreatorsAsync();
            return analyses.filter(a => favoriteIds.includes(a.analysisId));
        }
        
        return [];
    } catch (error) {
        console.error('Error getting creators for view:', error);
        return [];
    } finally {
        // Required by architecture rules
    }
}