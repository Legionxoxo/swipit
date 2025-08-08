/**
 * @fileoverview Main entry point for BuzzHunt Backend
 * @author Backend Team
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Route imports
const apiRoutes = require('./routes/api/index');

// Database imports
const { getDatabase, testDatabaseConnection, databaseHealthCheck } = require('./database/connection');

// Memory monitoring
const { getMemoryMonitor } = require('./utils/monitoring/memoryMonitor');

// Process monitoring
const { getProcessMonitor } = require('./utils/monitoring/processMonitor');

/**
 * @typedef {Object} ServerConfig
 * @property {number} port - Server port number
 * @property {string} nodeEnv - Node environment
 * @property {string} youtubeApiKey - YouTube API key
 */

/**
 * @typedef {Object} ErrorResponse
 * @property {boolean} success - Success status
 * @property {string} message - Error message
 * @property {string} [error] - Error details
 */

/**
 * Initialize Express application with middleware and routes
 * @returns {express.Application} Configured Express app
 */
function createApp() {
    try {
        const app = express();

        // Basic middleware setup
        app.use(cors({
            origin: [
                process.env.FRONTEND_URL || 'http://localhost:5173',
                'http://10.10.10.62',
                'http://10.10.10.62:3000',
                'http://127.0.0.1:5173',
                'http://localhost:3001',
                'chrome-extension://*'
            ],
            credentials: true
        }));
        
        app.use(express.json({ limit: '10mb' }));
        app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Health check endpoint with database status and memory monitoring
        app.get('/health', async (req, res) => {
            try {
                const dbHealth = await databaseHealthCheck();
                const memoryMonitor = getMemoryMonitor();
                const processMonitor = getProcessMonitor();
                const memoryStats = memoryMonitor.getMemorySummary();
                const processStats = processMonitor.getHealthSummary();
                
                res.status(200).json({
                    success: true,
                    message: 'BuzzHunt Backend is running',
                    timestamp: new Date().toISOString(),
                    environment: process.env.NODE_ENV || 'development',
                    database: dbHealth,
                    memory: memoryStats,
                    process: processStats
                });
            } catch (error) {
                console.error('Health check error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Health check failed',
                    error: error.message
                });
            } finally {
                // Log health check request
                console.log(`Health check requested at ${new Date().toISOString()}`);
            }
        });

        // API routes
        app.use('/api', apiRoutes);

        // Serve static files from public folder
        app.use(express.static(path.join(__dirname, 'public')));

        // Serve frontend index.html for all non-API routes (SPA routing)
        app.get('*', (req, res) => {
            try {
                // Don't serve index.html for API routes or if file doesn't exist
                if (req.path.startsWith('/api')) {
                    return res.status(404).json({
                        success: false,
                        message: 'API endpoint not found',
                        path: req.originalUrl
                    });
                }
                
                const indexPath = path.join(__dirname, 'public', 'index.html');
                res.sendFile(indexPath, (err) => {
                    if (err) {
                        res.status(404).json({
                            success: false,
                            message: 'Frontend not built yet. Run frontend build first.',
                            path: req.originalUrl
                        });
                    }
                });
            } catch (error) {
                console.error('Static file serving error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error serving static files'
                });
            } finally {
                console.log(`Served: ${req.method} ${req.originalUrl}`);
            }
        });

        // 404 handler for remaining cases
        app.use((req, res) => {
            try {
                res.status(404).json({
                    success: false,
                    message: 'Endpoint not found',
                    path: req.originalUrl
                });
            } catch (error) {
                console.error('404 handler error:', error);
            } finally {
                console.log(`404 - ${req.method} ${req.originalUrl}`);
            }
        });

        // Global error handler
        app.use((error, req, res, next) => {
            try {
                console.error('Global error handler:', error);
                
                const statusCode = error.statusCode || 500;
                const message = error.message || 'Internal server error';
                
                res.status(statusCode).json({
                    success: false,
                    message: message,
                    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
                });
            } catch (handlerError) {
                console.error('Error in error handler:', handlerError);
                res.status(500).json({
                    success: false,
                    message: 'Critical error occurred'
                });
            } finally {
                // Always log errors
                console.log(`Error handled: ${error.message || 'Unknown error'}`);
            }
        });

        return app;

    } catch (error) {
        console.error('Failed to create Express app:', error);
        throw error;
    } finally {
        console.log('Express app creation completed');
    }
}

/**
 * Validate required environment variables
 * @returns {ServerConfig} Validated configuration
 * @throws {Error} If required variables are missing
 */
function validateEnvironment() {
    try {
        const requiredVars = ['YOUTUBE_API_KEY'];
        const missing = requiredVars.filter(varName => !process.env[varName]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }

        return {
            port: parseInt(process.env.PORT, 10) || 3000,
            nodeEnv: process.env.NODE_ENV || 'development',
            youtubeApiKey: process.env.YOUTUBE_API_KEY
        };

    } catch (error) {
        console.error('Environment validation failed:', error.message);
        throw error;
    } finally {
        console.log('Environment validation completed');
    }
}

/**
 * Start the server
 * @param {express.Application} app - Express application
 * @param {ServerConfig} config - Server configuration
 * @returns {Promise<void>}
 */
async function startServer(app, config) {
    try {
        const server = app.listen(config.port, () => {
            console.log('='.repeat(50));
            console.log('🚀 BuzzHunt Backend Started');
            console.log(`📡 Server running on port ${config.port}`);
            console.log(`🌍 Environment: ${config.nodeEnv}`);
            console.log(`⏰ Started at: ${new Date().toISOString()}`);
            console.log('='.repeat(50));
        });

        // Graceful shutdown handling
        process.on('SIGTERM', () => {
            console.log('SIGTERM received, shutting down gracefully');
            server.close(() => {
                console.log('Server closed successfully');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            console.log('SIGINT received, shutting down gracefully');
            server.close(() => {
                console.log('Server closed successfully');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    } finally {
        console.log('Server startup process completed');
    }
}

// Main execution
if (require.main === module) {
    (async () => {
        try {
            console.log('Initializing BuzzHunt Backend...');
            
            // Step 1: Validate environment
            const config = validateEnvironment();
            
            // Step 2: Initialize monitoring systems
            console.log('Initializing monitoring systems...');
            
            // Memory monitoring
            const memoryMonitor = getMemoryMonitor({
                heapWarning: 150,   // 150MB for 1GB system
                heapCritical: 300,  // 300MB 
                rssWarning: 500,    // 500MB
                rssCritical: 700,   // 700MB
                monitorInterval: 15000 // 15 seconds
            });
            
            // Process monitoring with auto-restart
            const processMonitor = getProcessMonitor({
                maxMemoryMB: 750,       // 750MB limit for 1GB system
                maxRestarts: 3,         // Max 3 restarts in window
                restartWindow: 600000,  // 10 minute window
                enableAutoRestart: process.env.NODE_ENV === 'production',
                monitorInterval: 30000  // 30 seconds
            });
            
            // Handle memory pressure events
            process.on('memoryPressure', (data) => {
                console.error(`🚨 MEMORY PRESSURE: ${data.type} - Heap: ${data.stats.heapUsed}MB, RSS: ${data.stats.rss}MB`);
                
                if (data.type === 'heapCritical') {
                    // Force cleanup of Python server if needed
                    try {
                        const { getPythonServer } = require('./utils/python/pythonServer');
                        getPythonServer().then(server => server.shutdown()).catch(() => {});
                    } catch (e) {}
                }
            });
            
            // Handle process restart events
            processMonitor.on('restart', (reason) => {
                console.log(`🔄 Process restart triggered: ${reason.reason}`);
                
                // Cleanup before restart
                try {
                    const { getPythonServer } = require('./utils/python/pythonServer');
                    getPythonServer().then(server => server.shutdown()).catch(() => {});
                } catch (e) {}
            });
            
            console.log('Monitoring systems initialized ✓');
            
            // Step 3: Initialize database
            console.log('Initializing database connection...');
            const databaseConnected = await testDatabaseConnection();
            
            if (!databaseConnected) {
                throw new Error('Database connection failed - cannot start server');
            }
            console.log('Database connected successfully ✓');
            
            // Step 4: Create Express app
            const app = createApp();
            
            // Step 5: Start server
            await startServer(app, config);

        } catch (error) {
            console.error('Failed to initialize application:', error);
            process.exit(1);
        } finally {
            console.log('Application initialization completed');
        }
    })();
}

module.exports = { createApp, validateEnvironment, startServer };