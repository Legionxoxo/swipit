import { useState } from 'react';
import type { CreatorHub } from '../../types/api';
import { apiService } from '../../services';
import { userService } from '../../services/userService';
import NavItem from './NavItem';

interface HubSectionProps {
    hubs: CreatorHub[];
    onHubsChange: (hubs: CreatorHub[]) => void;
    currentView: string;
    onViewChange: (view: string) => void;
    isExpanded: boolean;
    onToggle: () => void;
    isCollapsed: boolean;
}

export default function HubSection({
    hubs,
    onHubsChange,
    currentView,
    onViewChange,
    isExpanded,
    onToggle,
    isCollapsed
}: HubSectionProps) {
    const [isCreatingHub, setIsCreatingHub] = useState(false);
    const [newHubName, setNewHubName] = useState('');
    const [error, setError] = useState<string>('');


    const handleCreateHub = async () => {
        try {
            setError('');
            if (newHubName.trim()) {
                const userId = userService.getUserId();
                await apiService.createHub(userId, newHubName.trim());
                const updatedHubs = await apiService.getUserHubs(userId);
                
                onHubsChange(updatedHubs);
                setNewHubName('');
                setIsCreatingHub(false);
            }
        } catch (error) {
            console.error('Error creating hub:', error);
            setError('Failed to create hub');
        } finally {
            // Required by architecture rules
        }
    };

    const handleDeleteHub = async (e: React.MouseEvent, hubId: string) => {
        try {
            e.preventDefault();
            e.stopPropagation();
            
            if (confirm('Are you sure you want to delete this hub? All creators will be moved back to the home view.')) {
                const userId = userService.getUserId();
                console.debug('DEBUG: Deleting hub', hubId);
                await apiService.deleteHub(userId, hubId);
                console.debug('DEBUG: Hub deleted, fetching updated hubs');
                const updatedHubs = await apiService.getUserHubs(userId);
                console.debug('DEBUG: Updated hubs:', updatedHubs.map(h => ({id: h.id, name: h.name, creatorCount: h.creatorIds?.length || 0})));
                
                onHubsChange(updatedHubs);
                
                // If we're currently viewing the deleted hub, redirect to home
                if (currentView === `hub-${hubId}`) {
                    console.debug('DEBUG: Redirecting to home from deleted hub');
                    onViewChange('home');
                }
            }
        } catch (error) {
            console.error('Error deleting hub:', error);
            setError('Failed to delete hub');
        } finally {
            // Required by architecture rules
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleCreateHub();
        } else if (e.key === 'Escape') {
            setIsCreatingHub(false);
            setNewHubName('');
            setError('');
        }
    };

    return (
        <>
            {error && (
                <div className="mx-3 mb-2 bg-red-500 text-white text-xs p-2 rounded">
                    {error}
                </div>
            )}
            <NavItem
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>}
                label="Creator Hub"
                onClick={() => onViewChange('home')}
                hasDropdown={true}
                isExpanded={isExpanded}
                onToggle={onToggle}
                isCollapsed={isCollapsed}
            >
                <div className="ml-6 space-y-1">
                    {hubs.map(hub => (
                        <div key={hub.id} className="flex items-center">
                            <div className="flex-1">
                                <NavItem
                                    icon={<div className="w-2 h-2 rounded-full bg-blue-400"></div>}
                                    label={`${hub.name} (${hub.creatorIds.length})`}
                                    isActive={currentView === `hub-${hub.id}`}
                                    onClick={() => onViewChange(`hub-${hub.id}`)}
                                    isCollapsed={isCollapsed}
                                />
                            </div>
                            {!isCollapsed && (
                                <button
                                    onClick={(e) => handleDeleteHub(e, hub.id)}
                                    className="p-1 hover:bg-red-100 rounded transition-colors ml-1"
                                    title={`Delete ${hub.name}`}
                                >
                                    <svg className="w-3 h-3 text-gray-400 hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}
                    
                    {/* Add New Hub */}
                    {!isCollapsed && (
                        isCreatingHub ? (
                            <div className="px-3 py-2">
                                <input
                                    type="text"
                                    value={newHubName}
                                    onChange={(e) => setNewHubName(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    onBlur={handleCreateHub}
                                    placeholder="Hub name..."
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsCreatingHub(true)}
                                className="flex items-center w-full px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="ml-2">Add Hub</span>
                            </button>
                        )
                    )}
                </div>
            </NavItem>
        </>
    );
}