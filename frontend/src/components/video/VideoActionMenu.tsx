// localStorage removed - use database services instead
import VideoStarRating from './VideoStarRating';

interface VideoActionMenuProps {
    videoId: string;
    starRating: number;
    onStarClick: (rating: number) => void;
    onAddCommentClick: () => void;
}

export default function VideoActionMenu({
    videoId: _videoId,
    starRating,
    onStarClick,
    onAddCommentClick
}: VideoActionMenuProps) {
    // _videoId kept for interface compatibility but not used locally
    return (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-10">
            {/* Star Rating Section */}
            <VideoStarRating
                rating={starRating}
                onStarClick={onStarClick}
            />

            {/* Comments Section */}
            <button
                onClick={onAddCommentClick}
                className="w-full p-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
            >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <span className="text-sm text-gray-700">
                    Add Comment
                </span>
            </button>
        </div>
    );
}