import { useState } from 'react';
import type { CreatorHub } from '../../types/api';
import NavItem from './NavItem';
import HubSection from './HubSection';
import FavoritesSection from './FavoritesSection';

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
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['creator-hub', 'favorites']));

    const toggleSectionExpansion = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    return (
        <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} h-screen flex flex-col fixed left-0 top-0 z-10`}>
            {/* Header */}
            <div className={`p-4 border-b border-gray-100 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && (
                    <h1 className="text-lg font-semibold text-gray-900">BuzzHunt</h1>
                )}
                <button
                    onClick={onToggleCollapse}
                    className="p-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
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
            <div className="flex-1 p-3 space-y-1 overflow-y-auto">
                {/* Home */}
                <NavItem
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                    </svg>}
                    label="All Creators"
                    isActive={currentView === 'home'}
                    onClick={() => onViewChange('home')}
                    isCollapsed={isCollapsed}
                />

                {/* Creator Hub Section */}
                <HubSection
                    hubs={hubs}
                    onHubsChange={onHubsChange}
                    currentView={currentView}
                    onViewChange={onViewChange}
                    isExpanded={expandedSections.has('creator-hub')}
                    onToggle={() => toggleSectionExpansion('creator-hub')}
                    isCollapsed={isCollapsed}
                />

                {/* Favorites Section */}
                <FavoritesSection
                    currentView={currentView}
                    onViewChange={onViewChange}
                    isExpanded={expandedSections.has('favorites')}
                    onToggle={() => toggleSectionExpansion('favorites')}
                    isCollapsed={isCollapsed}
                />
            </div>
        </div>
    );
}