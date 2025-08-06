/**
 * @fileoverview Extension API routes for cookie sharing functionality
 * @author Backend Team
 */

const express = require('express');
const router = express.Router();

// In-memory session storage for POC
const sessionStorage = new Map();

// Session cleanup interval (every hour)
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessionStorage.entries()) {
    if (now > session.expiresAt) {
      console.log(`🧹 Cleaning up expired session: ${sessionId}`);
      sessionStorage.delete(sessionId);
    }
  }
}, 60 * 60 * 1000); // 1 hour

// Simple rate limiting for extension API
const extensionRateLimit = new Map();
const EXTENSION_RATE_LIMIT = 10; // requests per minute
const EXTENSION_WINDOW = 60 * 1000; // 1 minute

function checkExtensionRateLimit(req, res, next) {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  
  if (!extensionRateLimit.has(clientId)) {
    extensionRateLimit.set(clientId, { count: 1, resetTime: now + EXTENSION_WINDOW });
    return next();
  }
  
  const clientData = extensionRateLimit.get(clientId);
  
  if (now > clientData.resetTime) {
    // Reset window
    clientData.count = 1;
    clientData.resetTime = now + EXTENSION_WINDOW;
    return next();
  }
  
  if (clientData.count >= EXTENSION_RATE_LIMIT) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }
  
  clientData.count++;
  next();
}

/**
 * Store cookies from extension with user consent
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.post('/cookies', checkExtensionRateLimit, (req, res) => {
  try {
    const { sessionId, platform, cookies, timestamp, userAgent } = req.body;

    if (!sessionId || !platform || !cookies) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, platform, cookies' 
      });
    }

    // Validate platform
    if (!['youtube', 'instagram'].includes(platform)) {
      return res.status(400).json({ 
        error: 'Invalid platform. Supported: youtube, instagram' 
      });
    }

    // Store session with 24-hour expiration
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    const session = {
      sessionId,
      platform,
      cookies,
      timestamp,
      userAgent,
      createdAt: Date.now(),
      expiresAt,
      lastUsed: Date.now()
    };

    sessionStorage.set(sessionId, session);
    
    console.log(`🍪 Stored ${platform} cookies for session ${sessionId} (expires: ${new Date(expiresAt).toISOString()})`);
    console.log(`📊 Active sessions: ${sessionStorage.size}`);

    res.json({
      success: true,
      sessionId,
      platform,
      cookieCount: cookies.length,
      expiresAt: new Date(expiresAt).toISOString()
    });

  } catch (error) {
    console.error('❌ Extension cookie storage error:', error);
    res.status(500).json({ error: 'Failed to store cookies' });
  } finally {
    console.log(`Extension cookie storage accessed at ${new Date().toISOString()}`);
  }
});

/**
 * Revoke session and delete cookies
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.post('/revoke', checkExtensionRateLimit, (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    const deleted = sessionStorage.delete(sessionId);
    
    if (deleted) {
      console.log(`🗑️ Revoked session: ${sessionId}`);
      res.json({ success: true, message: 'Session revoked successfully' });
    } else {
      res.status(404).json({ error: 'Session not found' });
    }

  } catch (error) {
    console.error('❌ Extension revoke error:', error);
    res.status(500).json({ error: 'Failed to revoke session' });
  } finally {
    console.log(`Extension revoke accessed at ${new Date().toISOString()}`);
  }
});

/**
 * Get extension status and active sessions
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 */
router.get('/status', checkExtensionRateLimit, (req, res) => {
  try {
    const activeSessions = [];
    const now = Date.now();

    for (const [sessionId, session] of sessionStorage.entries()) {
      if (now < session.expiresAt) {
        activeSessions.push({
          sessionId,
          platform: session.platform,
          createdAt: new Date(session.createdAt).toISOString(),
          expiresAt: new Date(session.expiresAt).toISOString(),
          lastUsed: new Date(session.lastUsed).toISOString()
        });
      }
    }

    res.json({
      totalActiveSessions: activeSessions.length,
      sessions: activeSessions
    });

  } catch (error) {
    console.error('❌ Extension status error:', error);
    res.status(500).json({ error: 'Failed to get extension status' });
  } finally {
    console.log(`Extension status accessed at ${new Date().toISOString()}`);
  }
});

/**
 * Helper function to get session cookies for a platform
 * @param {string} sessionId - Session ID
 * @param {string} platform - Platform name
 * @returns {Array|null} Cookies array or null if not found
 */
function getSessionCookies(sessionId, platform) {
  const session = sessionStorage.get(sessionId);
  
  if (!session) {
    return null;
  }

  if (Date.now() > session.expiresAt) {
    sessionStorage.delete(sessionId);
    return null;
  }

  if (session.platform !== platform) {
    return null;
  }

  // Update last used timestamp
  session.lastUsed = Date.now();
  sessionStorage.set(sessionId, session);

  return session.cookies;
}

// Export the session storage and helper function for use in other routes
module.exports = { router, sessionStorage, getSessionCookies };