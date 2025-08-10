import { useState } from 'react';
import CsvUploadModal from '../csv/CsvUploadModal';

interface HeaderProps {
    onTrackChannelClick: () => void;
    videoViewMode: 'grid' | 'list';
    onVideoViewModeChange: (mode: 'grid' | 'list') => void;
}

export default function Header({ onTrackChannelClick, videoViewMode, onVideoViewModeChange }: HeaderProps) {
    const [showCsvUpload, setShowCsvUpload] = useState(false);
    
    return (
        <>
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium text-gray-700 mr-3">View:</span>
                        
                        {/* Grid View Button */}
                        <button
                            onClick={() => onVideoViewModeChange('grid')}
                            className={`p-2 rounded-md transition-colors ${
                                videoViewMode === 'grid'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                            title="Grid view"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>

                        {/* List View Button */}
                        <button
                            onClick={() => onVideoViewModeChange('list')}
                            className={`p-2 rounded-md transition-colors ${
                                videoViewMode === 'list'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                            title="List view"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setShowCsvUpload(true)}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Import CSV
                        </button>
                        <button
                            onClick={onTrackChannelClick}
                            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors shadow-sm"
                        >
                            + Track New Creator
                        </button>
                    </div>
                </div>
            </div>
        </header>
        
        {/* CSV Upload Modal */}
        <CsvUploadModal 
            isOpen={showCsvUpload} 
            onClose={() => setShowCsvUpload(false)} 
        />
        </>
    );
}