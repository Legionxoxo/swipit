/**
 * @fileoverview Test setup and teardown for Jest tests
 * @author Backend Team
 */

const fs = require('fs').promises;
const path = require('path');

// Global test configuration
global.TEST_CONFIG = {
    database: {
        testDbPath: path.join(__dirname, '../database/test_swipit.db'),
        originalDbPath: path.join(__dirname, '../database/swipit.db')
    },
    timeout: 30000,
    retryAttempts: 3
};

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Store original environment variables
const originalEnv = { ...process.env };

/**
 * Setup before all tests
 */
beforeAll(async () => {
    try {
        // Set test environment
        process.env.NODE_ENV = 'test';
        process.env.YOUTUBE_API_KEY = 'test_youtube_api_key';
        
        // Suppress non-error console output during tests
        console.log = jest.fn();
        console.warn = jest.fn();
        
        // Keep error logging for debugging
        console.error = originalConsoleError;
        
        // Clean up any existing test database
        try {
            await fs.unlink(global.TEST_CONFIG.database.testDbPath);
        } catch (error) {
            // File doesn't exist, that's fine
        }
        
    } catch (error) {
        console.error('Test setup error:', error);
        throw error;
    } finally {
        // Test setup completed
    }
});

/**
 * Cleanup after all tests
 */
afterAll(async () => {
    try {
        // Restore original console methods
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        
        // Restore original environment
        process.env = { ...originalEnv };
        
        // Clean up test database
        try {
            await fs.unlink(global.TEST_CONFIG.database.testDbPath);
        } catch (error) {
            // File doesn't exist, that's fine
        }
        
        // Wait for any pending operations
        await new Promise(resolve => setTimeout(resolve, 100));
        
    } catch (error) {
        console.error('Test cleanup error:', error);
    } finally {
        // Test cleanup completed
    }
});

/**
 * Setup before each test
 */
beforeEach(() => {
    try {
        // Clear all mocks
        jest.clearAllMocks();
        
        // Reset any module mocks
        jest.resetModules();
        
    } catch (error) {
        console.error('Test beforeEach error:', error);
    } finally {
        // Test beforeEach completed
    }
});

/**
 * Cleanup after each test
 */
afterEach(async () => {
    try {
        // Clean up any test-specific data
        // This will be extended as needed
        
    } catch (error) {
        console.error('Test afterEach error:', error);
    } finally {
        // Test afterEach completed
    }
});

/**
 * Utility function to create a test database connection
 * @returns {Promise<Object>} Test database connection
 */
global.createTestDatabase = async () => {
    try {
        const { createDatabaseWrapper } = require('../database/dbWrapper');
        return await createDatabaseWrapper(global.TEST_CONFIG.database.testDbPath);
    } catch (error) {
        console.error('Test database creation error:', error);
        throw error;
    } finally {
        // Test database creation completed
    }
};

/**
 * Utility function to clean up test database
 * @param {Object} db - Database connection to close
 */
global.cleanupTestDatabase = async (db) => {
    try {
        if (db && typeof db.close === 'function') {
            await db.close();
        }
    } catch (error) {
        console.error('Test database cleanup error:', error);
    } finally {
        // Test database cleanup completed
    }
};

/**
 * Utility function to create mock request object
 * @param {Object} options - Request options
 * @returns {Object} Mock request object
 */
global.createMockRequest = (options = {}) => {
    try {
        return {
            params: options.params || {},
            query: options.query || {},
            body: options.body || {},
            headers: options.headers || {},
            method: options.method || 'GET',
            url: options.url || '/',
            originalUrl: options.originalUrl || options.url || '/',
            path: options.path || '/',
            ...options
        };
    } catch (error) {
        console.error('Mock request creation error:', error);
        throw error;
    } finally {
        // Mock request creation completed
    }
};

/**
 * Utility function to create mock response object
 * @returns {Object} Mock response object
 */
global.createMockResponse = () => {
    try {
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            sendFile: jest.fn().mockReturnThis(),
            end: jest.fn().mockReturnThis(),
            header: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            locals: {}
        };
        
        return res;
    } catch (error) {
        console.error('Mock response creation error:', error);
        throw error;
    } finally {
        // Mock response creation completed
    }
};

/**
 * Utility function to wait for async operations
 * @param {number} ms - Milliseconds to wait
 */
global.waitFor = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Utility function to retry async operations
 * @param {Function} fn - Function to retry
 * @param {number} attempts - Number of attempts
 * @param {number} delay - Delay between attempts
 */
global.retryAsync = async (fn, attempts = 3, delay = 100) => {
    try {
        for (let i = 0; i < attempts; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === attempts - 1) throw error;
                await global.waitFor(delay);
            }
        }
    } catch (error) {
        console.error('Retry async error:', error);
        throw error;
    } finally {
        // Retry async completed
    }
};