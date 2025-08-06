import { useState } from 'react';
import type { CreatorHub } from '../../types/api';
import { apiService } from '../../services/api';
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
    const [expandedHubs, setExpandedHubs] = useState<Set<string>>(new Set());
    const [isCreatingHub, setIsCreatingHub] = useState(false);
    const [newHubName, setNewHubName] = useState('');
    const [error, setError] = useState<string>('');

    const toggleHubExpansion = (hubId: string) => {
        const newExpanded = new Set(expandedHubs);
        if (newExpanded.has(hubId)) {
            newExpanded.delete(hubId);
        } else {
            newExpanded.add(hubId);
        }
        setExpandedHubs(newExpanded);
    };

    const handleCreateHub = async () => {
        try {
            setError('');
            if (newHubName.trim()) {
                const userId = userService.getUserId();
                const newHub = await apiService.createHub(userId, newHubName.trim());
                const updatedHubs = await apiService.getUserHubs(userId);
                
                onHubsChange(updatedHubs);
                setNewHubName('');
                setIsCreatingHub(false);
                setExpandedHubs(prev => new Set([...prev, newHub.id]));
            }
        } catch (error) {
            console.error('Error creating hub:', error);
            setError('Failed to create hub');
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
                        <NavItem
                            key={hub.id}
                            icon={<div className="w-2 h-2 rounded-full bg-blue-400"></div>}
                            label={hub.name}
                            isActive={currentView === `hub-${hub.id}`}
                            onClick={() => onViewChange(`hub-${hub.id}`)}
                            hasDropdown={hub.creatorIds.length > 0}
                            isExpanded={expandedHubs.has(hub.id)}
                            onToggle={() => toggleHubExpansion(hub.id)}
                            isCollapsed={isCollapsed}
                        >
                            <div className="ml-6 space-y-1">
                                {hub.creatorIds.map(creatorId => (
                                    <div
                                        key={creatorId}
                                        className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                                    >
                                        Creator {creatorId.slice(0, 8)}...
                                    </div>
                                ))}
                            </div>
                        </NavItem>
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