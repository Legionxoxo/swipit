/**
 * @fileoverview Memory monitoring and heap overflow prevention
 * @author Backend Team
 */

const { EventEmitter } = require('events');

/**
 * @typedef {Object} MemoryStats
 * @property {number} rss - Resident Set Size (total memory allocated)
 * @property {number} heapTotal - Total heap size
 * @property {number} heapUsed - Heap memory used
 * @property {number} external - External memory usage
 * @property {number} arrayBuffers - ArrayBuffer memory usage
 * @property {number} timestamp - Timestamp of measurement
 */

/**
 * @typedef {Object} MemoryThresholds
 * @property {number} heapWarning - Heap warning threshold in MB
 * @property {number} heapCritical - Heap critical threshold in MB
 * @property {number} rssWarning - RSS warning threshold in MB
 * @property {number} rssCritical - RSS critical threshold in MB
 */

/**
 * Memory monitoring class to prevent heap overflows
 */
class MemoryMonitor extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Default thresholds for 1GB RAM system
        this.thresholds = {
            heapWarning: options.heapWarning || 200,    // 200MB
            heapCritical: options.heapCritical || 400,  // 400MB
            rssWarning: options.rssWarning || 600,      // 600MB
            rssCritical: options.rssCritical || 800,    // 800MB
            ...options.thresholds
        };
        
        this.monitorInterval = options.monitorInterval || 30000; // 30 seconds
        this.isMonitoring = false;
        this.intervalId = null;
        this.memoryHistory = [];
        this.maxHistorySize = options.maxHistorySize || 100;
        
        // Warning states to prevent spam
        this.warningStates = {
            heapWarning: false,
            heapCritical: false,
            rssWarning: false,
            rssCritical: false
        };
    }

    /**
     * Get current memory usage statistics
     * @returns {MemoryStats} Current memory statistics
     */
    getMemoryStats() {
        try {
            const memUsage = process.memoryUsage();
            
            return {
                rss: Math.round(memUsage.rss / 1024 / 1024), // Convert to MB
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024),
                arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024),
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Memory stats error:', error);
            return null;
        } finally {
            // Memory stats retrieved
        }
    }

    /**
     * Check memory thresholds and emit warnings
     * @param {MemoryStats} stats - Memory statistics
     */
    checkThresholds(stats) {
        try {
            if (!stats) return;

            // Check heap usage
            if (stats.heapUsed >= this.thresholds.heapCritical) {
                if (!this.warningStates.heapCritical) {
                    this.warningStates.heapCritical = true;
                    this.emit('heapCritical', stats);
                    console.error(`🔴 CRITICAL: Heap usage ${stats.heapUsed}MB exceeds ${this.thresholds.heapCritical}MB`);
                }
            } else if (stats.heapUsed >= this.thresholds.heapWarning) {
                if (!this.warningStates.heapWarning) {
                    this.warningStates.heapWarning = true;
                    this.emit('heapWarning', stats);
                    console.warn(`🟡 WARNING: Heap usage ${stats.heapUsed}MB exceeds ${this.thresholds.heapWarning}MB`);
                }
            } else {
                // Reset warning states if usage drops
                this.warningStates.heapWarning = false;
                this.warningStates.heapCritical = false;
            }

            // Check RSS usage
            if (stats.rss >= this.thresholds.rssCritical) {
                if (!this.warningStates.rssCritical) {
                    this.warningStates.rssCritical = true;
                    this.emit('rssCritical', stats);
                    console.error(`🔴 CRITICAL: RSS usage ${stats.rss}MB exceeds ${this.thresholds.rssCritical}MB`);
                }
            } else if (stats.rss >= this.thresholds.rssWarning) {
                if (!this.warningStates.rssWarning) {
                    this.warningStates.rssWarning = true;
                    this.emit('rssWarning', stats);
                    console.warn(`🟡 WARNING: RSS usage ${stats.rss}MB exceeds ${this.thresholds.rssWarning}MB`);
                }
            } else {
                // Reset warning states if usage drops
                this.warningStates.rssWarning = false;
                this.warningStates.rssCritical = false;
            }

        } catch (error) {
            console.error('Threshold check error:', error);
        } finally {
            // Threshold check completed
        }
    }

    /**
     * Start memory monitoring
     */
    startMonitoring() {
        try {
            if (this.isMonitoring) {
                return;
            }

            console.log(`📊 Memory monitoring started (${this.monitorInterval}ms interval)`);
            console.log(`📊 Thresholds - Heap: ${this.thresholds.heapWarning}MB/${this.thresholds.heapCritical}MB, RSS: ${this.thresholds.rssWarning}MB/${this.thresholds.rssCritical}MB`);

            this.isMonitoring = true;
            
            this.intervalId = setInterval(() => {
                try {
                    const stats = this.getMemoryStats();
                    
                    if (stats) {
                        // Add to history
                        this.memoryHistory.push(stats);
                        if (this.memoryHistory.length > this.maxHistorySize) {
                            this.memoryHistory.shift();
                        }
                        
                        // Check thresholds
                        this.checkThresholds(stats);
                        
                        // Emit periodic stats
                        this.emit('memoryStats', stats);
                    }
                } catch (error) {
                    console.error('Memory monitoring error:', error);
                }
            }, this.monitorInterval);

            // Initial memory check
            const initialStats = this.getMemoryStats();
            if (initialStats) {
                console.log(`📊 Initial memory usage - Heap: ${initialStats.heapUsed}MB, RSS: ${initialStats.rss}MB`);
                this.checkThresholds(initialStats);
            }

        } catch (error) {
            console.error('Failed to start memory monitoring:', error);
        } finally {
            // Memory monitoring startup completed
        }
    }

    /**
     * Stop memory monitoring
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
            console.log('📊 Memory monitoring stopped');

        } catch (error) {
            console.error('Failed to stop memory monitoring:', error);
        } finally {
            // Memory monitoring stopped
        }
    }

    /**
     * Force garbage collection if available
     * @returns {boolean} Whether GC was triggered
     */
    forceGarbageCollection() {
        try {
            if (global.gc) {
                console.log('🗑️  Forcing garbage collection...');
                global.gc();
                return true;
            } else {
                console.log('🗑️  Garbage collection not available (run with --expose-gc)');
                return false;
            }
        } catch (error) {
            console.error('Garbage collection error:', error);
            return false;
        } finally {
            // GC attempt completed
        }
    }

    /**
     * Get memory statistics summary
     * @returns {Object} Memory summary
     */
    getMemorySummary() {
        try {
            const current = this.getMemoryStats();
            
            if (this.memoryHistory.length === 0) {
                return { current, history: [] };
            }

            // Calculate averages and trends
            const heapUsages = this.memoryHistory.map(h => h.heapUsed);
            const rssUsages = this.memoryHistory.map(h => h.rss);
            
            const avgHeap = Math.round(heapUsages.reduce((a, b) => a + b, 0) / heapUsages.length);
            const avgRss = Math.round(rssUsages.reduce((a, b) => a + b, 0) / rssUsages.length);
            
            const maxHeap = Math.max(...heapUsages);
            const maxRss = Math.max(...rssUsages);
            
            return {
                current,
                averages: {
                    heap: avgHeap,
                    rss: avgRss
                },
                peaks: {
                    heap: maxHeap,
                    rss: maxRss
                },
                thresholds: this.thresholds,
                warningStates: this.warningStates,
                historySize: this.memoryHistory.length
            };

        } catch (error) {
            console.error('Memory summary error:', error);
            return { error: error.message };
        } finally {
            // Memory summary generated
        }
    }
}

// Global memory monitor instance
let globalMemoryMonitor = null;

/**
 * Get or create global memory monitor
 * @param {Object} options - Monitor options
 * @returns {MemoryMonitor} Memory monitor instance
 */
function getMemoryMonitor(options = {}) {
    try {
        if (!globalMemoryMonitor) {
            globalMemoryMonitor = new MemoryMonitor(options);
            
            // Auto-start monitoring
            globalMemoryMonitor.startMonitoring();
            
            // Handle critical memory situations
            globalMemoryMonitor.on('heapCritical', (stats) => {
                console.error('🚨 HEAP CRITICAL - Forcing garbage collection');
                globalMemoryMonitor.forceGarbageCollection();
                
                // Emit warning for application handling
                process.emit('memoryPressure', {
                    type: 'heapCritical',
                    stats
                });
            });
            
            globalMemoryMonitor.on('rssCritical', (stats) => {
                console.error('🚨 RSS CRITICAL - System memory pressure');
                process.emit('memoryPressure', {
                    type: 'rssCritical',
                    stats
                });
            });
            
            // Graceful shutdown cleanup
            process.on('exit', () => {
                if (globalMemoryMonitor) {
                    globalMemoryMonitor.stopMonitoring();
                }
            });
            
            process.on('SIGTERM', () => {
                if (globalMemoryMonitor) {
                    globalMemoryMonitor.stopMonitoring();
                }
            });
        }
        
        return globalMemoryMonitor;
        
    } catch (error) {
        console.error('Failed to get memory monitor:', error);
        throw error;
    } finally {
        // Memory monitor retrieval completed
    }
}

module.exports = {
    MemoryMonitor,
    getMemoryMonitor
};