// Content script for YouTube Downloader Assistant
// This script runs on localhost:3001 to facilitate communication between the web app and extension

console.log('🔗 YouTube Downloader Assistant content script loaded');
console.log('🌐 Current URL:', window.location.href);
console.log('🏷️ Extension ID:', chrome.runtime.id);

// Listen for messages from the web application
window.addEventListener('message', async (event) => {
  // Only accept messages from our domain
  if (event.origin !== 'http://localhost:3000') {
    return;
  }

  if (event.data.type === 'YOUTUBE_DOWNLOADER_EXTENSION_CHECK' && event.data.source === 'webapp') {
    console.log('📨 Received extension check request from web app');
    console.log('📋 Event data:', event.data);
    
    try {
      // Get consent status from background script
      console.log('🔄 Sending message to background script...');
      
      // Check if runtime is available
      if (!chrome.runtime || !chrome.runtime.sendMessage) {
        throw new Error('Chrome runtime not available');
      }
      
      // Wrap in try-catch to handle extension context issues
      let response;
      try {
        response = await chrome.runtime.sendMessage({ action: 'getConsentStatus' });
        console.log('📬 Response from background script:', response);
      } catch (runtimeError) {
        if (runtimeError.message.includes('Extension context invalidated') || 
            runtimeError.message.includes('message port closed')) {
          console.log('🔄 Extension context invalidated, responding with fallback');
          // Send fallback response indicating extension needs to be reloaded
          window.postMessage({
            type: 'YOUTUBE_DOWNLOADER_EXTENSION_RESPONSE',
            available: false,
            reason: 'context_invalidated',
            message: 'Extension needs to be reloaded'
          }, '*');
          return;
        }
        throw runtimeError;
      }
      
      if (response && response.granted && response.sessionId) {
        // Extension is available and has active consent
        window.postMessage({
          type: 'YOUTUBE_DOWNLOADER_EXTENSION_RESPONSE',
          available: true,
          sessionId: response.sessionId,
          platforms: response.platforms,
          expiresAt: response.expiresAt
        }, '*');
        
        console.log('✅ Responded to web app - extension available with session:', response.sessionId);
      } else {
        // Extension available but no consent
        window.postMessage({
          type: 'YOUTUBE_DOWNLOADER_EXTENSION_RESPONSE',
          available: false,
          reason: response ? 'no_consent' : 'communication_error'
        }, '*');
        
        console.log('❌ Responded to web app - extension not available (no consent)');
      }
    } catch (error) {
      console.error('❌ Error communicating with background script:', error);
      window.postMessage({
        type: 'YOUTUBE_DOWNLOADER_EXTENSION_RESPONSE',
        available: false,
        reason: 'error',
        error: error.message
      }, '*');
    }
  }
});

// Inject a marker element to help web app detect extension presence
const marker = document.createElement('div');
marker.id = 'youtube-downloader-extension-available';
marker.style.display = 'none';
document.documentElement.appendChild(marker);

console.log('🎯 Extension marker injected and message listener active');