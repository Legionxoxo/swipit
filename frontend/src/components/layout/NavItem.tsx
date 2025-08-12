import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface NavItemProps {
    icon: ReactNode;
    label: string;
    isActive?: boolean;
    onClick?: () => void;
    to?: string;
    hasDropdown?: boolean;
    isExpanded?: boolean;
    onToggle?: () => void;
    children?: ReactNode;
    isCollapsed?: boolean;
}

export default function NavItem({ 
    icon, 
    label, 
    isActive = false, 
    onClick,
    to,
    hasDropdown = false,
    isExpanded = false,
    onToggle,
    children,
    isCollapsed = false
}: NavItemProps) {
    const handleClick = () => {
        if (!isCollapsed && hasDropdown && onToggle) {
            // When expanded and has dropdown, use toggle
            onToggle();
        } else if (onClick) {
            // Otherwise use onClick
            onClick();
        }
    };

    const content = (
        <>
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
        </>
    );

    const className = `flex items-center px-3 py-2 text-sm rounded-md cursor-pointer transition-colors ${
        isActive
            ? 'bg-blue-50 text-blue-700 font-medium'
            : 'text-gray-700 hover:bg-gray-100'
    } ${isCollapsed ? 'justify-center' : 'justify-between'}`;

    return (
        <div className="mb-1">
            {to ? (
                <Link to={to} className={className}>
                    {content}
                </Link>
            ) : (
                <div className={className} onClick={handleClick}>
                    {content}
                </div>
            )}
            {hasDropdown && isExpanded && !isCollapsed && children}
        </div>
    );
}