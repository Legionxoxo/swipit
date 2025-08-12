import { useState } from 'react';
import CsvUploadModal from '../csv/CsvUploadModal';

interface HeaderProps {
    onTrackChannelClick: () => void;
}

export default function Header({ onTrackChannelClick }: HeaderProps) {
    const [showCsvUpload, setShowCsvUpload] = useState(false);
    
    return (
        <>
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex-1"></div>

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