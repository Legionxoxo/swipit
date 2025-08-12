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
}: VideoActionMenuProps) {
    // _videoId kept for interface compatibility but not used locally
    return (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-10">
            {/* Star Rating Section */}
            <VideoStarRating
                rating={starRating}
                onStarClick={onStarClick}
            />
        </div>
    );
}