import StarredVideosView from '../components/views/StarredVideosView';

export function StarredVideosPage() {
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Starred Videos</h1>
                <p className="text-gray-600">Your starred and rated videos for future reference.</p>
            </div>
            
            <StarredVideosView />
        </div>
    );
}