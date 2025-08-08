/**
 * @fileoverview Persistent Python process server to prevent memory leaks
 * @author Backend Team
 */

const { spawn } = require('child_process');
const EventEmitter = require('events');
const path = require('path');

/**
 * @typedef {Object} PythonRequest
 * @property {number} id - Request ID
 * @property {string} action - Action to perform (scraper, oembed)
 * @property {Object} params - Request parameters
 */

/**
 * @typedef {Object} PythonResponse
 * @property {number} id - Request ID
 * @property {boolean} success - Success status
 * @property {Object} [data] - Response data
 * @property {string} [error] - Error message
 * @property {Array} [progressLogs] - Progress messages
 */

/**
 * Persistent Python server class to handle API requests without spawning processes
 */
class PythonServer extends EventEmitter {
    constructor() {
        super();
        this.process = null;
        this.requestId = 0;
        this.pendingRequests = new Map();
        this.isStarted = false;
        this.isShuttingDown = false;
        this.dataBuffer = '';
        
        // Auto-cleanup on process exit
        process.on('exit', () => this.shutdown());
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
    }

    /**
     * Start the persistent Python process
     * @returns {Promise<void>}
     */
    async start() {
        try {
            if (this.isStarted || this.isShuttingDown) {
                return;
            }

            console.log('Starting persistent Python server...');
            
            const scriptPath = path.join(__dirname, '../../functions/scripts/api_server.py');
            
            this.process = spawn('python3', ['-u', scriptPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                detached: false,
                windowsHide: true
            });

            this.setupHandlers();
            this.isStarted = true;
            
            console.log('Python server started with PID:', this.process.pid);

        } catch (error) {
            console.error('Failed to start Python server:', error);
            throw new Error(`Failed to start Python server: ${error.message}`);
        } finally {
            // Server start attempt completed
        }
    }

    /**
     * Setup process event handlers
     */
    setupHandlers() {
        try {
            // Handle stdout data (responses)
            this.process.stdout.on('data', (data) => {
                try {
                    this.dataBuffer += data.toString();
                    this.processMessages();
                } catch (error) {
                    console.error('Python stdout processing error:', error);
                } finally {
                    // Stdout data processed
                }
            });

            // Handle stderr (errors and logs)
            this.process.stderr.on('data', (data) => {
                try {
                    const errorMessage = data.toString();
                    console.error('Python server stderr:', errorMessage);
                } catch (error) {
                    console.error('Python stderr processing error:', error);
                } finally {
                    // Stderr data processed
                }
            });

            // Handle process close
            this.process.on('close', (code) => {
                try {
                    console.log(`Python server closed with code: ${code}`);
                    this.isStarted = false;
                    
                    // Reject all pending requests
                    for (const [id, { reject }] of this.pendingRequests) {
                        reject(new Error(`Python server closed with code ${code}`));
                    }
                    this.pendingRequests.clear();
                    
                    this.emit('close', code);
                } catch (error) {
                    console.error('Python process close handling error:', error);
                } finally {
                    // Process close handled
                }
            });

            // Handle process error
            this.process.on('error', (error) => {
                try {
                    console.error('Python server error:', error);
                    this.isStarted = false;
                    
                    // Reject all pending requests
                    for (const [id, { reject }] of this.pendingRequests) {
                        reject(new Error(`Python server error: ${error.message}`));
                    }
                    this.pendingRequests.clear();
                    
                    this.emit('error', error);
                } catch (handlingError) {
                    console.error('Python process error handling failed:', handlingError);
                } finally {
                    // Process error handled
                }
            });

        } catch (error) {
            console.error('Failed to setup Python process handlers:', error);
            throw new Error(`Failed to setup handlers: ${error.message}`);
        } finally {
            // Handler setup completed
        }
    }

    /**
     * Process incoming messages from Python
     */
    processMessages() {
        try {
            const lines = this.dataBuffer.split('\n');
            this.dataBuffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
                if (!line.trim()) continue;

                try {
                    const response = JSON.parse(line);
                    
                    if (response.id && this.pendingRequests.has(response.id)) {
                        const { resolve, reject } = this.pendingRequests.get(response.id);
                        this.pendingRequests.delete(response.id);
                        
                        if (response.success) {
                            resolve(response);
                        } else {
                            reject(new Error(response.error || 'Python request failed'));
                        }
                    } else if (response.type === 'log') {
                        console.log('Python log:', response.message);
                    }
                } catch (parseError) {
                    console.error('Failed to parse Python response:', parseError, 'Line:', line);
                }
            }
        } catch (error) {
            console.error('Message processing error:', error);
        } finally {
            // Message processing completed
        }
    }

    /**
     * Send request to Python server
     * @param {string} action - Action to perform
     * @param {Object} params - Request parameters
     * @param {Function} [progressCallback] - Progress callback
     * @returns {Promise<PythonResponse>}
     */
    async sendRequest(action, params, progressCallback = null) {
        try {
            if (!this.isStarted || this.isShuttingDown) {
                throw new Error('Python server not started');
            }

            const id = ++this.requestId;
            const request = {
                id,
                action,
                params: params || {}
            };

            return new Promise((resolve, reject) => {
                try {
                    // Store request callbacks
                    this.pendingRequests.set(id, { 
                        resolve: (response) => {
                            // Call progress callback if provided
                            if (progressCallback && response.progressLogs) {
                                response.progressLogs.forEach(log => progressCallback(log));
                            }
                            resolve(response);
                        }, 
                        reject 
                    });

                    // Send request to Python
                    const requestJson = JSON.stringify(request) + '\n';
                    this.process.stdin.write(requestJson);

                    // Set timeout for request (5 minutes)
                    setTimeout(() => {
                        if (this.pendingRequests.has(id)) {
                            this.pendingRequests.delete(id);
                            reject(new Error('Python request timeout'));
                        }
                    }, 5 * 60 * 1000);

                } catch (error) {
                    this.pendingRequests.delete(id);
                    reject(new Error(`Failed to send request: ${error.message}`));
                }
            });

        } catch (error) {
            console.error('Send request error:', error);
            throw new Error(`Failed to send Python request: ${error.message}`);
        } finally {
            // Request sending completed
        }
    }

    /**
     * Execute Instagram scraper
     * @param {string} username - Instagram username
     * @param {string} analysisId - Analysis ID
     * @param {Function} [progressCallback] - Progress callback
     * @param {Array} [extensionCookies] - Extension cookies
     * @returns {Promise<Object>}
     */
    async executeInstagramScraper(username, analysisId, progressCallback = null, extensionCookies = null) {
        try {
            if (!username) {
                throw new Error('Username is required');
            }
            if (!analysisId) {
                throw new Error('Analysis ID is required');
            }

            const params = {
                username: username.replace('@', '').trim(),
                analysisId,
                extensionCookies: extensionCookies || null
            };

            return await this.sendRequest('instagram_scraper', params, progressCallback);

        } catch (error) {
            console.error('Instagram scraper execution error:', error);
            throw new Error(`Failed to execute Instagram scraper: ${error.message}`);
        } finally {
            console.log(`Instagram scraper request completed for: ${username}`);
        }
    }

    /**
     * Execute Instagram oEmbed
     * @param {string} postUrl - Instagram post URL
     * @returns {Promise<Object>}
     */
    async fetchInstagramOembed(postUrl) {
        try {
            if (!postUrl) {
                throw new Error('Post URL is required');
            }

            const params = { postUrl };
            return await this.sendRequest('instagram_oembed', params);

        } catch (error) {
            console.error('Instagram oEmbed execution error:', error);
            throw new Error(`Failed to fetch Instagram oEmbed: ${error.message}`);
        } finally {
            console.log(`oEmbed request completed for: ${postUrl}`);
        }
    }

    /**
     * Test Python environment
     * @returns {Promise<boolean>}
     */
    async testEnvironment() {
        try {
            const response = await this.sendRequest('test_environment', {});
            return response.success;
        } catch (error) {
            console.error('Environment test error:', error);
            return false;
        } finally {
            console.log('Environment test completed');
        }
    }

    /**
     * Shutdown the Python server
     */
    shutdown() {
        try {
            if (this.isShuttingDown || !this.isStarted) {
                return;
            }

            this.isShuttingDown = true;
            console.log('Shutting down Python server...');

            // Reject all pending requests
            for (const [id, { reject }] of this.pendingRequests) {
                reject(new Error('Python server shutting down'));
            }
            this.pendingRequests.clear();

            // Kill process
            if (this.process && !this.process.killed) {
                this.process.removeAllListeners();
                this.process.kill('SIGTERM');
                
                // Force kill after 5 seconds
                setTimeout(() => {
                    if (this.process && !this.process.killed) {
                        this.process.kill('SIGKILL');
                    }
                }, 5000);
            }

            this.isStarted = false;
            console.log('Python server shutdown complete');

        } catch (error) {
            console.error('Python server shutdown error:', error);
        } finally {
            // Shutdown completed
        }
    }
}

// Global instance
let globalPythonServer = null;

/**
 * Get or create global Python server instance
 * @returns {Promise<PythonServer>}
 */
async function getPythonServer() {
    try {
        if (!globalPythonServer) {
            globalPythonServer = new PythonServer();
            await globalPythonServer.start();
        }
        return globalPythonServer;
    } catch (error) {
        console.error('Failed to get Python server:', error);
        throw new Error(`Failed to get Python server: ${error.message}`);
    } finally {
        // Python server retrieval completed
    }
}

module.exports = {
    PythonServer,
    getPythonServer
};