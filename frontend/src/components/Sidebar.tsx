import { useState } from 'react';
import type { CreatorHub } from '../types/api';
import { localStorageService } from '../services/localStorage';

interface SidebarProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    currentView: string;
    onViewChange: (view: string) => void;
    hubs: CreatorHub[];
    onHubsChange: (hubs: CreatorHub[]) => void;
}

export default function Sidebar({ 
    isCollapsed, 
    onToggleCollapse, 
    currentView, 
    onViewChange,
    hubs,
    onHubsChange
}: SidebarProps) {
    const [expandedHubs, setExpandedHubs] = useState<Set<string>>(new Set());
    const [isCreatingHub, setIsCreatingHub] = useState(false);
    const [newHubName, setNewHubName] = useState('');
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['creator-hub', 'favorites']));

    const toggleHubExpansion = (hubId: string) => {
        const newExpanded = new Set(expandedHubs);
        if (newExpanded.has(hubId)) {
            newExpanded.delete(hubId);
        } else {
            newExpanded.add(hubId);
        }
        setExpandedHubs(newExpanded);
    };

    const toggleSectionExpansion = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    const handleCreateHub = () => {
        if (newHubName.trim()) {
            const newHub = localStorageService.createHub(newHubName.trim());
            const updatedHubs = localStorageService.getHubs();
            onHubsChange(updatedHubs);
            setNewHubName('');
            setIsCreatingHub(false);
            setExpandedHubs(prev => new Set([...prev, newHub.id]));
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleCreateHub();
        } else if (e.key === 'Escape') {
            setIsCreatingHub(false);
            setNewHubName('');
        }
    };

    const NavItem = ({ 
        icon, 
        label, 
        isActive, 
        onClick,
        hasDropdown = false,
        isExpanded = false,
        onToggle,
        children
    }: {
        icon: React.ReactNode;
        label: string;
        isActive?: boolean;
        onClick?: () => void;
        hasDropdown?: boolean;
        isExpanded?: boolean;
        onToggle?: () => void;
        children?: React.ReactNode;
    }) => {
        const handleClick = () => {
            if (isCollapsed && onClick) {
                // When collapsed, always use onClick if available (for navigation)
                onClick();
            } else if (!isCollapsed && hasDropdown && onToggle) {
                // When expanded and has dropdown, use toggle
                onToggle();
            } else if (onClick) {
                // Otherwise use onClick
                onClick();
            }
        };

        return (
            <div className="mb-1">
                <div
                    className={`flex items-center px-3 py-2 text-sm rounded-md cursor-pointer transition-colors ${
                        isActive
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                    } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
                    onClick={handleClick}
                >
                    <div className="flex items-center">
                        <span className="flex-shrink-0">{icon}</span>
                        {!isCollapsed && <span className="ml-3">{label}</span>}
                    </div>
                    {hasDropdown && !isCollapsed && (
                        <svg
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    )}
                </div>
                {hasDropdown && isExpanded && !isCollapsed && children}
            </div>
        );
    };

    return (
        <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} min-h-screen flex flex-col`}>
            {/* Header */}
            <div className={`p-4 border-b border-gray-100 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && (
                    <h1 className="text-lg font-semibold text-gray-900">YouTube Analyzer</h1>
                )}
                <button
                    onClick={onToggleCollapse}
                    className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                >
                    <svg
                        className={`w-5 h-5 text-gray-600 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 p-3 space-y-1">
                {/* Home */}
                <NavItem
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                    </svg>}
                    label="Home"
                    isActive={currentView === 'home'}
                    onClick={() => onViewChange('home')}
                />

                {/* Creator Hub Section */}
                <NavItem
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>}
                    label="Creator Hub"
                    onClick={() => onViewChange('home')}
                    hasDropdown={true}
                    isExpanded={expandedSections.has('creator-hub')}
                    onToggle={() => toggleSectionExpansion('creator-hub')}
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
                        {isCreatingHub ? (
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
                        )}
                    </div>
                </NavItem>

                {/* Favorites Section */}
                <NavItem
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>}
                    label="Favorites"
                    onClick={() => onViewChange('favorite-videos')}
                    hasDropdown={true}
                    isExpanded={expandedSections.has('favorites')}
                    onToggle={() => toggleSectionExpansion('favorites')}
                >
                    <div className="ml-6 space-y-1">
                        <NavItem
                            icon={<div className="w-2 h-2 rounded-full bg-pink-400"></div>}
                            label="Favorite Creators"
                            isActive={currentView === 'favorite-creators'}
                            onClick={() => onViewChange('favorite-creators')}
                        />
                        <NavItem
                            icon={<div className="w-2 h-2 rounded-full bg-pink-400"></div>}
                            label="Favorite Videos"
                            isActive={currentView === 'favorite-videos'}
                            onClick={() => onViewChange('favorite-videos')}
                        />
                        <NavItem
                            icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>}
                            label="Starred Videos"
                            isActive={currentView === 'starred-videos'}
                            onClick={() => onViewChange('starred-videos')}
                        />
                    </div>
                </NavItem>
            </div>
        </div>
    );
}