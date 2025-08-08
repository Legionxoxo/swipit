/**
 * @fileoverview Python persistent server management utility (updated to prevent memory leaks)
 * @author Backend Team
 */

const { getPythonServer } = require('./pythonServer');

/**
 * @typedef {Object} PythonResult
 * @property {boolean} success - Execution success status
 * @property {Object} data - Parsed result data
 * @property {string} [error] - Error message if failed
 * @property {Array} [progressLogs] - Progress messages during execution
 */

/**
 * Execute Python script with arguments (now uses persistent server)
 * @param {string} scriptName - Python script filename (for compatibility)
 * @param {Array<string>} args - Script arguments
 * @param {Function} [progressCallback] - Progress callback function
 * @returns {Promise<PythonResult>} Execution result
 */
async function executePythonScript(scriptName, args = [], progressCallback = null) {
    try {
        if (!scriptName) {
            throw new Error('Script name is required');
        }

        const pythonServer = await getPythonServer();
        
        // Map script names to actions
        let action = 'unknown';
        let params = {};
        
        if (scriptName === 'instagram_scraper.py') {
            action = 'instagram_scraper';
            // Parse args for Instagram scraper
            for (let i = 0; i < args.length; i += 2) {
                const key = args[i];
                const value = args[i + 1];
                
                if (key === '--username') {
                    params.username = value;
                } else if (key === '--analysis-id') {
                    params.analysisId = value;
                } else if (key === '--extension-cookies') {
                    try {
                        params.extensionCookies = JSON.parse(value);
                    } catch (e) {
                        params.extensionCookies = value;
                    }
                }
            }
        } else if (scriptName === 'instagram_oembed.py') {
            action = 'instagram_oembed';
            params.postUrl = args[0]; // First argument is the URL
        } else if (scriptName === 'test_environment.py') {
            action = 'test_environment';
        }
        
        const response = await pythonServer.sendRequest(action, params, progressCallback);
        
        return {
            success: response.success,
            data: response.data,
            progressLogs: response.progressLogs || []
        };
        
    } catch (error) {
        console.error('Python executor error:', error);
        throw new Error(`Failed to execute Python script: ${error.message}`);
    } finally {
        console.log(`Python script execution completed: ${scriptName}`);
    }
}

/**
 * Execute Instagram scraper with progress tracking
 * @param {string} username - Instagram username
 * @param {string} analysisId - Analysis ID for tracking
 * @param {Function} [progressCallback] - Progress callback function
 * @param {Array} [extensionCookies] - Extension cookies for authentication
 * @returns {Promise<PythonResult>} Scraping result
 */
async function executeInstagramScraper(username, analysisId, progressCallback = null, extensionCookies = null) {
    try {
        const pythonServer = await getPythonServer();
        return await pythonServer.executeInstagramScraper(username, analysisId, progressCallback, extensionCookies);
    } catch (error) {
        console.error('Instagram scraper execution error:', error);
        throw new Error(`Failed to execute Instagram scraper: ${error.message}`);
    } finally {
        console.log(`Instagram scraper execution completed for: ${username}`);
    }
}

/**
 * Test Python environment and dependencies
 * @returns {Promise<boolean>} Test result
 */
async function testPythonEnvironment() {
    try {
        const pythonServer = await getPythonServer();
        return await pythonServer.testEnvironment();
    } catch (error) {
        console.error('Python environment test error:', error);
        return false;
    } finally {
        console.log('Python environment test completed');
    }
}

module.exports = {
    executePythonScript,
    executeInstagramScraper,
    testPythonEnvironment
};