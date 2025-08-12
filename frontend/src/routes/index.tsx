import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from './RootLayout';
import { HomePage } from '../pages/HomePage';
import { CreatorDetailPage } from '../pages/CreatorDetailPage';
import { HubsPage } from '../pages/HubsPage';
import { HubDetailPage } from '../pages/HubDetailPage';
import { FavoriteCreatorsPage } from '../pages/FavoriteCreatorsPage';
import { FavoriteVideosPage } from '../pages/FavoriteVideosPage';
import { StarredVideosPage } from '../pages/StarredVideosPage';
import { ErrorBoundaryPage } from '../pages/ErrorBoundaryPage';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <RootLayout />,
        errorElement: <ErrorBoundaryPage />,
        children: [
            {
                index: true,
                element: <HomePage />
            },
            {
                path: 'creators/:platform/:analysisId',
                element: <CreatorDetailPage />
            },
            {
                path: 'hubs',
                children: [
                    {
                        index: true,
                        element: <HubsPage />
                    },
                    {
                        path: ':hubId',
                        element: <HubDetailPage />
                    }
                ]
            },
            {
                path: 'favorites',
                children: [
                    {
                        index: true,
                        element: <Navigate to="/favorites/creators" replace />
                    },
                    {
                        path: 'creators',
                        element: <FavoriteCreatorsPage />
                    },
                    {
                        path: 'videos',
                        element: <FavoriteVideosPage />
                    },
                    {
                        path: 'starred',
                        element: <StarredVideosPage />
                    }
                ]
            },
            {
                path: '*',
                element: <Navigate to="/" replace />
            }
        ]
    }
]);