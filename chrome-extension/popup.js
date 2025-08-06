class PopupManager {
  constructor() {
    this.consentStatus = null;
    this.init();
  }

  async init() {
    try {
      await this.loadConsentStatus();
      this.setupEventListeners();
      this.updateUI();
      this.hideLoading();
    } catch (error) {
      this.showError('Failed to load extension: ' + error.message);
    }
  }

  async loadConsentStatus() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'getConsentStatus' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response.error) {
          reject(new Error(response.error));
        } else {
          this.consentStatus = response;
          resolve(response);
        }
      });
    });
  }

  setupEventListeners() {
    document.getElementById('grant-btn').addEventListener('click', () => {
      this.handleGrantConsent();
    });

    document.getElementById('revoke-btn').addEventListener('click', () => {
      this.handleRevokeConsent();
    });

    document.getElementById('refresh-youtube').addEventListener('click', () => {
      this.handleRefreshCookies('youtube');
    });

    document.getElementById('refresh-instagram').addEventListener('click', () => {
      this.handleRefreshCookies('instagram');
    });

    // Handle checkbox changes
    ['youtube', 'instagram'].forEach(platform => {
      document.getElementById(platform).addEventListener('change', () => {
        this.updateGrantButton();
      });
    });
  }

  updateUI() {
    const statusDiv = document.getElementById('status');
    const statusText = document.getElementById('status-text');
    const expiresInfo = document.getElementById('expires-info');
    const grantBtn = document.getElementById('grant-btn');
    const revokeBtn = document.getElementById('revoke-btn');
    const manualActions = document.getElementById('manual-actions');

    if (this.consentStatus.granted) {
      statusDiv.className = 'status granted';
      statusText.textContent = '✅ Cookie sharing is active';
      
      // Show expiration info
      if (this.consentStatus.expiresAt) {
        const expiresAt = new Date(this.consentStatus.expiresAt);
        const now = new Date();
        const hoursLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60));
        expiresInfo.textContent = `Expires in ${hoursLeft} hours (${expiresAt.toLocaleString()})`;
      }
      
      grantBtn.style.display = 'none';
      revokeBtn.style.display = 'block';
      manualActions.style.display = 'flex';

      // Update platform checkboxes and status
      this.consentStatus.platforms.forEach(platform => {
        const checkbox = document.getElementById(platform);
        const status = document.getElementById(platform + '-status');
        if (checkbox && status) {
          checkbox.checked = true;
          checkbox.disabled = true;
          status.textContent = 'Active';
          status.className = 'platform-status active';
        }
      });

      // Disable unchecked platforms
      ['youtube', 'instagram'].forEach(platform => {
        if (!this.consentStatus.platforms.includes(platform)) {
          const checkbox = document.getElementById(platform);
          const status = document.getElementById(platform + '-status');
          if (checkbox && status) {
            checkbox.checked = false;
            checkbox.disabled = true;
            status.textContent = 'Inactive';
            status.className = 'platform-status inactive';
          }
        }
      });

    } else {
      statusDiv.className = 'status not-granted';
      statusText.textContent = '⚠️ Cookie sharing is disabled';
      expiresInfo.textContent = '';
      
      grantBtn.style.display = 'block';
      revokeBtn.style.display = 'none';
      manualActions.style.display = 'none';

      // Enable all checkboxes
      ['youtube', 'instagram'].forEach(platform => {
        const checkbox = document.getElementById(platform);
        const status = document.getElementById(platform + '-status');
        if (checkbox && status) {
          checkbox.checked = false;
          checkbox.disabled = false;
          status.textContent = 'Available';
          status.className = 'platform-status inactive';
        }
      });
    }

    this.updateGrantButton();
  }

  updateGrantButton() {
    const grantBtn = document.getElementById('grant-btn');
    const selectedPlatforms = this.getSelectedPlatforms();
    
    if (this.consentStatus.granted) {
      grantBtn.disabled = true;
    } else {
      grantBtn.disabled = selectedPlatforms.length === 0;
      grantBtn.textContent = selectedPlatforms.length > 0 
        ? `Enable for ${selectedPlatforms.join(' & ')}` 
        : 'Select platforms first';
    }
  }

  getSelectedPlatforms() {
    const platforms = [];
    ['youtube', 'instagram'].forEach(platform => {
      const checkbox = document.getElementById(platform);
      if (checkbox && checkbox.checked && !checkbox.disabled) {
        platforms.push(platform);
      }
    });
    return platforms;
  }

  async handleGrantConsent() {
    const selectedPlatforms = this.getSelectedPlatforms();
    
    if (selectedPlatforms.length === 0) {
      this.showError('Please select at least one platform');
      return;
    }

    this.showLoading('Enabling cookie sharing...');

    try {
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ 
          action: 'grantConsent', 
          platforms: selectedPlatforms 
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });

      await this.loadConsentStatus();
      this.updateUI();
      this.hideError();
      this.hideLoading();
      
    } catch (error) {
      this.showError('Failed to enable cookie sharing: ' + error.message);
      this.hideLoading();
    }
  }

  async handleRevokeConsent() {
    this.showLoading('Disabling cookie sharing...');

    try {
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'revokeConsent' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });

      await this.loadConsentStatus();
      this.updateUI();
      this.hideError();
      this.hideLoading();
      
    } catch (error) {
      this.showError('Failed to revoke consent: ' + error.message);
      this.hideLoading();
    }
  }

  async handleRefreshCookies(platform) {
    if (!this.consentStatus.platforms.includes(platform)) {
      this.showError(`${platform} is not enabled for cookie sharing`);
      return;
    }

    const button = document.getElementById(`refresh-${platform}`);
    const originalText = button.textContent;
    button.textContent = 'Refreshing...';
    button.disabled = true;

    try {
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ 
          action: 'shareCookies', 
          platform 
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });

      this.hideError();
      
      // Briefly show success
      button.textContent = '✓ Updated';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 1500);
      
    } catch (error) {
      this.showError(`Failed to refresh ${platform} cookies: ` + error.message);
      button.textContent = originalText;
      button.disabled = false;
    }
  }

  showLoading(message = 'Loading...') {
    document.getElementById('loading').textContent = message;
    document.getElementById('loading').style.display = 'block';
    document.getElementById('content').style.display = 'none';
  }

  hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
  }

  showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }

  hideError() {
    document.getElementById('error').style.display = 'none';
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});