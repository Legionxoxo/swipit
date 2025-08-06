import { useEffect, useRef } from 'react';

interface ContextMenuItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    destructive?: boolean;
}

interface ContextMenuProps {
    isOpen: boolean;
    onClose: () => void;
    position: { x: number; y: number };
    items: ContextMenuItem[];
}

export default function ContextMenu({ isOpen, onClose, position, items }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    // Adjust position to keep menu within viewport
    const adjustedPosition = { ...position };
    if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (position.x + rect.width > viewportWidth) {
            adjustedPosition.x = viewportWidth - rect.width - 10;
        }
        if (position.y + rect.height > viewportHeight) {
            adjustedPosition.y = viewportHeight - rect.height - 10;
        }
    }

    if (!isOpen) return null;

    return (
        <div
            ref={menuRef}
            className="fixed z-[10000] bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]"
            style={{
                left: adjustedPosition.x,
                top: adjustedPosition.y,
            }}
        >
            {items.map((item) => (
                <button
                    key={item.id}
                    onClick={() => {
                        if (!item.disabled) {
                            item.onClick();
                            onClose();
                        }
                    }}
                    disabled={item.disabled}
                    className={`w-full flex items-center px-3 py-2 text-sm text-left transition-colors ${
                        item.disabled
                            ? 'text-gray-400 cursor-not-allowed'
                            : item.destructive
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                    {item.icon && <span className="mr-3 flex-shrink-0">{item.icon}</span>}
                    <span>{item.label}</span>
                </button>
            ))}
        </div>
    );
}