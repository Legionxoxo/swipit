/**
 * @fileoverview Local storage service for session management only
 * @author Frontend Team
 * 
 * Note: This service now only handles essential session data.
 * All persistent data (hubs, favorites, stars, comments) is stored in the database.
 */

const USER_ID_KEY = 'user_id';
const APP_SETTINGS_KEY = 'app_settings';

interface AppSettings {
    theme?: 'light' | 'dark';
    sidebarCollapsed?: boolean;
    language?: string;
}

/**
 * Simplified localStorage service for session management only
 * All persistent data should use database services instead
 */
class LocalStorageService {
    /**
     * Get user ID from localStorage
     */
    getUserId(): string | null {
        try {
            return localStorage.getItem(USER_ID_KEY);
        } catch (error) {
            console.error('Error getting user ID from localStorage:', error);
            return null;
        } finally {
            // Required by architecture rules
        }
    }

    /**
     * Set user ID in localStorage
     */
    setUserId(userId: string): void {
        try {
            localStorage.setItem(USER_ID_KEY, userId);
        } catch (error) {
            console.error('Error setting user ID in localStorage:', error);
        } finally {
            // Required by architecture rules
        }
    }

    /**
     * Remove user ID from localStorage (logout)
     */
    removeUserId(): void {
        try {
            localStorage.removeItem(USER_ID_KEY);
        } catch (error) {
            console.error('Error removing user ID from localStorage:', error);
        } finally {
            // Required by architecture rules
        }
    }

    /**
     * Get app settings from localStorage
     */
    getAppSettings(): AppSettings {
        try {
            const settings = localStorage.getItem(APP_SETTINGS_KEY);
            return settings ? JSON.parse(settings) : {};
        } catch (error) {
            console.error('Error getting app settings:', error);
            return {};
        } finally {
            // Required by architecture rules
        }
    }

    /**
     * Set app settings in localStorage
     */
    setAppSettings(settings: AppSettings): void {
        try {
            localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Error setting app settings:', error);
        } finally {
            // Required by architecture rules
        }
    }

    /**
     * Clear all localStorage data (for logout/reset)
     */
    clearAll(): void {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        } finally {
            // Required by architecture rules
        }
    }
}

export const localStorageService = new LocalStorageService();