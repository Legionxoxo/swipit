import { useRef } from 'react';

interface VideoCommentOverlayProps {
    videoId: string;
    comment: string;
    setComment: (comment: string) => void;
    onClose: () => void;
    onSubmit: () => void;
    hasComment: boolean;
}

export default function VideoCommentOverlay({
    videoId,
    comment,
    setComment,
    onClose,
    onSubmit,
    hasComment
}: VideoCommentOverlayProps) {
    const commentRef = useRef<HTMLDivElement>(null);

    const handleDelete = () => {
        try {
            setComment('');
            onSubmit(); // This will handle the API call to remove the comment
        } catch (error) {
            console.error('Error deleting comment:', error);
        } finally {
            // Required by architecture rules
        }
    };

    return (
        <div 
            ref={commentRef}
            className="absolute top-4 left-4 right-4 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 z-[100]"
        >
            <div className="mb-2">
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add your comment..."
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-gray-800"
                    rows={4}
                    autoFocus
                />
            </div>
            
            <div className="flex justify-end space-x-2">
                {hasComment && (
                    <button
                        onClick={handleDelete}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
                    >
                        Delete
                    </button>
                )}
                <button
                    onClick={onSubmit}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
                >
                    Save
                </button>
            </div>
        </div>
    );
}