import { useEffect } from 'react';
import ChannelCard from '../channel/ChannelCard';
import UnifiedCreatorCard from '../channel/UnifiedCreatorCard';
import ErrorBoundary from '../common/ErrorBoundary';
import EmptyState from '../common/EmptyState';
import type { AnalysisData, CreatorHub, UnifiedCreator } from '../../types/api';
import { useInfiniteScrollObserver } from '../../hooks/useInfiniteScrollObserver';
import { useCreatorFiltering } from '../../hooks/useCreatorFiltering';

interface CreatorsViewProps {
    currentView: string;
    creatorsToShow: AnalysisData[];
    unifiedCreators?: UnifiedCreator[];
    loadingAnalyses: Set<string>;
    hubs: CreatorHub[];
    onChannelClick: (analysis: AnalysisData) => void;
    onCreatorClick?: (creator: UnifiedCreator) => void;
    onChannelRightClick: (e: React.MouseEvent, analysisId: string) => void;
    onTrackChannel: () => void;
    onHubsChange: (hubs: CreatorHub[]) => void;
    onHubsRefresh?: () => Promise<void>;
    onRegisterRefreshCallback?: (callback: () => void) => void;
    totalAnalyses: number;
    hasMore?: boolean;
    isLoadingMore?: boolean;
    onLoadMore?: () => void;
}

export default function CreatorsView({
    currentView,
    creatorsToShow,
    unifiedCreators = [],
    loadingAnalyses,
    hubs,
    onChannelClick,
    onCreatorClick,
    onChannelRightClick,
    onTrackChannel,
    onHubsChange,
    onHubsRefresh,
    onRegisterRefreshCallback,
    totalAnalyses,
    hasMore = false,
    isLoadingMore = false,
    onLoadMore
}: CreatorsViewProps) {
    // Use custom hooks to manage filtering and infinite scroll
    const { filteredUnifiedCreators, isFiltering, forceRefresh } = useCreatorFiltering({
        currentView,
        unifiedCreators,
        hubs
    });
    
    // Register refresh callback with parent (stable forceRefresh function)
    useEffect(() => {
        if (onRegisterRefreshCallback) {
            onRegisterRefreshCallback(forceRefresh);
        }
    }, [forceRefresh, onRegisterRefreshCallback]); // Now forceRefresh is stable
    
    // Debug logging to help identify data flow issues
    console.debug('CreatorsView render:', {
        currentView,
        unifiedCreatorsCount: unifiedCreators.length,
        filteredUnifiedCreatorsCount: filteredUnifiedCreators.length,
        isFiltering,
        hubsCount: hubs.length
    });
    
    const { loadMoreRef } = useInfiniteScrollObserver({
        hasMore,
        isLoading: isLoadingMore,
        onLoadMore
    });

    const getViewTitle = () => {
        if (currentView === 'home') return 'Home - Unorganized Creators';
        if (currentView === 'favorite-creators') return 'Favorite Creators';
        if (currentView.startsWith('hub-')) {
            const hubId = currentView.replace('hub-', '');
            const hub = hubs.find(h => h.id === hubId);
            return hub ? `${hub.name} Hub` : 'Creator Hub';
        }
        return 'Creators';
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {getViewTitle()}
                    </h2>
                    <p className="text-gray-600 mt-1">
                        {currentView === 'home' || currentView === 'favorite-creators' || currentView.startsWith('hub-') ? (
                            <>
                                {isFiltering ? 'Loading...' : (
                                    totalAnalyses > 0 ? 
                                    `${totalAnalyses} total creator${totalAnalyses !== 1 ? 's' : ''}` :
                                    `${filteredUnifiedCreators.length} creator${filteredUnifiedCreators.length !== 1 ? 's' : ''}`
                                )}
                                {loadingAnalyses.size > 0 && ` • ${loadingAnalyses.size} analysis in progress`}
                            </>
                        ) : (
                            <>
                                {creatorsToShow.length} creator{creatorsToShow.length !== 1 ? 's' : ''}
                                {loadingAnalyses.size > 0 && ` • ${loadingAnalyses.size} analysis in progress`}
                            </>
                        )}
                    </p>
                </div>
            </div>

            {currentView === 'home' || currentView === 'favorite-creators' || currentView.startsWith('hub-') ? (
                // Show unified creators for home view and favorite-creators view
                <>
                    {filteredUnifiedCreators.length === 0 ? (
                        <div className="text-center py-12">
                            {currentView === 'home' && totalAnalyses === 0 ? (
                                <EmptyState onTrackChannel={onTrackChannel} />
                            ) : isFiltering ? (
                                <div className="flex justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <p className="text-gray-600">
                                    {currentView === 'favorite-creators' ? 'No favorite creators yet.' : 
                                     currentView.startsWith('hub-') ? 'No creators in this hub yet.' :
                                     'No unorganized creators. All creators have been assigned to hubs.'}
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4 overflow-visible">
                                {filteredUnifiedCreators.map(creator => (
                                    <ErrorBoundary key={creator.analysisId}>
                                        <UnifiedCreatorCard
                                            creator={creator}
                                            isLoading={loadingAnalyses.has(creator.analysisId)}
                                            onClick={onCreatorClick}
                                            onRightClick={onChannelRightClick}
                                            hubs={hubs}
                                            onHubAssign={async () => {
                                                // Refresh hub data from database
                                                if (onHubsRefresh) {
                                                    await onHubsRefresh();
                                                }
                                            }}
                                        />
                                    </ErrorBoundary>
                                ))}
                            </div>
                            
                        </>
                    )}
                    
                    {/* Infinite scroll trigger - moved outside the conditional to always show when hasMore is true */}
                    {hasMore && (
                        <div ref={loadMoreRef} className="flex justify-center py-8">
                            {isLoadingMore ? (
                                <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-gray-600">Loading more creators...</span>
                                </div>
                            ) : (
                                <div className="h-4" />
                            )}
                        </div>
                    )}
                </>
            ) : (
                // Show YouTube-only creators for other views  
                <>
                    {creatorsToShow.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-600">No creators in this section.</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4 overflow-visible">
                                {creatorsToShow.map(analysis => (
                                    <ErrorBoundary key={analysis.analysisId}>
                                        <div onContextMenu={(e) => onChannelRightClick(e, analysis.analysisId)}>
                                            {analysis.data && analysis.data.channelInfo ? (
                                                <ChannelCard
                                                    channelInfo={analysis.data.channelInfo}
                                                    totalVideos={analysis.data.totalVideos || 0}
                                                    progress={analysis.data.progress || 0}
                                                    isLoading={loadingAnalyses.has(analysis.analysisId) || analysis.data.status === 'processing'}
                                                    onClick={() => onChannelClick(analysis)}
                                                    analysisId={analysis.analysisId}
                                                    hubs={hubs}
                                                    onHubsChange={onHubsChange}
                                                />
                                            ) : (
                                                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                                                    <div className="animate-pulse">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                                                            <div className="flex-1">
                                                                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                                                                <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
                                                                <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4">
                                                            <div className="h-2 bg-gray-300 rounded w-full mb-2"></div>
                                                            <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </ErrorBoundary>
                                ))}
                            </div>
                            
                            {/* Infinite scroll trigger for non-unified views */}
                            {hasMore && (
                                <div ref={loadMoreRef} className="flex justify-center py-8">
                                    {isLoadingMore ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-gray-600">Loading more creators...</span>
                                        </div>
                                    ) : (
                                        <div className="h-4" />
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}