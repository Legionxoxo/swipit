import { useState } from 'react';
import { apiService } from '../services';
import { userService } from '../services/userService';
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

    const [isLoading, setIsLoading] = useState<boolean>(false);

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
                    label: 'Toggle Favorite', // Will need to check async
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
                    onClick: async () => {
                        try {
                            setIsLoading(true);
                            const analysis = analyses.find(a => a.analysisId === contextMenu.targetId);
                            if (analysis?.data.channelInfo) {
                                const userId = userService.getUserId();
                                const interactions = await apiService.getUserCreatorInteractions(userId);
                                const interaction = interactions.find(i => i.creator_id === contextMenu.targetId);
                                const isFavorite = interaction?.is_favorite || false;

                                await apiService.updateCreatorInteraction(userId, contextMenu.targetId, {
                                    isFavorite: !isFavorite,
                                    channelName: analysis.data.channelInfo.channelName,
                                    channelId: analysis.data.channelInfo.channelId,
                                    thumbnailUrl: analysis.data.channelInfo.thumbnailUrl,
                                    platform: 'youtube'
                                });
                            }
                        } catch (error) {
                            console.error('Error updating favorite:', error);
                        } finally {
                            setIsLoading(false);
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
                    onClick: async () => {
                        try {
                            setIsLoading(true);
                            const analysis = analyses.find(a => a.analysisId === contextMenu.targetId);
                            if (analysis?.data.channelInfo) {
                                const userId = userService.getUserId();
                                
                                await apiService.updateCreatorInteraction(userId, contextMenu.targetId, {
                                    hubId: hub.id,
                                    channelName: analysis.data.channelInfo.channelName,
                                    channelId: analysis.data.channelInfo.channelId,
                                    thumbnailUrl: analysis.data.channelInfo.thumbnailUrl,
                                    platform: 'youtube'
                                });

                                // Update hubs data
                                const updatedHubs = await apiService.getUserHubs(userId);
                                setHubs(updatedHubs);
                                setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, targetId: '', type: 'creator' });
                            }
                        } catch (error) {
                            console.error('Error moving to hub:', error);
                        } finally {
                            setIsLoading(false);
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
        getContextMenuItems,
        isLoading
    };
}