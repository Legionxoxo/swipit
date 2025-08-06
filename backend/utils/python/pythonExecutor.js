/**
 * @fileoverview Python child process management utility
 * @author Backend Team
 */

const { spawn } = require('child_process');
const path = require('path');

/**
 * @typedef {Object} PythonResult
 * @property {boolean} success - Execution success status
 * @property {Object} data - Parsed result data
 * @property {string} [error] - Error message if failed
 * @property {Array} [progressLogs] - Progress messages during execution
 */

/**
 * Execute Python script with arguments
 * @param {string} scriptName - Python script filename
 * @param {Array<string>} args - Script arguments
 * @param {Function} [progressCallback] - Progress callback function
 * @returns {Promise<PythonResult>} Execution result
 */
async function executePythonScript(scriptName, args = [], progressCallback = null) {
    return new Promise((resolve, reject) => {
        try {
            if (!scriptName) {
                throw new Error('Script name is required');
            }

            const scriptPath = path.join(__dirname, '../../functions/scripts', scriptName);
            const progressLogs = [];
            let finalResult = null;
            let dataBuffer = '';
            let errorBuffer = '';

            // Spawn Python process
            const pythonProcess = spawn('python3', [scriptPath, ...args]);

            // Handle stdout data
            pythonProcess.stdout.on('data', (data) => {
                try {
                    const dataString = data.toString();
                    dataBuffer += dataString;

                    // Try to parse each line as JSON (for progress messages)
                    const lines = dataString.split('\n').filter(line => line.trim());
                    
                    for (const line of lines) {
                        try {
                            const parsed = JSON.parse(line);
                            
                            if (parsed.type === 'progress') {
                                progressLogs.push({
                                    message: parsed.message,
                                    progress: parsed.progress,
                                    timestamp: parsed.timestamp
                                });
                                
                                // Call progress callback if provided
                                if (progressCallback && typeof progressCallback === 'function') {
                                    progressCallback({
                                        message: parsed.message,
                                        progress: parsed.progress
                                    });
                                }
                            } else if (parsed.type === 'error') {
                                progressLogs.push({
                                    type: 'error',
                                    message: parsed.message,
                                    details: parsed.details,
                                    timestamp: parsed.timestamp
                                });
                            } else if (!parsed.type && parsed.success !== undefined) {
                                // This is the final result (has success property but no type)
                                finalResult = parsed;
                            }
                        } catch (parseError) {
                            // Not JSON, might be final result or other output
                            continue;
                        }
                    }

                } catch (error) {
                    console.error('Python stdout processing error:', error);
                } finally {
                    console.log('Python stdout data received');
                }
            });

            // Handle stderr data
            pythonProcess.stderr.on('data', (data) => {
                try {
                    errorBuffer += data.toString();
                } catch (error) {
                    console.error('Python stderr processing error:', error);
                } finally {
                    console.log('Python stderr data received');
                }
            });

            // Handle process close
            pythonProcess.on('close', (code) => {
                try {
                    if (code === 0) {
                        // Success - try to parse final result
                        if (finalResult) {
                            resolve({
                                success: finalResult.success || true,
                                data: finalResult,
                                progressLogs: progressLogs
                            });
                        } else {
                            // Try to parse last line of buffer as result
                            const lines = dataBuffer.split('\n').filter(line => line.trim());
                            const lastLine = lines[lines.length - 1];
                            
                            try {
                                const result = JSON.parse(lastLine);
                                resolve({
                                    success: result.success || true,
                                    data: result,
                                    progressLogs: progressLogs
                                });
                            } catch (parseError) {
                                reject(new Error(`Failed to parse Python result: ${parseError.message}`));
                            }
                        }
                    } else {
                        // Process failed
                        reject(new Error(`Python script failed with exit code ${code}: ${errorBuffer || 'Unknown error'}`));
                    }

                } catch (error) {
                    console.error('Python process close handling error:', error);
                    reject(new Error(`Process close handling failed: ${error.message}`));
                } finally {
                    console.log(`Python process closed with code: ${code}`);
                }
            });

            // Handle process error
            pythonProcess.on('error', (error) => {
                try {
                    reject(new Error(`Failed to start Python process: ${error.message}`));
                } catch (handlingError) {
                    console.error('Python process error handling failed:', handlingError);
                    reject(new Error('Python process error handling failed'));
                } finally {
                    console.log('Python process error occurred');
                }
            });

            // Set process timeout (10 minutes max)
            const timeout = setTimeout(() => {
                try {
                    pythonProcess.kill('SIGTERM');
                    reject(new Error('Python script execution timeout (10 minutes)'));
                } catch (error) {
                    console.error('Python process timeout handling error:', error);
                } finally {
                    console.log('Python process timeout occurred');
                }
            }, 10 * 60 * 1000);

            // Clear timeout on process close
            pythonProcess.on('close', () => {
                clearTimeout(timeout);
            });

        } catch (error) {
            console.error('Python executor error:', error);
            reject(new Error(`Failed to execute Python script: ${error.message}`));
        } finally {
            console.log(`Python script execution started: ${scriptName}`);
        }
    });
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
        if (!username) {
            throw new Error('Username is required');
        }

        if (!analysisId) {
            throw new Error('Analysis ID is required');
        }

        // Clean username (remove @ if present)
        const cleanUsername = username.replace('@', '').trim();

        const args = [
            '--username', cleanUsername,
            '--analysis-id', analysisId
        ];

        // Add extension cookies if provided
        if (extensionCookies && Array.isArray(extensionCookies)) {
            args.push('--extension-cookies', JSON.stringify(extensionCookies));
        }

        return await executePythonScript('instagram_scraper.py', args, progressCallback);

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
        const testResult = await executePythonScript('test_environment.py', ['--test'], null);
        return testResult.success;
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