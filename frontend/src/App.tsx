
import { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChannelCard from './components/ChannelCard';
import VideoCard from './components/VideoCard';
import VideosList from './components/VideosList';
import ErrorBoundary from './components/ErrorBoundary';
import EmptyState from './components/EmptyState';
import TrackChannelModal from './components/TrackChannelModal';
import ContextMenu from './components/ContextMenu';
import type { AnalysisResponse, CreatorHub } from './types/api';
import { apiService } from './services/api';
import { localStorageService } from './services/localStorage';

interface AnalysisData {
    analysisId: string;
    data: AnalysisResponse;
}

function App() {
    const [analyses, setAnalyses] = useState<AnalysisData[]>([]);
    const [currentView, setCurrentView] = useState<string>('home');
    const [previousView, setPreviousView] = useState<string>('home');
    const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisData | null>(null);
    const [loadingAnalyses, setLoadingAnalyses] = useState<Set<string>>(new Set());
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
    const [hubs, setHubs] = useState<CreatorHub[]>([]);
    
    // Context menu state
    const [contextMenu, setContextMenu] = useState<{
        isOpen: boolean;
        position: { x: number; y: number };
        targetId: string;
        type: 'creator' | 'hub';
    }>({ isOpen: false, position: { x: 0, y: 0 }, targetId: '', type: 'creator' });

    // Load hubs from localStorage on mount
    useEffect(() => {
        try {
            const savedHubs = localStorageService.getHubs();
            setHubs(savedHubs);
        } catch (error) {
            console.error('Error loading hubs from localStorage:', error);
        } finally {
            // Required by architecture rules
        }
    }, []);

    const handleAnalysisStarted = async (analysisId: string) => {
        try {
            setLoadingAnalyses(prev => new Set([...prev, analysisId]));

            const checkStatus = async () => {
                try {
                    const response = await apiService.getAnalysisStatus(analysisId);

                    if (response.status === 'completed') {
                        setAnalyses(prev => {
                            const existing = prev.find(a => a.analysisId === analysisId);
                            if (existing) {
                                return prev.map(a =>
                                    a.analysisId === analysisId
                                        ? { ...a, data: response }
                                        : a
                                );
                            } else {
                                return [...prev, { analysisId, data: response }];
                            }
                        });
                        setLoadingAnalyses(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(analysisId);
                            return newSet;
                        });
                    } else if (response.status === 'error') {
                        alert(`Analysis failed: ${response.error || 'Unknown error'}`);
                        setLoadingAnalyses(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(analysisId);
                            return newSet;
                        });
                    } else {
                        setAnalyses(prev => {
                            const existing = prev.find(a => a.analysisId === analysisId);
                            if (existing) {
                                return prev.map(a =>
                                    a.analysisId === analysisId
                                        ? { ...a, data: response }
                                        : a
                                );
                            } else {
                                return [...prev, { analysisId, data: response }];
                            }
                        });
                        setTimeout(checkStatus, 3000);
                    }
                } catch (error) {
                    console.error('Error checking analysis status:', error);
                    setTimeout(checkStatus, 5000);
                }
            };

            checkStatus();
        } catch (error) {
            console.error('Error starting analysis tracking:', error);
            setLoadingAnalyses(prev => {
                const newSet = new Set(prev);
                newSet.delete(analysisId);
                return newSet;
            });
        }
    };

    const handleChannelClick = (analysis: AnalysisData) => {
        if (analysis.data.status === 'completed') {
            setPreviousView(currentView); // Store the current view before switching
            setSelectedAnalysis(analysis);
            setCurrentView('videos');
        }
    };

    const handleBackToChannels = () => {
        setCurrentView(previousView); // Return to the previous view
        setSelectedAnalysis(null);
    };

    const handleTrackChannelClick = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleViewChange = (view: string) => {
        // Only update previousView if we're not going to the videos view (which is handled by handleChannelClick)
        if (view !== 'videos') {
            setPreviousView(currentView);
        }
        setCurrentView(view);
        // If switching to videos view, clear selected analysis
        if (!view.startsWith('hub-') && view !== 'home' && view !== 'favorite-creators' && view !== 'favorite-videos' && view !== 'starred-videos') {
            setSelectedAnalysis(null);
        }
    };

    const handleChannelRightClick = (e: React.MouseEvent, analysisId: string) => {
        e.preventDefault();
        setContextMenu({
            isOpen: true,
            position: { x: e.clientX, y: e.clientY },
            targetId: analysisId,
            type: 'creator'
        });
    };

    const getContextMenuItems = () => {
        if (contextMenu.type === 'creator') {
            return [
                {
                    id: 'favorite',
                    label: localStorageService.isCreatorFavorite(contextMenu.targetId) ? 'Remove from Favorites' : 'Add to Favorites',
                    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>,
                    onClick: () => {
                        const analysis = analyses.find(a => a.analysisId === contextMenu.targetId);
                        if (analysis?.data.channelInfo) {
                            if (localStorageService.isCreatorFavorite(contextMenu.targetId)) {
                                localStorageService.removeFavoriteCreator(contextMenu.targetId);
                            } else {
                                localStorageService.addFavoriteCreator({
                                    analysisId: contextMenu.targetId,
                                    channelId: analysis.data.channelInfo.channelId,
                                    channelName: analysis.data.channelInfo.channelName,
                                    thumbnailUrl: analysis.data.channelInfo.thumbnailUrl
                                });
                            }
                        }
                    }
                },
                ...hubs.map(hub => ({
                    id: `move-to-${hub.id}`,
                    label: `Move to ${hub.name}`,
                    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>,
                    onClick: () => {
                        localStorageService.addCreatorToHub(hub.id, contextMenu.targetId);
                        // Remove from other hubs
                        hubs.forEach(otherHub => {
                            if (otherHub.id !== hub.id) {
                                localStorageService.removeCreatorFromHub(otherHub.id, contextMenu.targetId);
                            }
                        });
                        setHubs(localStorageService.getHubs());
                    }
                }))
            ];
        }
        return [];
    };

    const getUnorganizedCreators = () => {
        const allCreatorIds = analyses.map(a => a.analysisId);
        return localStorageService.getUnorganizedCreators(allCreatorIds);
    };

    const getCreatorsForView = () => {
        if (currentView === 'home') {
            const unorganizedIds = getUnorganizedCreators();
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
    };

    // Handle video view
    if (selectedAnalysis) {
        return (
            <VideosList
                channelInfo={selectedAnalysis.data.channelInfo}
                videos={selectedAnalysis.data.videoData}
                videoSegments={selectedAnalysis.data.videoSegments}
                analysisId={selectedAnalysis.analysisId}
                onBack={handleBackToChannels}
            />
        );
    }

    const renderContent = () => {
        const creatorsToShow = getCreatorsForView();
        
        if (currentView === 'favorite-videos') {
            const favoriteVideos = localStorageService.getFavoriteVideos();
            return (
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Favorite Videos</h2>
                    {favoriteVideos.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-600">No favorite videos yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {favoriteVideos.map(video => {
                                // Convert FavoriteVideo to VideoData format
                                const videoData = {
                                    videoId: video.videoId,
                                    title: video.title,
                                    description: '',
                                    thumbnailUrl: video.thumbnailUrl,
                                    videoUrl: video.videoUrl,
                                    uploadDate: video.addedAt,
                                    duration: 'PT0S', // Default duration
                                    viewCount: 0, // Default view count
                                    likeCount: 0,
                                    commentCount: 0,
                                    categoryId: '28'
                                };
                                return (
                                    <VideoCard 
                                        key={video.videoId} 
                                        video={videoData} 
                                        channelName={video.channelName} 
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        if (currentView === 'starred-videos') {
            const starredVideos = localStorageService.getStarredVideos();
            
            // Group videos by star rating (5 to 1)
            const videosByRating = {
                5: starredVideos.filter(video => video.rating === 5),
                4: starredVideos.filter(video => video.rating === 4),
                3: starredVideos.filter(video => video.rating === 3),
                2: starredVideos.filter(video => video.rating === 2),
                1: starredVideos.filter(video => video.rating === 1)
            };

            const getStarIcon = (filled: boolean = true) => (
                <svg 
                    className={`w-5 h-5 inline ${filled ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    fill={filled ? 'currentColor' : 'none'}
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
            );

            const renderStarRating = (rating: number) => (
                <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => getStarIcon(star <= rating))}
                </div>
            );

            return (
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Starred Videos</h2>
                    {starredVideos.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-600">No starred videos yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {[5, 4, 3, 2, 1].map(rating => {
                                const videosInCategory = videosByRating[rating as keyof typeof videosByRating];
                                
                                if (videosInCategory.length === 0) return null;
                                
                                return (
                                    <div key={rating}>
                                        <div className="flex items-center space-x-3 mb-6">
                                            <h3 className="text-xl font-semibold text-gray-800">
                                                {rating} Star Videos
                                            </h3>
                                            {renderStarRating(rating)}
                                            <span className="text-sm text-gray-500">
                                                ({videosInCategory.length} video{videosInCategory.length !== 1 ? 's' : ''})
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {videosInCategory.map(video => {
                                                // Convert StarredVideo to VideoData format
                                                const videoData = {
                                                    videoId: video.videoId,
                                                    title: video.title,
                                                    description: video.note || '',
                                                    thumbnailUrl: video.thumbnailUrl,
                                                    videoUrl: video.videoUrl,
                                                    uploadDate: video.starredAt,
                                                    duration: 'PT0S', // Default duration
                                                    viewCount: 0, // Default view count
                                                    likeCount: 0,
                                                    commentCount: 0,
                                                    categoryId: '28'
                                                };
                                                return (
                                                    <VideoCard 
                                                        key={video.videoId} 
                                                        video={videoData} 
                                                        channelName={video.channelName} 
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        // Default creator view (Home, Hubs, Favorite Creators)
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
                            {creatorsToShow.length} creator{creatorsToShow.length !== 1 ? 's' : ''}
                            {loadingAnalyses.size > 0 && ` • ${loadingAnalyses.size} analysis in progress`}
                        </p>
                    </div>
                </div>

                {creatorsToShow.length === 0 ? (
                    <div className="text-center py-12">
                        {currentView === 'home' && analyses.length === 0 ? (
                            <EmptyState onTrackChannel={handleTrackChannelClick} />
                        ) : (
                            <p className="text-gray-600">No creators in this section.</p>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {creatorsToShow.map(analysis => (
                            <ErrorBoundary key={analysis.analysisId}>
                                <div onContextMenu={(e) => handleChannelRightClick(e, analysis.analysisId)}>
                                    {analysis.data && analysis.data.channelInfo ? (
                                        <ChannelCard
                                            channelInfo={analysis.data.channelInfo}
                                            totalVideos={analysis.data.totalVideos || 0}
                                            progress={analysis.data.progress || 0}
                                            isLoading={loadingAnalyses.has(analysis.analysisId) || analysis.data.status === 'processing'}
                                            onClick={() => handleChannelClick(analysis)}
                                            analysisId={analysis.analysisId}
                                            hubs={hubs}
                                            onHubsChange={setHubs}
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
                )}
            </div>
        );
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
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
            <div className="flex-1 flex flex-col">
                <Header onTrackChannelClick={handleTrackChannelClick} />
                
                <main className="flex-1 p-8">
                    {renderContent()}
                </main>
            </div>

            {/* Modals and Context Menus */}
            <TrackChannelModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onAnalysisStarted={handleAnalysisStarted}
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
