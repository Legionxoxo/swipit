/**
 * @fileoverview Main entry point for YouTube Channel Analyzer Backend
 * @author Backend Team
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Route imports
const apiRoutes = require('./routes/api');

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
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true
        }));
        
        app.use(express.json({ limit: '10mb' }));
        app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Health check endpoint
        app.get('/health', (req, res) => {
            try {
                res.status(200).json({
                    success: true,
                    message: 'YouTube Channel Analyzer Backend is running',
                    timestamp: new Date().toISOString(),
                    environment: process.env.NODE_ENV || 'development'
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

        // 404 handler
        app.use('*', (req, res) => {
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
            port: parseInt(process.env.PORT, 10) || 3001,
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
            console.log('🚀 YouTube Channel Analyzer Backend Started');
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
            console.log('Initializing YouTube Channel Analyzer Backend...');
            
            const config = validateEnvironment();
            const app = createApp();
            
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