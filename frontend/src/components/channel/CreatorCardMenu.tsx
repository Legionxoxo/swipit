import { useState, useEffect, useRef } from 'react';
import { MoreVertical } from 'lucide-react';
import type { CreatorHub } from '../../types/api';
import { apiService } from '../../services';
import { userService } from '../../services/userService';

interface CreatorCardMenuProps {
    analysisId: string;
    hubs: CreatorHub[];
    creatorName: string;
    creatorId?: string;
    thumbnailUrl?: string;
    platform: 'youtube' | 'instagram';
    onHubAssign?: (analysisId: string, hubId: string) => void;
}

/**
 * Creator card dropdown menu component
 * Extracted from UnifiedCreatorCard to keep components under 250 lines
 */
export default function CreatorCardMenu({ 
    analysisId, 
    hubs,
    creatorName,
    creatorId,
    thumbnailUrl,
    platform,
    onHubAssign 
}: CreatorCardMenuProps) {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Click outside handler for menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showMenu && menuRef.current && !menuRef.current.contains(event.target as Node)) {
                // Only close if click is outside the dropdown area too
                const dropdownElement = document.querySelector('[data-dropdown-menu="true"]');
                if (!dropdownElement || !dropdownElement.contains(event.target as Node)) {
                    setShowMenu(false);
                }
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [showMenu]);

    const handleMenuClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Menu button clicked, toggling menu visibility
        setShowMenu(!showMenu);
    };

    const handleHubAssign = async (e: React.MouseEvent, hubId: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            const userId = userService.getUserId();
            
            // Perform the actual hub assignment via API
            await apiService.updateCreatorInteraction(userId, analysisId, {
                hubId,
                channelName: creatorName,
                channelId: creatorId,
                thumbnailUrl,
                platform
            });

            // Call the callback to refresh hub data or update UI
            onHubAssign?.(analysisId, hubId);
            setShowMenu(false);
        } catch (error) {
            console.error('Error assigning creator to hub:', error);
            // TODO: Add proper error handling UI
        } finally {
            // Required by architecture rules
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={handleMenuClick}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Creator options"
            >
                <MoreVertical className="w-4 h-4" />
            </button>
            
            {showMenu && (
                <div 
                    className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                    data-dropdown-menu="true"
                >
                    <div className="py-2">
                        <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b">
                            Add to Hub
                        </div>
                        
                        {hubs.length > 0 ? (
                            hubs.map(hub => (
                                <button
                                    key={hub.id}
                                    onClick={(e) => handleHubAssign(e, hub.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    {hub.name}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-2 text-sm text-gray-500">
                                No hubs available
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}