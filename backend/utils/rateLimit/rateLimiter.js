/**
 * @fileoverview Adaptive rate limiter for API requests
 * @author Backend Team
 */

/**
 * @typedef {Object} RateLimiterOptions
 * @property {number} [initialRate=1] - Initial requests per second
 * @property {number} [minRate=0.5] - Minimum requests per second
 * @property {number} [maxRate=10] - Maximum requests per second
 * @property {number} [backoffMultiplier=2] - Exponential backoff multiplier
 * @property {number} [recoveryRate=1.2] - Rate recovery multiplier after success
 * @property {number} [maxRetries=3] - Maximum retry attempts
 */

/**
 * @typedef {Object} RateLimiterStats
 * @property {number} totalRequests - Total requests made
 * @property {number} successfulRequests - Successful requests
 * @property {number} failedRequests - Failed requests
 * @property {number} currentRate - Current requests per second
 * @property {number} averageResponseTime - Average response time in ms
 * @property {number} queueLength - Current queue length
 * @property {boolean} circuitBreakerOpen - Circuit breaker status
 */

class AdaptiveRateLimiter {
    /**
     * Create an adaptive rate limiter
     * @param {RateLimiterOptions} options - Rate limiter options
     */
    constructor(options = {}) {
        this.currentRate = options.initialRate || 1;
        this.minRate = options.minRate || 0.5;
        this.maxRate = options.maxRate || 10;
        this.backoffMultiplier = options.backoffMultiplier || 2;
        this.recoveryRate = options.recoveryRate || 1.2;
        this.maxRetries = options.maxRetries || 3;
        
        this.lastRequestTime = 0;
        this.queue = [];
        this.processing = false;
        
        // Statistics
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            responseTimes: []
        };
        
        // Circuit breaker
        this.consecutiveFailures = 0;
        this.circuitBreakerThreshold = 5;
        this.circuitBreakerCooldown = 30000; // 30 seconds
        this.circuitBreakerOpenedAt = null;
    }
    
    /**
     * Calculate delay between requests based on current rate
     * @returns {number} Delay in milliseconds
     */
    getDelay() {
        return Math.floor(1000 / this.currentRate);
    }
    
    /**
     * Check if circuit breaker is open
     * @returns {boolean} True if circuit is open
     */
    isCircuitOpen() {
        if (this.circuitBreakerOpenedAt) {
            const elapsed = Date.now() - this.circuitBreakerOpenedAt;
            if (elapsed < this.circuitBreakerCooldown) {
                return true;
            }
            // Reset circuit breaker
            this.circuitBreakerOpenedAt = null;
            this.consecutiveFailures = 0;
        }
        return false;
    }
    
    /**
     * Adjust rate based on response
     * @param {boolean} success - Whether request was successful
     * @param {number} responseTime - Response time in ms
     */
    adjustRate(success, responseTime) {
        if (success) {
            this.consecutiveFailures = 0;
            
            // If response was fast, increase rate
            if (responseTime < 500 && this.currentRate < this.maxRate) {
                this.currentRate = Math.min(this.currentRate * this.recoveryRate, this.maxRate);
            }
            
            this.stats.successfulRequests++;
        } else {
            this.consecutiveFailures++;
            
            // Decrease rate on failure
            this.currentRate = Math.max(this.currentRate / this.backoffMultiplier, this.minRate);
            
            // Open circuit breaker if too many consecutive failures
            if (this.consecutiveFailures >= this.circuitBreakerThreshold) {
                this.circuitBreakerOpenedAt = Date.now();
                console.log(`Circuit breaker opened due to ${this.consecutiveFailures} consecutive failures`);
            }
            
            this.stats.failedRequests++;
        }
        
        // Update statistics
        this.stats.totalRequests++;
        if (responseTime) {
            this.stats.responseTimes.push(responseTime);
            // Keep only last 100 response times
            if (this.stats.responseTimes.length > 100) {
                this.stats.responseTimes.shift();
            }
        }
    }
    
    /**
     * Execute a function with rate limiting
     * @param {Function} fn - Async function to execute
     * @param {number} [retryCount=0] - Current retry count
     * @returns {Promise<any>} Function result
     */
    async execute(fn, retryCount = 0) {
        return new Promise((resolve, reject) => {
            this.queue.push({ fn, resolve, reject, retryCount });
            this.processQueue();
        });
    }
    
    /**
     * Process queued requests
     */
    async processQueue() {
        if (this.processing || this.queue.length === 0) {
            return;
        }
        
        this.processing = true;
        
        while (this.queue.length > 0) {
            // Check circuit breaker
            if (this.isCircuitOpen()) {
                await this.sleep(1000);
                continue;
            }
            
            const { fn, resolve, reject, retryCount } = this.queue.shift();
            
            // Calculate delay
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;
            const requiredDelay = this.getDelay();
            
            if (timeSinceLastRequest < requiredDelay) {
                await this.sleep(requiredDelay - timeSinceLastRequest);
            }
            
            this.lastRequestTime = Date.now();
            const startTime = Date.now();
            
            try {
                const result = await fn();
                const responseTime = Date.now() - startTime;
                
                this.adjustRate(true, responseTime);
                resolve(result);
                
            } catch (error) {
                const responseTime = Date.now() - startTime;
                this.adjustRate(false, responseTime);
                
                // Check if we should retry
                if (this.shouldRetry(error) && retryCount < this.maxRetries) {
                    console.log(`Retrying request (attempt ${retryCount + 1}/${this.maxRetries})`);
                    
                    // Re-queue with increased retry count
                    this.queue.unshift({ 
                        fn, 
                        resolve, 
                        reject, 
                        retryCount: retryCount + 1 
                    });
                    
                    // Add exponential backoff delay for retry
                    await this.sleep(Math.pow(2, retryCount) * 1000);
                } else {
                    reject(error);
                }
            }
        }
        
        this.processing = false;
    }
    
    /**
     * Check if error is retryable
     * @param {any} error - Error object
     * @returns {boolean} True if should retry
     */
    shouldRetry(error) {
        // Retry on network errors or rate limit errors
        const retryableErrors = [
            'ECONNRESET',
            'ETIMEDOUT',
            'ENOTFOUND',
            'ECONNREFUSED'
        ];
        
        if (error && error.code && retryableErrors.includes(error.code)) {
            return true;
        }
        
        // Retry on 429 (Too Many Requests) or 503 (Service Unavailable)
        if (error && error.response && [429, 503].includes(error.response.status)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Sleep for specified milliseconds
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Get current statistics
     * @returns {RateLimiterStats} Current statistics
     */
    getStats() {
        const avgResponseTime = this.stats.responseTimes.length > 0
            ? this.stats.responseTimes.reduce((a, b) => a + b, 0) / this.stats.responseTimes.length
            : 0;
        
        return {
            totalRequests: this.stats.totalRequests,
            successfulRequests: this.stats.successfulRequests,
            failedRequests: this.stats.failedRequests,
            currentRate: this.currentRate,
            averageResponseTime: Math.round(avgResponseTime),
            queueLength: this.queue.length,
            circuitBreakerOpen: this.isCircuitOpen()
        };
    }
    
    /**
     * Reset rate limiter
     */
    reset() {
        this.currentRate = 1;
        this.lastRequestTime = 0;
        this.queue = [];
        this.processing = false;
        this.consecutiveFailures = 0;
        this.circuitBreakerOpenedAt = null;
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            responseTimes: []
        };
    }
}

module.exports = AdaptiveRateLimiter;