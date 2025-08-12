/**
 * @fileoverview Tests for database connection management
 * @author Backend Team
 */

const fs = require('fs').promises;
const path = require('path');

// Mock the database wrapper and table initialization
jest.mock('../../database/dbWrapper', () => ({
    createDatabaseWrapper: jest.fn()
}));

jest.mock('../../database/tables/index', () => ({
    initializeAllTables: jest.fn()
}));

// Mock sqlite3 module
const mockSqliteDb = {
    serialize: jest.fn(callback => callback()),
    run: jest.fn((sql, callback) => {
        if (callback) callback(null);
    }),
    get: jest.fn(),
    all: jest.fn(),
    close: jest.fn(callback => {
        if (callback) callback(null);
    })
};

jest.mock('sqlite3', () => ({
    verbose: () => ({
        Database: jest.fn(() => mockSqliteDb)
    })
}));

const { createDatabaseWrapper } = require('../../database/dbWrapper');
const { initializeAllTables } = require('../../database/tables/index');

// Type assertions for mocked functions
/** @type {jest.MockedFunction<typeof createDatabaseWrapper>} */
const mockCreateDatabaseWrapper = /** @type {any} */ (createDatabaseWrapper);
/** @type {jest.MockedFunction<typeof initializeAllTables>} */
const mockInitializeAllTables = /** @type {any} */ (initializeAllTables);

describe('Database Connection', () => {
    let connectionModule;
    let mockDb;

    beforeEach(() => {
        try {
            // Reset module cache to get fresh instance
            jest.resetModules();
            
            // Create mock database instances
            mockDb = {
                get: jest.fn(),
                all: jest.fn(),
                run: jest.fn(),
                close: jest.fn()
            };

            // Reset all mocks
            jest.clearAllMocks();
            
            // Reset module-level variables by clearing the require cache
            delete require.cache[require.resolve('../../database/connection')];
            
            // Set up default mock implementations
            mockCreateDatabaseWrapper.mockResolvedValue(mockDb);
            mockInitializeAllTables.mockResolvedValue(undefined);
            
            // Set up default mock database responses
            mockDb.get.mockResolvedValue({ test: 1 });
            mockDb.all.mockResolvedValue([]);
            mockDb.run.mockResolvedValue({ lastID: 1, changes: 1 });
            mockDb.close.mockResolvedValue();
            
        } catch (error) {
            console.error('Test setup error:', error);
            throw error;
        } finally {
            // Test setup completed
        }
    });

    afterEach(() => {
        try {
            // Clean up any database connections
            connectionModule = null;
            
        } catch (error) {
            console.error('Test cleanup error:', error);
        } finally {
            // Test cleanup completed
        }
    });

    describe('getDatabase', () => {
        it('should create database connection successfully', async () => {
            try {
                // Arrange
                connectionModule = require('../../database/connection');
                mockCreateDatabaseWrapper.mockResolvedValue(mockDb);
                mockInitializeAllTables.mockResolvedValue(undefined);

                // Act
                const db = await connectionModule.getDatabase();

                // Assert
                expect(db).toBeDefined();
                expect(db).toBe(mockDb);
                expect(mockCreateDatabaseWrapper).toHaveBeenCalled();
                expect(mockInitializeAllTables).toHaveBeenCalledWith(mockDb);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return existing connection if healthy', async () => {
            try {
                // Arrange
                connectionModule = require('../../database/connection');
                
                const firstDb = await connectionModule.getDatabase();

                // Act
                const secondDb = await connectionModule.getDatabase();

                // Assert
                expect(firstDb).toBe(secondDb);
                expect(mockCreateDatabaseWrapper).toHaveBeenCalledTimes(1);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should reconnect if existing connection is unhealthy', async () => {
            try {
                // Arrange
                connectionModule = require('../../database/connection');
                mockCreateDatabaseWrapper.mockResolvedValue(mockDb);
                mockInitializeAllTables.mockResolvedValue(undefined);
                mockDb.get.mockResolvedValueOnce({ test: 1 });
                
                await connectionModule.getDatabase();
                
                // Simulate unhealthy connection on second health check
                mockDb.get.mockRejectedValueOnce(new Error('Connection lost'));
                
                // Set up new mock db for reconnection
                const newMockDb = {
                    get: jest.fn().mockResolvedValue({ test: 1 }),
                    all: jest.fn(),
                    run: jest.fn(),
                    close: jest.fn()
                };
                mockCreateDatabaseWrapper.mockResolvedValueOnce(newMockDb);

                // Act
                const newDb = await connectionModule.getDatabase();

                // Assert
                expect(newDb).toBeDefined();
                expect(newDb).toBe(newMockDb);
                expect(mockCreateDatabaseWrapper).toHaveBeenCalledTimes(2);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle database creation errors', async () => {
            try {
                // Arrange
                connectionModule = require('../../database/connection');
                mockCreateDatabaseWrapper.mockRejectedValue(new Error('Database creation failed'));

                // Act & Assert
                await expect(connectionModule.getDatabase()).rejects.toThrow('Failed to get database connection: Database creation failed');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle table initialization errors', async () => {
            try {
                // Arrange
                connectionModule = require('../../database/connection');
                mockInitializeAllTables.mockRejectedValue(new Error('Table creation failed'));

                // Act & Assert
                await expect(connectionModule.getDatabase()).rejects.toThrow('Failed to get database connection: Table creation failed');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should apply SQLite optimizations', async () => {
            try {
                // Arrange
                connectionModule = require('../../database/connection');

                // Act
                const db = await connectionModule.getDatabase();

                // Assert
                expect(mockCreateDatabaseWrapper).toHaveBeenCalledWith(
                    expect.stringContaining('swipit.db'), 
                    true // applyOptimizations flag should be true
                );
                expect(db).toBe(mockDb);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('closeDatabase', () => {
        it('should close existing database connection', async () => {
            try {
                // Arrange
                connectionModule = require('../../database/connection');
                mockCreateDatabaseWrapper.mockResolvedValue(mockDb);
                mockInitializeAllTables.mockResolvedValue(undefined);
                mockDb.get.mockResolvedValue({ test: 1 });
                mockDb.close.mockResolvedValue();
                
                await connectionModule.getDatabase();

                // Act
                await connectionModule.closeDatabase();

                // Assert
                expect(mockDb.close).toHaveBeenCalled();

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle close errors gracefully', async () => {
            try {
                // Arrange
                connectionModule = require('../../database/connection');
                mockCreateDatabaseWrapper.mockResolvedValue(mockDb);
                mockInitializeAllTables.mockResolvedValue(undefined);
                mockDb.get.mockResolvedValue({ test: 1 });
                mockDb.close.mockRejectedValue(new Error('Close error'));
                
                await connectionModule.getDatabase();

                // Act & Assert - Should throw error but be handled gracefully
                await expect(connectionModule.closeDatabase()).rejects.toThrow('Failed to close database: Close error');
                expect(mockDb.close).toHaveBeenCalled();

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should not throw error if no connection exists', async () => {
            try {
                // Arrange
                connectionModule = require('../../database/connection');

                // Act & Assert
                await expect(connectionModule.closeDatabase()).resolves.not.toThrow();

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('testDatabaseConnection', () => {
        it('should return true for successful connection test', async () => {
            try {
                // Arrange
                connectionModule = require('../../database/connection');
                mockCreateDatabaseWrapper.mockResolvedValue(mockDb);
                mockInitializeAllTables.mockResolvedValue(undefined);
                mockDb.get.mockResolvedValue({ test: 1 });

                // Act
                const result = await connectionModule.testDatabaseConnection();

                // Assert
                expect(result).toBe(true);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return false for failed connection test', async () => {
            try {
                // Arrange
                connectionModule = require('../../database/connection');
                mockCreateDatabaseWrapper.mockRejectedValue(new Error('Connection failed'));

                // Act
                const result = await connectionModule.testDatabaseConnection();

                // Assert
                expect(result).toBe(false);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return false for invalid test result', async () => {
            try {
                // Arrange
                connectionModule = require('../../database/connection');
                mockCreateDatabaseWrapper.mockResolvedValue(mockDb);
                mockInitializeAllTables.mockResolvedValue(undefined);
                mockDb.get.mockResolvedValue({ test: 0 });

                // Act
                const result = await connectionModule.testDatabaseConnection();

                // Assert
                expect(result).toBe(false);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return false for null test result', async () => {
            try {
                // Arrange
                connectionModule = require('../../database/connection');
                mockCreateDatabaseWrapper.mockResolvedValue(mockDb);
                mockInitializeAllTables.mockResolvedValue(undefined);
                mockDb.get.mockResolvedValue(null);

                // Act
                const result = await connectionModule.testDatabaseConnection();

                // Assert
                expect(result).toBe(false);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('databaseHealthCheck', () => {
        it('should return healthy status with table information', async () => {
            try {
                // Arrange
                connectionModule = require('../../database/connection');
                mockCreateDatabaseWrapper.mockResolvedValue(mockDb);
                mockInitializeAllTables.mockResolvedValue(undefined);
                mockDb.get.mockResolvedValue({ test: 1 });
                mockDb.all.mockResolvedValue([
                    { name: 'youtube_data' },
                    { name: 'instagram_data' }
                ]);

                // Act
                const health = await connectionModule.databaseHealthCheck();

                // Assert
                expect(health.status).toBe('healthy');
                expect(health.tables.youtube.exists).toBe(true);
                expect(health.tables.instagram.exists).toBe(true);
                expect(health.responseTime).toBeDefined();

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return healthy status with missing tables', async () => {
            try {
                // Arrange
                connectionModule = require('../../database/connection');
                mockCreateDatabaseWrapper.mockResolvedValue(mockDb);
                mockInitializeAllTables.mockResolvedValue(undefined);
                mockDb.get.mockResolvedValue({ test: 1 });
                mockDb.all.mockResolvedValue([]);

                // Act
                const health = await connectionModule.databaseHealthCheck();

                // Assert
                expect(health.status).toBe('healthy');
                expect(health.tables.youtube.exists).toBe(false);
                expect(health.tables.instagram.exists).toBe(false);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should return unhealthy status on database error', async () => {
            try {
                // Arrange
                connectionModule = require('../../database/connection');
                mockCreateDatabaseWrapper.mockRejectedValue(new Error('Database error'));

                // Act
                const health = await connectionModule.databaseHealthCheck();

                // Assert
                expect(health.status).toBe('unhealthy');
                expect(health.error).toBeDefined();

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should measure response time accurately', async () => {
            try {
                // Arrange
                connectionModule = require('../../database/connection');
                mockCreateDatabaseWrapper.mockImplementation(async () => {
                    await new Promise(resolve => setTimeout(resolve, 10));
                    return mockDb;
                });
                mockInitializeAllTables.mockResolvedValue(undefined);
                mockDb.get.mockResolvedValue({ test: 1 });
                mockDb.all.mockResolvedValue([]);

                // Act
                const startTime = Date.now();
                const health = await connectionModule.databaseHealthCheck();
                const actualTime = Date.now() - startTime;

                // Assert
                expect(health.responseTime).toMatch(/\d+ms/);
                expect(actualTime).toBeGreaterThanOrEqual(10);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle table query errors separately from connection errors', async () => {
            try {
                // Arrange
                connectionModule = require('../../database/connection');
                mockCreateDatabaseWrapper.mockResolvedValue(mockDb);
                mockInitializeAllTables.mockResolvedValue(undefined);
                mockDb.get.mockResolvedValue({ test: 1 });
                mockDb.all.mockRejectedValue(new Error('Permission denied'));

                // Act
                const health = await connectionModule.databaseHealthCheck();

                // Assert
                expect(health.status).toBe('healthy'); // Connection is still healthy
                expect(health.tables.youtube.exists).toBe(false);
                expect(health.tables.instagram.exists).toBe(false);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('Edge Cases and Error Scenarios', () => {
        it('should handle file system permission errors', async () => {
            try {
                // Arrange
                connectionModule = require('../../database/connection');
                mockCreateDatabaseWrapper.mockRejectedValue(new Error('EACCES: permission denied'));

                // Act & Assert
                await expect(connectionModule.getDatabase()).rejects.toThrow('Failed to get database connection: EACCES: permission denied');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle SQLite PRAGMA command failures', async () => {
            try {
                // Arrange
                connectionModule = require('../../database/connection');
                mockSqliteDb.run.mockImplementation((sql, callback) => {
                    if (callback) callback(new Error('PRAGMA failed'));
                });

                // Act
                const db = await connectionModule.getDatabase();

                // Assert - Should still create database despite PRAGMA failures
                expect(db).toBeDefined();

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle concurrent connection requests', async () => {
            try {
                // Arrange
                connectionModule = require('../../database/connection');
                mockCreateDatabaseWrapper.mockResolvedValue(mockDb);
                mockInitializeAllTables.mockResolvedValue(undefined);
                mockDb.get.mockResolvedValue({ test: 1 });

                // Act
                const [db1, db2, db3] = await Promise.all([
                    connectionModule.getDatabase(),
                    connectionModule.getDatabase(),
                    connectionModule.getDatabase()
                ]);

                // Assert
                expect(db1).toBe(db2);
                expect(db2).toBe(db3);
                expect(mockCreateDatabaseWrapper).toHaveBeenCalledTimes(1);

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle health check after connection close', async () => {
            try {
                // Arrange
                connectionModule = require('../../database/connection');
                mockCreateDatabaseWrapper.mockResolvedValue(mockDb);
                mockInitializeAllTables.mockResolvedValue(undefined);
                mockDb.get.mockResolvedValue({ test: 1 });
                mockDb.close.mockResolvedValue();
                
                await connectionModule.getDatabase();
                await connectionModule.closeDatabase();
                
                // Mock a new connection that fails health check
                const failingMockDb = {
                    get: jest.fn().mockRejectedValue(new Error('Connection closed')),
                    all: jest.fn(),
                    run: jest.fn(),
                    close: jest.fn()
                };
                mockCreateDatabaseWrapper.mockResolvedValueOnce(failingMockDb);

                // Act
                const health = await connectionModule.databaseHealthCheck();

                // Assert
                expect(health.status).toBe('unhealthy');

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });
});