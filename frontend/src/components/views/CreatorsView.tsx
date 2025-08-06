import ChannelCard from '../channel/ChannelCard';
import UnifiedCreatorCard from '../channel/UnifiedCreatorCard';
import ErrorBoundary from '../common/ErrorBoundary';
import EmptyState from '../common/EmptyState';
import type { AnalysisData, CreatorHub } from '../../types/api';

interface UnifiedCreator {
    analysisId: string;
    platform: 'youtube' | 'instagram';
    data?: any;
    instagramData?: any;
}

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
    totalAnalyses: number;
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
    totalAnalyses
}: CreatorsViewProps) {
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
                        {currentView === 'home' ? (
                            <>
                                {unifiedCreators.length} creator{unifiedCreators.length !== 1 ? 's' : ''}
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

            {currentView === 'home' ? (
                // Show unified creators for home view
                unifiedCreators.length === 0 ? (
                    <div className="text-center py-12">
                        {totalAnalyses === 0 ? (
                            <EmptyState onTrackChannel={onTrackChannel} />
                        ) : (
                            <p className="text-gray-600">No creators found.</p>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {unifiedCreators.map(creator => (
                            <ErrorBoundary key={creator.analysisId}>
                                <UnifiedCreatorCard
                                    creator={creator}
                                    isLoading={loadingAnalyses.has(creator.analysisId)}
                                    onClick={onCreatorClick}
                                    onRightClick={onChannelRightClick}
                                />
                            </ErrorBoundary>
                        ))}
                    </div>
                )
            ) : (
                // Show YouTube-only creators for other views  
                creatorsToShow.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">No creators in this section.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                )
            )}
        </div>
    );
}