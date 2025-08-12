import FavoriteVideosView from '../components/views/FavoriteVideosView';

export function FavoriteVideosPage() {
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Favorite Videos</h1>
                <p className="text-gray-600">Your favorite videos and content across all platforms.</p>
            </div>
            
            <FavoriteVideosView />
        </div>
    );
}