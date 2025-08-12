import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideosList from '../components/VideosList';
import InstagramReelsList from '../components/InstagramReelsList';
import type { AnalysisResponse, InstagramAnalysisData } from '../types/api';
import { apiService } from '../services';

export function CreatorDetailPage() {
    const { platform, analysisId } = useParams<{ platform: string; analysisId: string }>();
    const navigate = useNavigate();
    const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
    const [instagramData, setInstagramData] = useState<InstagramAnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!analysisId || !platform) {
            navigate('/');
            return;
        }

        loadAnalysisData();
    }, [analysisId, platform, navigate]);

    const loadAnalysisData = async () => {
        try {
            setLoading(true);
            setError(null);

            if (platform === 'youtube') {
                const data = await apiService.getAnalysisStatus(analysisId!);
                setAnalysisData(data);
                setInstagramData(null);
            } else if (platform === 'instagram') {
                const data = await apiService.getInstagramAnalysisStatus(analysisId!);
                setInstagramData(data);
                setAnalysisData(null);
            } else {
                throw new Error('Invalid platform');
            }
        } catch (error) {
            console.error('Error loading analysis data:', error);
            setError('Failed to load creator data');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Creator Data...</h2>
                    <p className="text-gray-600">Please wait while we load the creator information.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Data</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button 
                        onClick={handleBack}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Handle YouTube creator
    if (platform === 'youtube' && analysisData) {
        if (!analysisData.channelInfo) {
            return (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Channel Data...</h2>
                        <p className="text-gray-600">Please wait while we load the channel information.</p>
                        <button 
                            onClick={handleBack}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Back to Creators
                        </button>
                    </div>
                </div>
            );
        }
        
        const defaultVideoSegments = {
            viral: [],
            veryHigh: [],
            high: [],
            medium: [],
            low: []
        };
        
        return (
            <VideosList
                channelInfo={analysisData.channelInfo}
                videos={analysisData.videoData || []}
                videoSegments={analysisData.videoSegments || defaultVideoSegments}
                analysisId={analysisId!}
                onBack={handleBack}
            />
        );
    }

    // Handle Instagram creator
    if (platform === 'instagram' && instagramData) {
        return (
            <InstagramReelsList
                profileInfo={instagramData.profile!}
                reels={instagramData.reels || []}
                reelSegments={instagramData.reelSegments || null}
                analysisId={analysisId!}
                onBack={handleBack}
            />
        );
    }

    // Invalid state
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-red-600 mb-2">Invalid Creator</h2>
                <p className="text-gray-600 mb-4">The requested creator could not be found.</p>
                <button 
                    onClick={handleBack}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Go Back
                </button>
            </div>
        </div>
    );
}