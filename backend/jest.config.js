/**
 * @fileoverview Jest configuration for BuzzHunt Backend
 * @author Backend Team
 */

module.exports = {
    // Test environment
    testEnvironment: 'node',
    
    // Test file patterns
    testMatch: [
        '**/__tests__/**/*.test.js',
        '**/__tests__/**/*.spec.js'
    ],
    
    // Coverage settings
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    collectCoverageFrom: [
        '**/*.js',
        '!**/node_modules/**',
        '!**/coverage/**',
        '!**/temp/**',
        '!**/public/**',
        '!jest.config.js',
        '!**/__tests__/**'
    ],
    
    // Setup files
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
    
    // Test timeout
    testTimeout: 30000,
    
    // Clear mocks between tests
    clearMocks: true,
    restoreMocks: true,
    
    // Verbose output
    verbose: true,
    
    // Handle async operations
    detectOpenHandles: true,
    forceExit: true,
    
    // Transform settings (if needed for ES modules)
    transform: {},
    
    // Module paths
    roots: ['<rootDir>'],
    
    // Error handling
    errorOnDeprecated: true
};