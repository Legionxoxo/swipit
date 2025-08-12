/**
 * @fileoverview Data validation utilities for frontend
 * @author Frontend Team
 */

/**
 * Validate if analysisId is a proper string (not malformed like "[object Object]")
 * @param analysisId - Analysis ID to validate
 * @returns boolean indicating if analysisId is valid
 */
export function isValidAnalysisId(analysisId: any): analysisId is string {
    return (
        typeof analysisId === 'string' &&
        analysisId.trim().length > 0 &&
        analysisId !== '[object Object]' &&
        !analysisId.includes('[object') &&
        !analysisId.includes('undefined') &&
        !analysisId.includes('null') &&
        !analysisId.includes('NaN')
    );
}

/**
 * Validate if data entry has valid required fields
 * @param entry - Data entry to validate
 * @returns boolean indicating if entry is valid
 */
export function isValidDataEntry(entry: any): boolean {
    return (
        entry &&
        typeof entry === 'object' &&
        isValidAnalysisId(entry.analysisId) &&
        entry.status &&
        typeof entry.status === 'string'
    );
}

/**
 * Filter array to remove entries with malformed data
 * @param data - Array of data entries
 * @param logMalformed - Whether to log malformed entries to console
 * @returns Filtered array with only valid entries
 */
export function filterValidEntries<T>(
    data: T[], 
    validator: (entry: T) => boolean = isValidDataEntry,
    logMalformed: boolean = true
): T[] {
    return data.filter(entry => {
        if (!validator(entry)) {
            if (logMalformed) {
                console.warn('Filtered out malformed data entry:', {
                    analysisId: (entry as any)?.analysisId,
                    type: typeof (entry as any)?.analysisId,
                    entry: entry
                });
            }
            return false;
        }
        return true;
    });
}

/**
 * Sanitize string to prevent XSS and display issues
 * @param str - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(str: any): string {
    if (typeof str !== 'string') {
        return String(str || '').replace(/[<>'"&]/g, '');
    }
    
    return str
        .replace(/[<>'"&]/g, '')
        .trim()
        .substring(0, 1000); // Limit length to prevent UI issues
}

/**
 * Validate and sanitize analysis data for display
 * @param analysis - Analysis data to validate
 * @returns Sanitized analysis data or null if invalid
 */
export function validateAnalysisData(analysis: any): any | null {
    if (!isValidDataEntry(analysis)) {
        return null;
    }
    
    return {
        ...analysis,
        analysisId: sanitizeString(analysis.analysisId),
        status: sanitizeString(analysis.status),
        channelInfo: analysis.channelInfo ? {
            ...analysis.channelInfo,
            channelName: sanitizeString(analysis.channelInfo.channelName),
            description: sanitizeString(analysis.channelInfo.description)
        } : null
    };
}