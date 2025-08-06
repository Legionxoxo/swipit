import { useState } from 'react';
import { apiService } from '../services/api';
import type { AnalysisResponse } from '../types/api';

interface AnalysisData {
    analysisId: string;
    data: AnalysisResponse;
}

export function useAnalysisTracking() {
    const [analyses, setAnalyses] = useState<AnalysisData[]>([]);
    const [loadingAnalyses, setLoadingAnalyses] = useState<Set<string>>(new Set());

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
        } finally {
            // Required by architecture rules
        }
    };

    return {
        analyses,
        loadingAnalyses,
        handleAnalysisStarted
    };
}