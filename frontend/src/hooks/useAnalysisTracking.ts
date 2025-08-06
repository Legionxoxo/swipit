import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { AnalysisResponse } from '../types/api';

interface AnalysisData {
    analysisId: string;
    data: AnalysisResponse;
}


export function useAnalysisTracking() {
    const [analyses, setAnalyses] = useState<AnalysisData[]>([]);
    const [loadingAnalyses, setLoadingAnalyses] = useState<Set<string>>(new Set());

    // Load completed analyses from backend on mount
    useEffect(() => {
        loadCompletedAnalyses();
    }, []);

    const loadCompletedAnalyses = async () => {
        try {
            const completedAnalyses = await apiService.getAllCompletedAnalyses();
            
            // Transform backend data to frontend format
            const analysesWithData = await Promise.all(
                completedAnalyses.map(async (analysis: any) => {
                    try {
                        const fullAnalysisData = await apiService.getAnalysisStatus(analysis.analysisId);
                        return {
                            analysisId: analysis.analysisId,
                            data: fullAnalysisData
                        };
                    } catch (error) {
                        console.error(`Error loading analysis ${analysis.analysisId}:`, error);
                        return null;
                    }
                })
            );

            const validAnalyses = analysesWithData.filter(Boolean) as AnalysisData[];
            setAnalyses(validAnalyses);
        } catch (error) {
            console.error('Error loading completed analyses:', error);
        }
    };

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