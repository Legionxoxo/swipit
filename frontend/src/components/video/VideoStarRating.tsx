interface VideoStarRatingProps {
    rating: number;
    onStarClick: (rating: number) => void;
}

export default function VideoStarRating({ rating, onStarClick }: VideoStarRatingProps) {
    return (
        <div className="p-4 border-b">
            <p className="text-sm font-medium text-gray-700 mb-2">Rate this video</p>
            <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((starValue) => (
                    <button
                        key={starValue}
                        onClick={() => onStarClick(starValue)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors duration-200"
                    >
                        <svg 
                            className={`w-5 h-5 ${starValue <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            fill={starValue <= rating ? 'currentColor' : 'none'}
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </button>
                ))}
            </div>
        </div>
    );
}