import { localStorageService } from '../services/localStorage';

interface AnalysisData {
    analysisId: string;
    data: any;
}

export function getUnorganizedCreators(allCreatorIds: string[]): string[] {
    return localStorageService.getUnorganizedCreators(allCreatorIds);
}

export function getCreatorsForView(
    currentView: string, 
    analyses: AnalysisData[]
): AnalysisData[] {
    const allCreatorIds = analyses.map(a => a.analysisId);
    
    if (currentView === 'home') {
        const unorganizedIds = getUnorganizedCreators(allCreatorIds);
        return analyses.filter(a => unorganizedIds.includes(a.analysisId));
    } else if (currentView.startsWith('hub-')) {
        const hubId = currentView.replace('hub-', '');
        const creatorIds = localStorageService.getCreatorsInHub(hubId);
        return analyses.filter(a => creatorIds.includes(a.analysisId));
    } else if (currentView === 'favorite-creators') {
        const favoriteIds = localStorageService.getFavoriteCreators().map(f => f.analysisId);
        return analyses.filter(a => favoriteIds.includes(a.analysisId));
    }
    return [];
}