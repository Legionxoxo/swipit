/**
 * @fileoverview Simple user service for username management
 * @author Frontend Team
 */

const USER_ID_KEY = 'buzzhunt_user_id';

/**
 * Service for managing user identification
 */
class UserService {
    private currentUserId: string | null = null;

    /**
     * Get or create user ID
     * @returns {string} User ID
     */
    getUserId(): string {
        try {
            // Return cached user ID if available
            if (this.currentUserId) {
                return this.currentUserId;
            }

            // Check localStorage for existing user ID
            const existingUserId = localStorage.getItem(USER_ID_KEY);
            if (existingUserId) {
                this.currentUserId = existingUserId;
                return existingUserId;
            }

            // Generate new user ID
            const timestamp = Date.now();
            const randomSuffix = Math.random().toString(36).substr(2, 6);
            const newUserId = `user-${timestamp}-${randomSuffix}`;

            // Store in localStorage and cache
            localStorage.setItem(USER_ID_KEY, newUserId);
            this.currentUserId = newUserId;

            // New user ID generated
            return newUserId;

        } catch (error) {
            console.error('Error getting user ID:', error);
            // Fallback to session-based ID if localStorage fails
            if (!this.currentUserId) {
                const timestamp = Date.now();
                const randomSuffix = Math.random().toString(36).substr(2, 6);
                this.currentUserId = `user-${timestamp}-${randomSuffix}`;
            }
            return this.currentUserId;
        } finally {
            // Required by architecture rules
        }
    }

    /**
     * Clear current user (for testing/reset)
     */
    clearUser(): void {
        try {
            localStorage.removeItem(USER_ID_KEY);
            this.currentUserId = null;
            // User ID cleared
        } catch (error) {
            console.error('Error clearing user ID:', error);
        } finally {
            // Required by architecture rules
        }
    }

    /**
     * Check if user exists
     * @returns {boolean} True if user ID exists
     */
    hasUser(): boolean {
        try {
            return !!this.getUserId();
        } catch (error) {
            console.error('Error checking user existence:', error);
            return false;
        } finally {
            // Required by architecture rules
        }
    }
}

export const userService = new UserService();