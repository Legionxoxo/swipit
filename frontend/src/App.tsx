import { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import VideosList from './components/VideosList';
import InstagramReelsList from './components/InstagramReelsList';
import TrackChannelModal from './components/TrackChannelModal';
import ContextMenu from './components/common/ContextMenu';
import CreatorsView from './components/views/CreatorsView';
import FavoriteVideosView from './components/views/FavoriteVideosView';
import StarredVideosView from './components/views/StarredVideosView';
import type { AnalysisResponse, CreatorHub, InstagramAnalysisData, UnifiedCreator } from './types/api';
import { apiService } from './services';
import { userService } from './services/userService';
import { useAnalysisTracking } from './hooks/useAnalysisTracking';
import { useInstagramAnalysisTracking } from './hooks/useInstagramAnalysisTracking';
import { useContextMenu } from './hooks/useContextMenu';
import { getCreatorsForView } from './utils/creatorFilters';

interface AnalysisData {
    analysisId: string;
    data: AnalysisResponse;
}


function App() {
    const [currentView, setCurrentView] = useState<string>('home');
    const [previousView, setPreviousView] = useState<string>('home');
    const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisData | null>(null);
    const [selectedInstagramAnalysis, setSelectedInstagramAnalysis] = useState<InstagramAnalysisData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
    const [hubs, setHubs] = useState<CreatorHub[]>([]);

    const { 
        analyses, 
        loadingAnalyses, 
        handleAnalysisStarted,
        totalCount: youtubeTotalCount,
        hasMore: youtubeHasMore,
        isLoadingMore: youtubeIsLoadingMore,
        loadMore: loadMoreYoutube
    } = useAnalysisTracking();
    
    const { 
        instagramAnalyses, 
        loadingInstagramAnalyses, 
        handleInstagramAnalysisStarted, 
        handleInstagramPostTracked,
        totalCount: instagramTotalCount,
        hasMore: instagramHasMore,
        isLoadingMore: instagramIsLoadingMore,
        loadMoreAnalyses: loadMoreInstagram
    } = useInstagramAnalysisTracking();
    
    // Create unified creator list
    const unifiedCreators: UnifiedCreator[] = [
        ...analyses.map(analysis => ({
            analysisId: analysis.analysisId,
            platform: 'youtube' as const,
            data: analysis.data
        })),
        ...instagramAnalyses.map(analysis => ({
            analysisId: analysis.analysisId,
            platform: 'instagram' as const,
            instagramData: analysis
        }))
    ];

    const allLoadingAnalyses = [...loadingAnalyses, ...loadingInstagramAnalyses];
    
    const [refreshViewCallback, setRefreshViewCallback] = useState<() => void>();
    const { contextMenu, setContextMenu, handleChannelRightClick, getContextMenuItems } = useContextMenu(analyses, hubs, setHubs, refreshViewCallback);

    // Load hubs from database on mount
    useEffect(() => {
        loadHubs();
    }, []);

    const loadHubs = async () => {
        try {
            const userId = userService.getUserId();
            const savedHubs = await apiService.getUserHubs(userId);
            setHubs(savedHubs);
        } catch (error) {
            // Error loading hubs - handled silently
            console.error('Error loading hubs:', error);
        } finally {
            // Required by architecture rules
        }
    };

    const handleCreatorClick = (creator: UnifiedCreator) => {
        if (creator.platform === 'youtube' && creator.data?.status === 'completed') {
            setPreviousView(currentView);
            setSelectedAnalysis({
                analysisId: creator.analysisId,
                data: creator.data
            });
            setCurrentView('videos');
        } else if (creator.platform === 'instagram' && creator.instagramData?.status === 'completed') {
            setPreviousView(currentView);
            setSelectedInstagramAnalysis(creator.instagramData);
            setCurrentView('reels');
        }
    };

    const handleBackToChannels = () => {
        setCurrentView(previousView);
        setSelectedAnalysis(null);
        setSelectedInstagramAnalysis(null);
    };

    const handleTrackChannelClick = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleUnifiedAnalysisStarted = (analysisId: string, platform: 'youtube' | 'instagram') => {
        if (platform === 'youtube') {
            handleAnalysisStarted(analysisId);
        } else {
            handleInstagramAnalysisStarted(analysisId);
        }
    };

    const handleViewChange = (view: string) => {
        if (view !== 'videos' && view !== 'reels') {
            setPreviousView(currentView);
        }
        setCurrentView(view);
        // Always clear selected analyses when switching to any view except videos/reels
        // This allows navigation from creator detail views back to any other section
        if (view !== 'videos' && view !== 'reels') {
            setSelectedAnalysis(null);
            setSelectedInstagramAnalysis(null);
        }
    };

    const renderContent = () => {
        // Handle video view (YouTube)
        if (selectedAnalysis) {
            // Check if we have the required data
            if (!selectedAnalysis.data?.channelInfo) {
                return (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Channel Data...</h2>
                            <p className="text-gray-600">Please wait while we load the channel information.</p>
                            <button 
                                onClick={handleBackToChannels}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Back to Creators
                            </button>
                        </div>
                    </div>
                );
            }
            
            const defaultVideoSegments = {
                viral: [],
                veryHigh: [],
                high: [],
                medium: [],
                low: []
            };
            
            return (
                <VideosList
                    channelInfo={selectedAnalysis.data.channelInfo}
                    videos={selectedAnalysis.data.videoData || []}
                    videoSegments={selectedAnalysis.data.videoSegments || defaultVideoSegments}
                    analysisId={selectedAnalysis.analysisId}
                    onBack={handleBackToChannels}
                />
            );
        }

        // Handle reels view (Instagram)
        if (selectedInstagramAnalysis) {
            return (
                <InstagramReelsList
                    profileInfo={selectedInstagramAnalysis.profile!}
                    reels={selectedInstagramAnalysis.reels || []}
                    reelSegments={selectedInstagramAnalysis.reelSegments || null}
                    analysisId={selectedInstagramAnalysis.analysisId}
                    onBack={handleBackToChannels}
                />
            );
        }

        if (currentView === 'favorite-videos') {
            return <FavoriteVideosView />;
        }

        if (currentView === 'starred-videos') {
            return <StarredVideosView />;
        }

        // Default creator view (Home, Hubs, Favorite Creators)
        return (
            <CreatorsView
                currentView={currentView}
                creatorsToShow={getCreatorsForView(currentView, analyses)}
                unifiedCreators={unifiedCreators}
                loadingAnalyses={new Set(allLoadingAnalyses)}
                hubs={hubs}
                onChannelClick={(analysis: AnalysisData) => {
                    if (analysis.data.status === 'completed') {
                        setPreviousView(currentView);
                        setSelectedAnalysis(analysis);
                        setCurrentView('videos');
                    }
                }}
                onCreatorClick={handleCreatorClick}
                onChannelRightClick={handleChannelRightClick}
                onTrackChannel={handleTrackChannelClick}
                onHubsChange={setHubs}
                onHubsRefresh={loadHubs}
                onRegisterRefreshCallback={setRefreshViewCallback}
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
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                currentView={currentView}
                onViewChange={handleViewChange}
                hubs={hubs}
                onHubsChange={setHubs}
            />

            {/* Main Content */}
            <div className={`flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
                <Header 
                    onTrackChannelClick={handleTrackChannelClick}
                />
                
                <main className="flex-1 p-8">
                    {renderContent()}
                </main>
            </div>

            {/* Modals and Context Menus */}
            <TrackChannelModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onAnalysisStarted={handleUnifiedAnalysisStarted}
                onInstagramPostTracked={handleInstagramPostTracked}
            />

            <ContextMenu
                isOpen={contextMenu.isOpen}
                onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
                position={contextMenu.position}
                items={getContextMenuItems()}
            />
        </div>
    );
}

export default App;