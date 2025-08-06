import { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import VideosList from './components/VideosList';
import TrackChannelModal from './components/TrackChannelModal';
import ContextMenu from './components/common/ContextMenu';
import CreatorsView from './components/views/CreatorsView';
import FavoriteVideosView from './components/views/FavoriteVideosView';
import StarredVideosView from './components/views/StarredVideosView';
import type { AnalysisResponse, CreatorHub } from './types/api';
import { localStorageService } from './services/localStorage';
import { useAnalysisTracking } from './hooks/useAnalysisTracking';
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
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
    const [hubs, setHubs] = useState<CreatorHub[]>([]);

    const { analyses, loadingAnalyses, handleAnalysisStarted } = useAnalysisTracking();
    const { contextMenu, setContextMenu, handleChannelRightClick, getContextMenuItems } = useContextMenu(analyses, hubs, setHubs);

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
                loadingAnalyses={loadingAnalyses}
                hubs={hubs}
                onChannelClick={handleChannelClick}
                onChannelRightClick={handleChannelRightClick}
                onTrackChannel={handleTrackChannelClick}
                onHubsChange={setHubs}
                totalAnalyses={analyses.length}
            />
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