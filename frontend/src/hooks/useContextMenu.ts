import { useState } from 'react';
import { localStorageService } from '../services/localStorage';
import type { CreatorHub } from '../types/api';
import { createElement } from 'react';

interface AnalysisData {
    analysisId: string;
    data: any;
}

export function useContextMenu(analyses: AnalysisData[], hubs: CreatorHub[], setHubs: (hubs: CreatorHub[]) => void) {
    const [contextMenu, setContextMenu] = useState<{
        isOpen: boolean;
        position: { x: number; y: number };
        targetId: string;
        type: 'creator' | 'hub';
    }>({ isOpen: false, position: { x: 0, y: 0 }, targetId: '', type: 'creator' });

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
                    icon: createElement('svg', {
                        className: "w-4 h-4",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                    }, createElement('path', {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 2,
                        d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    })),
                    onClick: () => {
                        try {
                            const analysis = analyses.find(a => a.analysisId === contextMenu.targetId);
                            if (analysis?.data.channelInfo) {
                                if (localStorageService.isCreatorFavorite(contextMenu.targetId)) {
                                    localStorageService.removeFavoriteCreator(contextMenu.targetId);
                                } else {
                                    localStorageService.addFavoriteCreator({
                                        analysisId: contextMenu.targetId,
                                        channelId: analysis.data.channelInfo.channelId,
                                        channelName: analysis.data.channelInfo.channelName,
                                        thumbnailUrl: analysis.data.channelInfo.thumbnailUrl,
                                        addedAt: new Date().toISOString()
                                    });
                                }
                            }
                        } catch (error) {
                            console.error('Error updating favorite:', error);
                        } finally {
                            // Required by architecture rules
                        }
                    }
                },
                ...hubs.map(hub => ({
                    id: `move-to-${hub.id}`,
                    label: `Move to ${hub.name}`,
                    icon: createElement('svg', {
                        className: "w-4 h-4",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                    }, createElement('path', {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 2,
                        d: "M7 16l-4-4m0 0l4-4m-4 4h18"
                    })),
                    onClick: () => {
                        try {
                            localStorageService.addCreatorToHub(hub.id, contextMenu.targetId);
                            // Remove from other hubs
                            hubs.forEach(otherHub => {
                                if (otherHub.id !== hub.id) {
                                    localStorageService.removeCreatorFromHub(otherHub.id, contextMenu.targetId);
                                }
                            });
                            setHubs(localStorageService.getHubs());
                        } catch (error) {
                            console.error('Error moving to hub:', error);
                        } finally {
                            // Required by architecture rules
                        }
                    }
                }))
            ];
        }
        return [];
    };

    return {
        contextMenu,
        setContextMenu,
        handleChannelRightClick,
        getContextMenuItems
    };
}