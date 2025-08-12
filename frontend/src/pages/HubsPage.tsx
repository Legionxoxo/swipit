import { useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import CreatorsView from '../components/views/CreatorsView';
import type { AnalysisResponse, CreatorHub, UnifiedCreator } from '../types/api';
import { useAnalysisTracking } from '../hooks/useAnalysisTracking';
import { useInstagramAnalysisTracking } from '../hooks/useInstagramAnalysisTracking';
import { getCreatorsForView } from '../utils/creatorFilters';

interface OutletContext {
    hubs: CreatorHub[];
    onHubsChange: (hubs: CreatorHub[]) => void;
    onChannelRightClick: (event: React.MouseEvent, analysisId: string) => void;
    analyses: { analysisId: string; data: AnalysisResponse }[];
}

interface AnalysisData {
    analysisId: string;
    data: AnalysisResponse;
}

export function HubsPage() {
    const navigate = useNavigate();
    const { hubs, onHubsChange, onChannelRightClick, analyses } = useOutletContext<OutletContext>();
    
    const { 
        loadingAnalyses, 
        totalCount: youtubeTotalCount,
        hasMore: youtubeHasMore,
        isLoadingMore: youtubeIsLoadingMore,
        loadMore: loadMoreYoutube
    } = useAnalysisTracking();
    
    const { 
        instagramAnalyses, 
        loadingInstagramAnalyses, 
        totalCount: instagramTotalCount,
        hasMore: instagramHasMore,
        isLoadingMore: instagramIsLoadingMore,
        loadMoreAnalyses: loadMoreInstagram
    } = useInstagramAnalysisTracking();

    // Create unified creator list - memoized to prevent unnecessary re-renders
    const unifiedCreators: UnifiedCreator[] = useMemo(() => {
        const youtube = analyses.map(analysis => ({
            analysisId: analysis.analysisId,
            platform: 'youtube' as const,
            data: analysis.data
        }));
        const instagram = instagramAnalyses.map(analysis => ({
            analysisId: analysis.analysisId,
            platform: 'instagram' as const,
            instagramData: analysis
        }));
        
        // Deduplicate creators by analysisId - if same creator has both platforms, prefer YouTube
        const creatorMap = new Map<string, UnifiedCreator>();
        
        // Add Instagram creators first
        instagram.forEach(creator => {
            creatorMap.set(creator.analysisId, creator);
        });
        
        // Add YouTube creators (will override Instagram if same analysisId)
        youtube.forEach(creator => {
            const existing = creatorMap.get(creator.analysisId);
            if (existing && existing.platform === 'instagram') {
                // Merge both platforms data into single creator entry
                creatorMap.set(creator.analysisId, {
                    ...creator,
                    instagramData: existing.instagramData
                });
            } else {
                creatorMap.set(creator.analysisId, creator);
            }
        });
        
        return Array.from(creatorMap.values());
    }, [analyses, instagramAnalyses]);

    const allLoadingAnalyses = [...loadingAnalyses, ...loadingInstagramAnalyses];

    const handleCreatorClick = (creator: UnifiedCreator) => {
        if (creator.platform === 'youtube' && creator.data?.status === 'completed') {
            navigate(`/creators/youtube/${creator.analysisId}`);
        } else if (creator.platform === 'instagram' && creator.instagramData?.status === 'completed') {
            navigate(`/creators/instagram/${creator.analysisId}`);
        }
    };

    const handleChannelClick = (analysis: AnalysisData) => {
        if (analysis.data.status === 'completed') {
            navigate(`/creators/youtube/${analysis.analysisId}`);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Creator Hubs</h1>
                <p className="text-gray-600">Organize your creators into groups for better management.</p>
            </div>

            <CreatorsView
                currentView="home"
                creatorsToShow={getCreatorsForView('home', analyses)}
                unifiedCreators={unifiedCreators}
                loadingAnalyses={new Set(allLoadingAnalyses)}
                hubs={hubs}
                onChannelClick={handleChannelClick}
                onCreatorClick={handleCreatorClick}
                onChannelRightClick={onChannelRightClick}
                onTrackChannel={() => {/* Handled by Header */}}
                onHubsChange={onHubsChange}
                totalAnalyses={youtubeTotalCount + instagramTotalCount}
                hasMore={youtubeHasMore || instagramHasMore}
                isLoadingMore={youtubeIsLoadingMore || instagramIsLoadingMore}
                onLoadMore={() => {
                    if (youtubeHasMore && !youtubeIsLoadingMore) {
                        loadMoreYoutube();
                    }
                    if (instagramHasMore && !instagramIsLoadingMore) {
                        loadMoreInstagram();
                    }
                }}
            />
        </div>
    );
}