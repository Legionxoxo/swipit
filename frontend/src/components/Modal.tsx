import type { ReactNode } from 'react';
import { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'md' }: ModalProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl'
    };

    return (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
            {/* Background overlay */}
            <div
                className="absolute inset-0 bg-opacity-10 bg-gray-600/40"
                onClick={onClose}
            ></div>

            {/* Modal container */}
            <div className="relative flex min-h-full items-center justify-center px-4 py-12">
                {/* Modal content */}
                <div
                    className={`relative w-full ${maxWidthClasses[maxWidth]} transform overflow-hidden rounded-lg bg-white px-6 py-6 text-left shadow-2xl`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <div className="absolute top-4 right-4">
                        <button
                            onClick={onClose}
                            className="cursor-pointer rounded-md bg-white text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            <span className="sr-only">Close</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Modal header and content */}
                    <div className="pr-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">
                            {title}
                        </h3>
                        <div>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}