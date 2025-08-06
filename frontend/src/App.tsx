
import { useState } from 'react';
import './App.css';
import Header from './components/Header';
import ChannelCard from './components/ChannelCard';
import VideosList from './components/VideosList';
import ErrorBoundary from './components/ErrorBoundary';
import EmptyState from './components/EmptyState';
import TrackChannelModal from './components/TrackChannelModal';
import type { AnalysisResponse } from './types/api';
import { apiService } from './services/api';

interface AnalysisData {
    analysisId: string;
    data: AnalysisResponse;
}

function App() {
    const [analyses, setAnalyses] = useState<AnalysisData[]>([]);
    const [currentView, setCurrentView] = useState<'channels' | 'videos'>('channels');
    const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisData | null>(null);
    const [loadingAnalyses, setLoadingAnalyses] = useState<Set<string>>(new Set());
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const handleAnalysisStarted = async (analysisId: string) => {
        try {
            setLoadingAnalyses(prev => new Set([...prev, analysisId]));

            const checkStatus = async () => {
                try {
                    const response = await apiService.getAnalysisStatus(analysisId);

                    if (response.status === 'completed') {
                        setAnalyses(prev => {
                            const existing = prev.find(a => a.analysisId === analysisId);
                            if (existing) {
                                return prev.map(a =>
                                    a.analysisId === analysisId
                                        ? { ...a, data: response }
                                        : a
                                );
                            } else {
                                return [...prev, { analysisId, data: response }];
                            }
                        });
                        setLoadingAnalyses(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(analysisId);
                            return newSet;
                        });
                    } else if (response.status === 'error') {
                        alert(`Analysis failed: ${response.error || 'Unknown error'}`);
                        setLoadingAnalyses(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(analysisId);
                            return newSet;
                        });
                    } else {
                        setAnalyses(prev => {
                            const existing = prev.find(a => a.analysisId === analysisId);
                            if (existing) {
                                return prev.map(a =>
                                    a.analysisId === analysisId
                                        ? { ...a, data: response }
                                        : a
                                );
                            } else {
                                return [...prev, { analysisId, data: response }];
                            }
                        });
                        setTimeout(checkStatus, 3000);
                    }
                } catch (error) {
                    console.error('Error checking analysis status:', error);
                    setTimeout(checkStatus, 5000);
                }
            };

            checkStatus();
        } catch (error) {
            console.error('Error starting analysis tracking:', error);
            setLoadingAnalyses(prev => {
                const newSet = new Set(prev);
                newSet.delete(analysisId);
                return newSet;
            });
        }
    };

    const handleChannelClick = (analysis: AnalysisData) => {
        if (analysis.data.status === 'completed') {
            setSelectedAnalysis(analysis);
            setCurrentView('videos');
        }
    };

    const handleBackToChannels = () => {
        setCurrentView('channels');
        setSelectedAnalysis(null);
    };

    const handleTrackChannelClick = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    if (currentView === 'videos' && selectedAnalysis) {
        return (
            <VideosList
                channelInfo={selectedAnalysis.data.channelInfo}
                videos={selectedAnalysis.data.videoData}
                videoSegments={selectedAnalysis.data.videoSegments}
                analysisId={selectedAnalysis.analysisId}
                onBack={handleBackToChannels}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header onTrackChannelClick={handleTrackChannelClick} />

            <TrackChannelModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onAnalysisStarted={handleAnalysisStarted}

            />

            <main className="max-w-7xl mx-auto px-4 py-8">
                {analyses.length === 0 ? (
                    <EmptyState onTrackChannel={handleTrackChannelClick} />
                ) : (
                    <div>
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Tracked Channels
                                </h2>
                                <p className="text-gray-600 mt-1">
                                    {analyses.length} channel{analyses.length !== 1 ? 's' : ''} being analyzed
                                </p>
                            </div>

                            <div className="text-sm text-gray-500">
                                {loadingAnalyses.size > 0 && (
                                    <div className="flex items-center space-x-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                        <span>{loadingAnalyses.size} analysis in progress...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {analyses.map(analysis => (
                                <ErrorBoundary key={analysis.analysisId}>
                                    {analysis.data && analysis.data.channelInfo ? (
                                        <ChannelCard
                                            channelInfo={analysis.data.channelInfo}
                                            totalVideos={analysis.data.totalVideos || 0}
                                            progress={analysis.data.progress || 0}
                                            isLoading={loadingAnalyses.has(analysis.analysisId) || analysis.data.status === 'processing'}
                                            onClick={() => handleChannelClick(analysis)}
                                        />
                                    ) : (
                                        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                                            <div className="animate-pulse">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                                                    <div className="flex-1">
                                                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                                                        <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
                                                        <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                                                    </div>
                                                </div>
                                                <div className="mt-4">
                                                    <div className="h-2 bg-gray-300 rounded w-full mb-2"></div>
                                                    <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </ErrorBoundary>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
