/**
 * Services Index
 * Centralized export of all service modules for easy importing
 */
import { youtubeService } from './youtubeService';
import { youtubeTranscriptionService } from './youtubeTranscriptionService';
import { instagramService } from './instagramService';
import { userInteractionService } from './userInteractionService';
import { hubService } from './hubService';
import { oembedService } from './oembedService';
import { baseApiService } from './api';

// Export individual services
export { youtubeService, youtubeTranscriptionService, instagramService, userInteractionService, hubService, oembedService, baseApiService };

// Legacy compatibility - Export a unified service with all methods
// This maintains backward compatibility while using the new modular services
class LegacyApiService {
    // YouTube analysis methods
    startChannelAnalysis = youtubeService.startChannelAnalysis.bind(youtubeService);
    getAllCompletedAnalyses = youtubeService.getAllCompletedAnalyses.bind(youtubeService);
    getAnalysisStatus = youtubeService.getAnalysisStatus.bind(youtubeService);
    exportToCsv = youtubeService.exportToCsv.bind(youtubeService);
    exportToJson = youtubeService.exportToJson.bind(youtubeService);

    // YouTube transcription methods
    getVideoTranscription = youtubeTranscriptionService.getVideoTranscription.bind(youtubeTranscriptionService);
    startVideoTranscription = youtubeTranscriptionService.startVideoTranscription.bind(youtubeTranscriptionService);
    getTranscriptionStatus = youtubeTranscriptionService.getTranscriptionStatus.bind(youtubeTranscriptionService);
    getUserTranscriptions = youtubeTranscriptionService.getUserTranscriptions.bind(youtubeTranscriptionService);
    deleteTranscription = youtubeTranscriptionService.deleteTranscription.bind(youtubeTranscriptionService);

    // Instagram methods
    startInstagramAnalysis = instagramService.startInstagramAnalysis.bind(instagramService);
    getInstagramAnalysisStatus = instagramService.getInstagramAnalysisStatus.bind(instagramService);
    getAllCompletedInstagramAnalyses = instagramService.getAllCompletedInstagramAnalyses.bind(instagramService);
    exportInstagramToCsv = instagramService.exportInstagramToCsv.bind(instagramService);
    exportInstagramToJson = instagramService.exportInstagramToJson.bind(instagramService);

    // User interaction methods - with backward compatibility wrapper
    getUserVideoInteractions = async (userId: string, page?: number, limit?: number, filter?: 'favorites' | 'starred'): Promise<any> => {
        if (page === undefined && limit === undefined && filter === undefined) {
            // Backward compatibility: fetch all data without pagination (limited to 100 per request)
            const result = await userInteractionService.getUserVideoInteractions(userId, 1, 100);
            return result.data;
        }
        return await userInteractionService.getUserVideoInteractions(userId, page, limit, filter);
    };
    updateVideoInteraction = userInteractionService.updateVideoInteraction.bind(userInteractionService);
    getUserCreatorInteractions = userInteractionService.getUserCreatorInteractions.bind(userInteractionService);
    updateCreatorInteraction = userInteractionService.updateCreatorInteraction.bind(userInteractionService);

    // Hub methods
    getUserHubs = hubService.getUserHubs.bind(hubService);
    createHub = hubService.createHub.bind(hubService);
    deleteHub = hubService.deleteHub.bind(hubService);

    // oEmbed methods
    getInstagramOEmbed = oembedService.getInstagramOEmbed.bind(oembedService);

    // Utility methods
    downloadFile = baseApiService.downloadFile.bind(baseApiService);
}

// Export legacy apiService for backward compatibility
export const apiService = new LegacyApiService();