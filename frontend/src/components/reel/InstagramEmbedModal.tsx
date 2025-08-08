import { useEffect } from 'react';

interface InstagramEmbedModalProps {
    isOpen: boolean;
    onClose: () => void;
    embedLink: string;
    postLink: string;
    reelTitle: string;
    creatorName: string;
}

export default function InstagramEmbedModal({ 
    isOpen, 
    onClose, 
    embedLink, 
    postLink, 
    reelTitle, 
    creatorName 
}: InstagramEmbedModalProps) {
    useEffect(() => {
        // Reset any state when modal opens/closes or embed link changes
    }, [embedLink, isOpen]);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleOpenInNewWindow = () => {
        // Create a new window/tab with a proper Instagram embed
        const embedHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Instagram Embed - ${reelTitle}</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body {
                        margin: 0;
                        padding: 20px;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: #fafafa;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                    }
                    .embed-container {
                        max-width: 540px;
                        width: 100%;
                    }
                    .fallback {
                        text-align: center;
                        padding: 40px 20px;
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .fallback a {
                        display: inline-block;
                        background: #405de6;
                        color: white;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 4px;
                        margin-top: 16px;
                    }
                </style>
                <script async src="https://www.instagram.com/embed.js"></script>
            </head>
            <body>
                <div class="embed-container">
                    <blockquote class="instagram-media" data-instgrm-permalink="${postLink}" data-instgrm-version="14" style="background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"
                        <div class="fallback">
                            <p><strong>@${creatorName}</strong></p>
                            <p>${reelTitle.substring(0, 100)}${reelTitle.length > 100 ? '...' : ''}</p>
                            <a href="${postLink}" target="_blank" rel="noopener">View on Instagram</a>
                        </div>
                    </blockquote>
                </div>
            </body>
            </html>
        `;
        
        const newWindow = window.open('', '_blank', 'width=600,height=800,scrollbars=yes,resizable=yes');
        if (newWindow) {
            newWindow.document.write(embedHtml);
            newWindow.document.close();
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold">Instagram Embed</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 p-1"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 max-h-[70vh] overflow-auto">
                    <div className="space-y-4">
                        {/* Instagram Embed Preview */}
                        <div className="w-full bg-gray-100 rounded-lg p-6 text-center">
                            <div className="space-y-4">
                                {/* Instagram Icon */}
                                <div className="flex justify-center">
                                    <svg className="w-12 h-12 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12.017 0C8.396 0 7.853.016 6.625.071 5.398.126 4.56.336 3.842.637c-.75.293-1.386.683-2.019 1.316C1.19 2.587.8 3.223.507 3.973c-.301.718-.511 1.556-.566 2.783C-.054 7.984-.072 8.527-.072 12.148s.018 4.164.072 5.392c.055 1.227.265 2.065.566 2.783.293.75.683 1.386 1.316 2.019.633.633 1.269 1.023 2.019 1.316.718.301 1.556.511 2.783.566 1.228.055 1.771.073 5.392.073s4.164-.018 5.392-.073c1.227-.055 2.065-.265 2.783-.566.75-.293 1.386-.683 2.019-1.316.633-.633 1.023-1.269 1.316-2.019.301-.718.511-1.556.566-2.783.055-1.228.073-1.771.073-5.392s-.018-4.164-.073-5.392c-.055-1.227-.265-2.065-.566-2.783-.293-.75-.683-1.386-1.316-2.019C18.598.8 17.962.41 17.212.117 16.494-.184 15.656-.394 14.429-.449 13.201-.504 12.658-.522 9.037-.522H12.017z"/>
                                        <path d="M12.017 5.838a6.31 6.31 0 100 12.62 6.31 6.31 0 000-12.62zm0 10.408a4.098 4.098 0 110-8.196 4.098 4.098 0 010 8.196z"/>
                                        <circle cx="18.406" cy="5.594" r="1.44"/>
                                    </svg>
                                </div>

                                {/* Post Preview */}
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Instagram Post</h4>
                                    <p className="text-gray-600 text-sm">@{creatorName}</p>
                                    <p className="text-gray-700 text-sm mt-2 line-clamp-3">
                                        {reelTitle.substring(0, 150)}{reelTitle.length > 150 ? '...' : ''}
                                    </p>
                                </div>

                                {/* Embed options */}
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-500">
                                        Instagram embeds work best when opened in a separate window
                                    </p>
                                    
                                    <div className="flex flex-col space-y-3">
                                        <button
                                            onClick={handleOpenInNewWindow}
                                            className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-3 px-4 rounded transition-colors duration-200"
                                        >
                                            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                            Open Instagram Embed
                                        </button>
                                        <a
                                            href={postLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-3 px-4 rounded transition-colors duration-200 text-center inline-block"
                                        >
                                            <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12.017 0C8.396 0 7.853.016 6.625.071 5.398.126 4.56.336 3.842.637c-.75.293-1.386.683-2.019 1.316C1.19 2.587.8 3.223.507 3.973c-.301.718-.511 1.556-.566 2.783C-.054 7.984-.072 8.527-.072 12.148s.018 4.164.072 5.392c.055 1.227.265 2.065.566 2.783.293.75.683 1.386 1.316 2.019.633.633 1.269 1.023 2.019 1.316.718.301 1.556.511 2.783.566 1.228.055 1.771.073 5.392.073s4.164-.018 5.392-.073c1.227-.055 2.065-.265 2.783-.566.75-.293 1.386-.683 2.019-1.316.633-.633 1.023-1.269 1.316-2.019.301-.718.511-1.556.566-2.783.055-1.228.073-1.771.073-5.392s-.018-4.164-.073-5.392c-.055-1.227-.265-2.065-.566-2.783-.293-.75-.683-1.386-1.316-2.019C18.598.8 17.962.41 17.212.117 16.494-.184 15.656-.394 14.429-.449 13.201-.504 12.658-.522 9.037-.522H12.017z"/>
                                                <path d="M12.017 5.838a6.31 6.31 0 100 12.62 6.31 6.31 0 000-12.62zm0 10.408a4.098 4.098 0 110-8.196 4.098 4.098 0 010 8.196z"/>
                                                <circle cx="18.406" cy="5.594" r="1.44"/>
                                            </svg>
                                            View on Instagram
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="border-t p-4 flex space-x-3">
                    <a
                        href={postLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors duration-200 text-center"
                    >
                        View on Instagram
                    </a>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm font-medium py-2 px-4 rounded transition-colors duration-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}