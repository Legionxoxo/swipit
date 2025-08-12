import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import TrackChannelModal from '../components/TrackChannelModal';
import ContextMenu from '../components/common/ContextMenu';
import type { CreatorHub } from '../types/api';
import { apiService } from '../services';
import { userService } from '../services/userService';
import { useContextMenu } from '../hooks/useContextMenu';
import { useAnalysisTracking } from '../hooks/useAnalysisTracking';
import { useInstagramAnalysisTracking } from '../hooks/useInstagramAnalysisTracking';

export function RootLayout() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
    const [hubs, setHubs] = useState<CreatorHub[]>([]);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const location = useLocation();

    const { 
        analyses, 
        handleAnalysisStarted,
    } = useAnalysisTracking();
    
    const { 
        handleInstagramAnalysisStarted, 
        handleInstagramPostTracked,
    } = useInstagramAnalysisTracking();
    
    const { contextMenu, setContextMenu, handleChannelRightClick, getContextMenuItems } = useContextMenu(analyses, hubs, setHubs);

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

    // Get current view from route for sidebar active state
    const getCurrentView = () => {
        const path = location.pathname;
        if (path === '/') return 'home';
        if (path.startsWith('/creators/')) return 'creator-detail';
        if (path === '/hubs') return 'hubs';
        if (path.startsWith('/hubs/')) return path.replace('/hubs/', 'hub-');
        if (path === '/favorites/creators') return 'favorite-creators';
        if (path === '/favorites/videos') return 'favorite-videos';
        if (path === '/favorites/starred') return 'starred-videos';
        return 'home';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                currentView={getCurrentView()}
                hubs={hubs}
                onHubsChange={setHubs}
            />

            {/* Main Content */}
            <div className={`flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
                <Header 
                    onTrackChannelClick={handleTrackChannelClick}
                />
                
                <main className="flex-1 p-8">
                    <Outlet context={{ 
                        hubs, 
                        onHubsChange: setHubs,
                        onChannelRightClick: handleChannelRightClick,
                        analyses
                    }} />
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