/**
 * @fileoverview Process monitoring and auto-restart functionality
 * @author Backend Team
 */

const { EventEmitter } = require('events');

/**
 * @typedef {Object} ProcessStats
 * @property {number} uptime - Process uptime in seconds
 * @property {number} cpuUsage - CPU usage percentage
 * @property {number} pid - Process ID
 * @property {number} ppid - Parent process ID
 * @property {string} platform - Operating system platform
 * @property {string} nodeVersion - Node.js version
 */

/**
 * Process monitoring and health management
 */
class ProcessMonitor extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            monitorInterval: options.monitorInterval || 60000, // 1 minute
            maxMemoryMB: options.maxMemoryMB || 800, // 800MB for 1GB system
            maxRestarts: options.maxRestarts || 5,
            restartWindow: options.restartWindow || 300000, // 5 minutes
            enableAutoRestart: options.enableAutoRestart !== false,
            ...options
        };
        
        this.isMonitoring = false;
        this.intervalId = null;
        this.restartHistory = [];
        this.startTime = Date.now();
        this.lastCpuUsage = process.cpuUsage();
    }

    /**
     * Get current process statistics
     * @returns {ProcessStats} Process statistics
     */
    getProcessStats() {
        try {
            const memUsage = process.memoryUsage();
            const currentCpuUsage = process.cpuUsage(this.lastCpuUsage);
            this.lastCpuUsage = process.cpuUsage();
            
            // Calculate CPU percentage (rough estimation)
            const cpuPercent = Math.round(
                ((currentCpuUsage.user + currentCpuUsage.system) / 1000000) * 100 / (this.options.monitorInterval / 1000)
            );
            
            return {
                uptime: Math.round((Date.now() - this.startTime) / 1000),
                memory: {
                    rss: Math.round(memUsage.rss / 1024 / 1024),
                    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                    external: Math.round(memUsage.external / 1024 / 1024)
                },
                cpuUsage: Math.min(cpuPercent, 100), // Cap at 100%
                pid: process.pid,
                ppid: process.ppid,
                platform: process.platform,
                nodeVersion: process.version,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Process stats error:', error);
            return null;
        } finally {
            // Process stats retrieved
        }
    }

    /**
     * Check if process needs restart based on health metrics
     * @param {ProcessStats} stats - Process statistics
     * @returns {Object|null} Restart reason or null
     */
    checkRestartConditions(stats) {
        try {
            if (!stats) return null;

            // Check memory usage
            if (stats.memory.rss > this.options.maxMemoryMB) {
                return {
                    reason: 'memory_limit',
                    message: `RSS memory ${stats.memory.rss}MB exceeds limit ${this.options.maxMemoryMB}MB`,
                    stats
                };
            }

            // Check for memory leaks (heap growing consistently)
            if (stats.memory.heapUsed > (this.options.maxMemoryMB * 0.8)) {
                return {
                    reason: 'heap_limit',
                    message: `Heap memory ${stats.memory.heapUsed}MB approaching limit`,
                    stats
                };
            }

            return null;

        } catch (error) {
            console.error('Restart condition check error:', error);
            return null;
        } finally {
            // Restart condition check completed
        }
    }

    /**
     * Check if restart is allowed based on rate limiting
     * @returns {boolean} Whether restart is allowed
     */
    canRestart() {
        try {
            if (!this.options.enableAutoRestart) {
                return false;
            }

            const now = Date.now();
            
            // Clean old restart history outside the window
            this.restartHistory = this.restartHistory.filter(
                timestamp => now - timestamp < this.options.restartWindow
            );

            // Check if we've exceeded max restarts in the window
            if (this.restartHistory.length >= this.options.maxRestarts) {
                console.error(`🚨 Max restarts (${this.options.maxRestarts}) exceeded in ${this.options.restartWindow / 60000}min window`);
                return false;
            }

            return true;

        } catch (error) {
            console.error('Restart check error:', error);
            return false;
        } finally {
            // Restart check completed
        }
    }

    /**
     * Perform graceful restart
     * @param {Object} reason - Restart reason
     */
    async performRestart(reason) {
        try {
            if (!this.canRestart()) {
                console.error('🚨 Restart blocked by rate limiting');
                this.emit('restartBlocked', reason);
                return;
            }

            console.log(`🔄 Performing graceful restart: ${reason.reason}`);
            console.log(`🔄 Reason: ${reason.message}`);

            // Add to restart history
            this.restartHistory.push(Date.now());

            // Emit restart event for cleanup
            this.emit('restart', reason);

            // Give some time for cleanup
            setTimeout(() => {
                console.log('🔄 Restarting process...');
                process.exit(1); // PM2 will restart the process
            }, 2000);

        } catch (error) {
            console.error('Restart error:', error);
        } finally {
            // Restart attempt completed
        }
    }

    /**
     * Start process monitoring
     */
    startMonitoring() {
        try {
            if (this.isMonitoring) {
                return;
            }

            console.log(`🔍 Process monitoring started (${this.options.monitorInterval / 1000}s interval)`);
            console.log(`🔍 Memory limit: ${this.options.maxMemoryMB}MB, Max restarts: ${this.options.maxRestarts}`);

            this.isMonitoring = true;
            
            this.intervalId = setInterval(() => {
                try {
                    const stats = this.getProcessStats();
                    
                    if (stats) {
                        // Emit periodic stats
                        this.emit('processStats', stats);
                        
                        // Check if restart is needed
                        const restartReason = this.checkRestartConditions(stats);
                        if (restartReason) {
                            this.performRestart(restartReason);
                            return; // Exit monitoring as we're restarting
                        }
                    }
                } catch (error) {
                    console.error('Process monitoring error:', error);
                }
            }, this.options.monitorInterval);

            // Log initial stats
            const initialStats = this.getProcessStats();
            if (initialStats) {
                console.log(`🔍 Process started - PID: ${initialStats.pid}, Memory: ${initialStats.memory.rss}MB`);
            }

            // Handle uncaught exceptions
            process.on('uncaughtException', (error) => {
                console.error('🚨 Uncaught Exception:', error);
                this.performRestart({
                    reason: 'uncaught_exception',
                    message: error.message,
                    error
                });
            });

            // Handle unhandled promise rejections
            process.on('unhandledRejection', (reason, promise) => {
                console.error('🚨 Unhandled Promise Rejection:', reason);
                this.performRestart({
                    reason: 'unhandled_rejection',
                    message: String(reason),
                    promise
                });
            });

        } catch (error) {
            console.error('Failed to start process monitoring:', error);
        } finally {
            // Process monitoring startup completed
        }
    }

    /**
     * Stop process monitoring
     */
    stopMonitoring() {
        try {
            if (!this.isMonitoring) {
                return;
            }

            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }

            this.isMonitoring = false;
            console.log('🔍 Process monitoring stopped');

        } catch (error) {
            console.error('Failed to stop process monitoring:', error);
        } finally {
            // Process monitoring stopped
        }
    }

    /**
     * Get process health summary
     * @returns {Object} Process health summary
     */
    getHealthSummary() {
        try {
            const stats = this.getProcessStats();
            
            return {
                stats,
                options: this.options,
                restartHistory: this.restartHistory.map(ts => new Date(ts).toISOString()),
                canRestart: this.canRestart(),
                monitoring: this.isMonitoring,
                startTime: new Date(this.startTime).toISOString()
            };

        } catch (error) {
            console.error('Health summary error:', error);
            return { error: error.message };
        } finally {
            // Health summary generated
        }
    }
}

// Global process monitor instance
let globalProcessMonitor = null;

/**
 * Get or create global process monitor
 * @param {Object} options - Monitor options
 * @returns {ProcessMonitor} Process monitor instance
 */
function getProcessMonitor(options = {}) {
    try {
        if (!globalProcessMonitor) {
            globalProcessMonitor = new ProcessMonitor(options);
            
            // Auto-start monitoring
            globalProcessMonitor.startMonitoring();
            
            // Handle memory pressure from memory monitor
            process.on('memoryPressure', (data) => {
                if (data.type === 'rssCritical' && globalProcessMonitor.options.enableAutoRestart) {
                    console.log('🚨 Memory pressure detected, triggering restart');
                    globalProcessMonitor.performRestart({
                        reason: 'memory_pressure',
                        message: `Memory pressure: ${data.type}`,
                        stats: data.stats
                    });
                }
            });
            
            // Graceful shutdown cleanup
            process.on('SIGTERM', () => {
                console.log('🔍 SIGTERM received, stopping process monitoring');
                if (globalProcessMonitor) {
                    globalProcessMonitor.stopMonitoring();
                }
            });
            
            process.on('SIGINT', () => {
                console.log('🔍 SIGINT received, stopping process monitoring');
                if (globalProcessMonitor) {
                    globalProcessMonitor.stopMonitoring();
                }
            });
        }
        
        return globalProcessMonitor;
        
    } catch (error) {
        console.error('Failed to get process monitor:', error);
        throw error;
    } finally {
        // Process monitor retrieval completed
    }
}

module.exports = {
    ProcessMonitor,
    getProcessMonitor
};