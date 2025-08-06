/**
 * Example: How to use Instagram cookies from Chrome Extension
 * This demonstrates how your backend can access cookies shared by the Chrome extension
 */

const { getSessionCookies } = require('../routes/api/extension.js');
const { spawn } = require('child_process');
const path = require('path');

/**
 * Get Instagram cookies from extension session
 * @param {string} sessionId - Session ID from Chrome extension
 * @returns {Array|null} Instagram cookies or null if not found
 */
function getInstagramCookiesFromExtension(sessionId) {
    try {
        const cookies = getSessionCookies(sessionId, 'instagram');
        
        if (!cookies) {
            console.log('❌ No Instagram cookies found for session:', sessionId);
            return null;
        }
        
        console.log(`✅ Found ${cookies.length} Instagram cookies for session:`, sessionId);
        return cookies;
        
    } catch (error) {
        console.error('❌ Error getting Instagram cookies:', error);
        return null;
    } finally {
        // No cleanup needed
    }
}

/**
 * Use Instagram cookies with instaloader Python script
 * @param {string} username - Instagram username to scrape
 * @param {string} sessionId - Chrome extension session ID  
 * @param {string} analysisId - Analysis ID for tracking
 * @returns {Promise} Python script execution result
 */
function analyzeInstagramWithExtensionCookies(username, sessionId, analysisId) {
    return new Promise((resolve, reject) => {
        try {
            // Get cookies from extension session
            const cookies = getInstagramCookiesFromExtension(sessionId);
            
            if (!cookies) {
                return reject(new Error('No Instagram cookies available from extension'));
            }
            
            // Prepare Python script arguments
            const pythonScript = path.join(__dirname, '../functions/scripts/instagram_scraper.py');
            const args = [
                '--username', username,
                '--analysis-id', analysisId,
                '--extension-cookies', JSON.stringify(cookies)
            ];
            
            console.log(`🚀 Starting Instagram analysis for @${username} with extension cookies`);
            
            // Execute Python script with cookies
            const pythonProcess = spawn('python3', [pythonScript, ...args], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: path.dirname(pythonScript)
            });
            
            let outputData = '';
            let errorData = '';
            
            // Collect stdout data
            pythonProcess.stdout.on('data', (data) => {
                outputData += data.toString();
            });
            
            // Collect stderr data  
            pythonProcess.stderr.on('data', (data) => {
                errorData += data.toString();
            });
            
            // Handle process completion
            pythonProcess.on('close', (code) => {
                try {
                    if (code === 0) {
                        // Parse final result from last line of output
                        const lines = outputData.trim().split('\n');
                        const resultLine = lines[lines.length - 1];
                        const result = JSON.parse(resultLine);
                        
                        console.log(`✅ Instagram analysis completed for @${username}`);
                        resolve(result);
                    } else {
                        console.error(`❌ Python script failed with code ${code}`);
                        console.error('Error output:', errorData);
                        reject(new Error(`Instagram scraping failed: ${errorData}`));
                    }
                } catch (parseError) {
                    console.error('❌ Failed to parse Python script output:', parseError);
                    reject(new Error('Failed to parse scraping results'));
                } finally {
                    // Cleanup handled by process completion
                }
            });
            
            // Handle process errors
            pythonProcess.on('error', (error) => {
                console.error('❌ Failed to start Python script:', error);
                reject(error);
            });
            
        } catch (error) {
            console.error('❌ Error setting up Instagram analysis:', error);
            reject(error);
        } finally {
            // Initial setup cleanup if needed
        }
    });
}

/**
 * Example API endpoint using extension cookies
 */
async function exampleApiHandler(req, res) {
    try {
        const { username, sessionId } = req.body;
        
        if (!username || !sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: username, sessionId'
            });
        }
        
        // Generate analysis ID
        const analysisId = `instagram_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Start analysis with extension cookies
        const result = await analyzeInstagramWithExtensionCookies(username, sessionId, analysisId);
        
        return res.json({
            success: true,
            analysisId,
            result,
            message: `Successfully analyzed @${username} using extension cookies`
        });
        
    } catch (error) {
        console.error('❌ API handler error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        console.log(`API request processed at ${new Date().toISOString()}`);
    }
}

// Export functions for use in your routes
module.exports = {
    getInstagramCookiesFromExtension,
    analyzeInstagramWithExtensionCookies,
    exampleApiHandler
};