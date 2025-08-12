import { useRouteError, useNavigate } from 'react-router-dom';

export function ErrorBoundaryPage() {
    const error = useRouteError() as Error;
    const navigate = useNavigate();

    console.error('Route Error:', error);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-red-600 mb-4">Oops!</h1>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Something went wrong</h2>
                <p className="text-gray-600 mb-6 max-w-md">
                    {error?.message || 'An unexpected error occurred. Please try again.'}
                </p>
                <div className="space-x-4">
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Go Home
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        </div>
    );
}