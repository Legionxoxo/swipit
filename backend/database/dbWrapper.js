/**
 * @fileoverview Async SQLite wrapper for database operations
 * @author Backend Team
 */

const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

/**
 * @typedef {Object} DatabaseWrapper
 * @property {Function} get - Get single row from database
 * @property {Function} all - Get all rows from database
 * @property {Function} run - Execute SQL command
 * @property {Function} close - Close database connection
 */

/**
 * Create async wrapper for SQLite database
 * @param {string} dbPath - Path to SQLite database file
 * @returns {Promise<DatabaseWrapper>} Database wrapper with async methods
 */
async function createDatabaseWrapper(dbPath) {
    try {
        const db = new sqlite3.Database(dbPath);

        // Promisify SQLite methods for async/await support
        const asyncGet = promisify(db.get.bind(db));
        const asyncAll = promisify(db.all.bind(db));
        const asyncClose = promisify(db.close.bind(db));

        /**
         * Execute SQL query and return single row
         * @param {string} sql - SQL query string
         * @param {Array|Object} [params] - Query parameters
         * @returns {Promise<Object|null>} Single row result or null
         */
        async function get(sql, params = []) {
            try {
                if (!sql) {
                    throw new Error('SQL query is required');
                }

                return await asyncGet(sql, params);

            } catch (error) {
                console.error('Database get error:', error);
                throw new Error(`Database query failed: ${error.message}`);
            } finally {
                console.log(`Database get executed: ${sql.substring(0, 50)}...`);
            }
        }

        /**
         * Execute SQL query and return all rows
         * @param {string} sql - SQL query string
         * @param {Array|Object} [params] - Query parameters
         * @returns {Promise<Array>} Array of rows
         */
        async function all(sql, params = []) {
            try {
                if (!sql) {
                    throw new Error('SQL query is required');
                }

                return await asyncAll(sql, params);

            } catch (error) {
                console.error('Database all error:', error);
                throw new Error(`Database query failed: ${error.message}`);
            } finally {
                console.log(`Database all executed: ${sql.substring(0, 50)}...`);
            }
        }

        /**
         * Execute SQL command (INSERT, UPDATE, DELETE, CREATE, etc.)
         * @param {string} sql - SQL command string
         * @param {Array|Object} [params] - Command parameters
         * @returns {Promise<Object>} Result with lastID and changes
         */
        async function run(sql, params = []) {
            return new Promise((resolve, reject) => {
                try {
                    if (!sql) {
                        throw new Error('SQL command is required');
                    }

                    db.run(sql, params, function(error) {
                        if (error) {
                            console.error('Database run error:', error);
                            reject(new Error(`Database command failed: ${error.message}`));
                            return;
                        }
                        
                        resolve({
                            lastID: this.lastID || null,
                            changes: this.changes || 0
                        });
                    });

                } catch (error) {
                    console.error('Database run error:', error);
                    reject(new Error(`Database command failed: ${error.message}`));
                } finally {
                    console.log(`Database run executed: ${sql.substring(0, 50)}...`);
                }
            });
        }

        /**
         * Close database connection
         * @returns {Promise<void>}
         */
        async function close() {
            try {
                await asyncClose();
            } catch (error) {
                console.error('Database close error:', error);
                throw new Error(`Failed to close database: ${error.message}`);
            } finally {
                console.log('Database connection closed');
            }
        }

        return {
            get,
            all,
            run,
            close
        };

    } catch (error) {
        console.error('Database wrapper creation error:', error);
        throw new Error(`Failed to create database wrapper: ${error.message}`);
    } finally {
        console.log(`Database wrapper created for: ${dbPath}`);
    }
}

/**
 * Create async wrapper for existing SQLite database instance
 * @param {Object} db - Existing SQLite database instance
 * @returns {DatabaseWrapper} Database wrapper with async methods
 */
function wrapDatabase(db) {
    try {
        if (!db) {
            throw new Error('Database instance is required');
        }

        // Promisify SQLite methods for async/await support
        const asyncGet = promisify(db.get.bind(db));
        const asyncAll = promisify(db.all.bind(db));
        const asyncClose = promisify(db.close.bind(db));

        /**
         * Execute SQL query and return single row
         * @param {string} sql - SQL query string
         * @param {Array|Object} [params] - Query parameters
         * @returns {Promise<Object|null>} Single row result or null
         */
        async function get(sql, params = []) {
            try {
                return await asyncGet(sql, params);
            } catch (error) {
                console.error('Wrapped database get error:', error);
                throw error;
            } finally {
                console.log(`Wrapped database get executed: ${sql.substring(0, 50)}...`);
            }
        }

        /**
         * Execute SQL query and return all rows
         * @param {string} sql - SQL query string
         * @param {Array|Object} [params] - Query parameters
         * @returns {Promise<Array>} Array of rows
         */
        async function all(sql, params = []) {
            try {
                return await asyncAll(sql, params);
            } catch (error) {
                console.error('Wrapped database all error:', error);
                throw error;
            } finally {
                console.log(`Wrapped database all executed: ${sql.substring(0, 50)}...`);
            }
        }

        /**
         * Execute SQL command (INSERT, UPDATE, DELETE, CREATE, etc.)
         * @param {string} sql - SQL command string
         * @param {Array|Object} [params] - Command parameters
         * @returns {Promise<Object>} Result with lastID and changes
         */
        async function run(sql, params = []) {
            return new Promise((resolve, reject) => {
                try {
                    db.run(sql, params, function(error) {
                        if (error) {
                            console.error('Wrapped database run error:', error);
                            reject(error);
                            return;
                        }
                        
                        resolve({
                            lastID: this.lastID || null,
                            changes: this.changes || 0
                        });
                    });
                } catch (error) {
                    console.error('Wrapped database run error:', error);
                    reject(error);
                } finally {
                    console.log(`Wrapped database run executed: ${sql.substring(0, 50)}...`);
                }
            });
        }

        /**
         * Close database connection
         * @returns {Promise<void>}
         */
        async function close() {
            try {
                await asyncClose();
            } catch (error) {
                console.error('Wrapped database close error:', error);
                throw error;
            } finally {
                console.log('Wrapped database connection closed');
            }
        }

        return {
            get,
            all,
            run,
            close
        };

    } catch (error) {
        console.error('Database wrapping error:', error);
        throw new Error(`Failed to wrap database: ${error.message}`);
    } finally {
        console.log('Database wrapped successfully');
    }
}

module.exports = {
    createDatabaseWrapper,
    wrapDatabase
};