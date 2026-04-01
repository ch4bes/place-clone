/**
 * UI Module
 * Handles user interface components and interactions
 */

const UI = {
  selectedColor: null,
  selectedColorIndex: null,
  isCooldownActive: false,
  cooldownEndTime: 0,
  username: 'Anonymous',
  sessionPixels: 0,

  // Initialize UI
  init() {
    this.setupPalette();
    this.setupUsernameInput();
    this.setupZoomControls();
    this.setupActivityFeed();
    this.startCooldownTimer();
    this.loadUsername();
  },

  // Set up color palette
  setupPalette() {
    const paletteContainer = document.getElementById('palette');
    paletteContainer.innerHTML = '';

    PALETTE.forEach((color, index) => {
      const swatch = document.createElement('div');
      swatch.className = 'palette-swatch';
      swatch.style.backgroundColor = color;
      swatch.dataset.index = index;
      swatch.title = `Color ${index}`;
      
      swatch.addEventListener('click', () => this.selectColor(index));
      swatch.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.selectColor(index);
      });
      
      paletteContainer.appendChild(swatch);
    });

    // Select first color by default
    this.selectColor(0);
  },

  // Select color
  selectColor(index) {
    this.selectedColorIndex = index;
    this.selectedColor = PALETTE[index];
    
    // Update UI
    document.querySelectorAll('.palette-swatch').forEach((swatch, i) => {
      swatch.classList.toggle('selected', i === index);
    });
    
    document.getElementById('selected-color-preview').style.backgroundColor = this.selectedColor;
    
    // Track behavior
    if (BehaviorTracker.isTracking) {
      BehaviorTracker.recordColorChange();
    }
  },

  // Set up username input
  setupUsernameInput() {
    const input = document.getElementById('username-input');
    const display = document.getElementById('username-display');
    const editBtn = document.getElementById('edit-username-btn');

    // Load saved username
    const savedUsername = localStorage.getItem('place_username');
    if (savedUsername) {
      this.setUsername(savedUsername);
    }

    // Handle input change
    input.addEventListener('change', () => {
      const value = input.value.trim();
      if (value.length >= 3) {
        this.setUsername(value);
        input.style.display = 'none';
        display.style.display = 'inline';
      }
    });

    // Handle edit button
    editBtn.addEventListener('click', () => {
      input.style.display = 'inline';
      display.style.display = 'none';
      input.focus();
    });

    // Hide on blur (after delay)
    input.addEventListener('blur', () => {
      setTimeout(() => {
        if (input.value.trim().length >= 3) {
          input.style.display = 'none';
          display.style.display = 'inline';
        }
      }, 200);
    });
  },

  // Set username
  setUsername(name) {
    this.username = name;
    localStorage.setItem('place_username', name);
    document.getElementById('username-display').textContent = name;
    document.getElementById('username-input').value = name;
  },

  // Load username from storage
  loadUsername() {
    const saved = localStorage.getItem('place_username');
    if (saved) {
      this.setUsername(saved);
    } else {
      // Generate random username
      const randomName = 'Anon' + Math.floor(Math.random() * 10000);
      this.setUsername(randomName);
    }
  },

  // Set up zoom controls
  setupZoomControls() {
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomResetBtn = document.getElementById('zoom-reset-btn');
    
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        CanvasRenderer.zoomIn();
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        CanvasRenderer.zoomOut();
      });
    }

    if (zoomResetBtn) {
      zoomResetBtn.addEventListener('click', () => {
        CanvasRenderer.resetZoom();
      });
    }
  },

  // Set up activity feed
  setupActivityFeed() {
    const toggleBtn = document.getElementById('toggle-activity-btn');
    const feed = document.getElementById('activity-feed');
    const appContainer = document.getElementById('app');
    let isExpanded = true;

    toggleBtn.addEventListener('click', () => {
      isExpanded = !isExpanded;
      feed.classList.toggle('collapsed', !isExpanded);
      appContainer.classList.toggle('feed-collapsed', !isExpanded);
      toggleBtn.textContent = isExpanded ? '◀' : '▶';
    });

    // Load initial activity
    this.loadActivity();
  },

  // Load recent activity
  async loadActivity() {
    try {
      const isMobile = window.innerWidth < 768;
      const limit = isMobile ? CONFIG.ACTIVITY_FEED_MOBILE : CONFIG.ACTIVITY_FEED_DESKTOP;
      
      const data = await API.getActivity(limit);
      
      if (data.success) {
        this.renderActivity(data.activity);
      }
    } catch (error) {
      console.error('Error loading activity:', error);
    }
  },

  // Render activity feed
  renderActivity(activities) {
    const list = document.getElementById('activity-list');
    list.innerHTML = '';

    activities.reverse().forEach(activity => {
      const item = document.createElement('div');
      item.className = 'activity-item';
      
      const timeAgo = this.getTimeAgo(activity.timestamp);
      const color = PALETTE[activity.color] || '#000';
      
      item.innerHTML = `
        <div class="activity-color" style="background: ${color}"></div>
        <div class="activity-info">
          <div class="activity-user">${this.escapeHtml(activity.username || 'Anonymous')}</div>
          <div class="activity-coords">(${activity.x}, ${activity.y})</div>
        </div>
        <div class="activity-time">${timeAgo}</div>
      `;
      
      // Click to jump to location
      item.addEventListener('click', () => {
        CanvasRenderer.targetOffsetX = -activity.x * CanvasRenderer.getScale();
        CanvasRenderer.targetOffsetY = -activity.y * CanvasRenderer.getScale();
        CanvasRenderer.setTargetScale(20); // Zoom in
      });
      
      list.appendChild(item);
    });
  },

  // Add activity item to feed
  addActivityItem(activity) {
    const list = document.getElementById('activity-list');
    
    const item = document.createElement('div');
    item.className = 'activity-item';
    
    const color = PALETTE[activity.color] || '#000';
    item.innerHTML = `
      <div class="activity-color" style="background: ${color}"></div>
      <div class="activity-info">
        <div class="activity-user">${this.escapeHtml(activity.username || 'Anonymous')}</div>
        <div class="activity-coords">(${activity.x}, ${activity.y})</div>
      </div>
      <div class="activity-time">just now</div>
    `;
    
    // Add to top of list
    list.insertBefore(item, list.firstChild);
    
    // Remove last item if too many
    const isMobile = window.innerWidth < 768;
    const maxItems = isMobile ? CONFIG.ACTIVITY_FEED_MOBILE : CONFIG.ACTIVITY_FEED_DESKTOP;
    
    while (list.children.length > maxItems) {
      list.removeChild(list.lastChild);
    }
  },

  // Update cooldown display
  updateCooldown(remainingSeconds) {
    this.isCooldownActive = remainingSeconds > 0;
    this.cooldownEndTime = remainingSeconds > 0 ? Date.now() + (remainingSeconds * 1000) : 0;
    
    const timerText = document.getElementById('cooldown-text');
    const timerContainer = document.getElementById('cooldown-container');
    const ringFill = document.querySelector('.cooldown-ring-fill');
    
    // Calculate ring offset (circumference = 2 * π * 45 ≈ 283)
    const circumference = 283;
    const totalCooldown = 120; // seconds
    const progress = remainingSeconds / totalCooldown;
    const offset = circumference * (1 - progress);
    
    // Update ring animation
    if (ringFill) {
      ringFill.style.strokeDashoffset = offset;
    }
    
    if (remainingSeconds > 0) {
      timerText.textContent = `${remainingSeconds}s`;
      timerContainer.classList.add('cooldown-active');
    } else {
      timerText.textContent = 'Ready!';
      timerContainer.classList.remove('cooldown-active');
      if (ringFill) {
        ringFill.style.strokeDashoffset = 0;
      }
    }
  },

  // Start cooldown timer
  startCooldownTimer() {
    setInterval(() => {
      if (this.isCooldownActive && this.cooldownEndTime > 0) {
        const remaining = Math.max(0, Math.ceil((this.cooldownEndTime - Date.now()) / 1000));
        this.updateCooldown(remaining);
        
        if (remaining === 0) {
          this.isCooldownActive = false;
          this.cooldownEndTime = 0;
        }
      }
    }, 100);
  },

  // Set up canvas click handler
  setupCanvasClick() {
    const canvas = document.getElementById('place-canvas');
    
    canvas.addEventListener('click', (e) => {
      if (!this.selectedColor || this.isCooldownActive) return;
      
      const coords = CanvasRenderer.getCanvasCoords(e.clientX, e.clientY);
      
      if (coords.x >= 0 && coords.x < 256 && coords.y >= 0 && coords.y < 256) {
        this.placePixel(coords.x, coords.y);
      }
    });
  },

  // Place pixel
  async placePixel(x, y) {
    if (!this.selectedColor || this.isCooldownActive) return;
    
    const colorIndex = this.selectedColorIndex;
    const clickTime = Date.now();
    
    // Get behavior data
    const fingerprint = await Fingerprint.getFullFingerprint();
    const behavior = {
      ...BehaviorTracker.getBehaviorData(),
      mouseTrajectory: BehaviorTracker.getMouseTrajectory(),
    };
    
    // Record click-to-placement time
    BehaviorTracker.recordClickToPlacement(0); // Will be updated after server response
    
    // Disable placement until response
    this.isCooldownActive = true;
    this.updateCooldown(CONFIG.COOLDOWN_SECONDS);
    
    // Place pixel via API
    const response = await API.placePixel(x, y, colorIndex, fingerprint, behavior);
    
    if (response.success) {
      // Update canvas
      CanvasRenderer.setPixel(x, y, colorIndex);
      
      // Update session pixels count
      this.sessionPixels++;
      document.getElementById('session-pixels').textContent = this.sessionPixels;
      
      // Record placement in behavior tracker
      BehaviorTracker.recordPixelPlacement();
      
      // Show success toast
      this.showToast('Pixel placed!', 'success');
      
      // Update cooldown from server response
      if (response.waitSeconds) {
        this.updateCooldown(response.waitSeconds);
      }
    } else {
      // Re-enable if error
      if (response.error === 'Cooldown active' || response.error === 'Session banned') {
        this.updateCooldown(response.waitSeconds);
      } else {
        this.isCooldownActive = false;
        this.updateCooldown(0);
        this.showToast(response.error || 'Failed to place pixel', 'error');
      }
    }
  },

  // Update coordinates display
  updateCoordinates(x, y) {
    document.getElementById('coord-x').textContent = x;
    document.getElementById('coord-y').textContent = y;
  },

  // Show toast notification
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.add('toast-hide');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // Show error modal
  showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-modal').style.display = 'flex';
  },

  // Get time ago string
  getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  },

  // Escape HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || 'Anonymous';
    return div.innerHTML;
  },

  // Get selected color
  getSelectedColor() {
    return this.selectedColor;
  },

  // Get selected color index
  getSelectedColorIndex() {
    return this.selectedColorIndex;
  },

  // Check if can place pixel
  canPlacePixel() {
    return this.selectedColor !== null && !this.isCooldownActive;
  },
};

// Close error modal function
function closeErrorModal() {
  document.getElementById('error-modal').style.display = 'none';
}
