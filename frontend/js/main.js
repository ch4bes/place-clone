/**
 * Main Application Module
 * Initializes and coordinates all other modules
 */

// Color palette (original r/place colors)
const PALETTE = [
  '#FFFFFF', // 0: White
  '#E4E4E4', // 1: Light Gray
  '#888888', // 2: Gray
  '#222222', // 3: Black
  '#FFA7D1', // 4: Pink
  '#E50000', // 5: Red
  '#E59500', // 6: Orange
  '#A06A42', // 7: Brown
  '#E5D900', // 8: Yellow
  '#94E044', // 9: Lime
  '#02BE01', // 10: Green
  '#00D3DD', // 11: Cyan
  '#0083C7', // 12: Blue
  '#0000EA', // 13: Dark Blue
  '#CF6EE4', // 14: Magenta
  '#820080', // 15: Purple
];

// Application state
const App = {
  initialized: false,
  sessionId: null,
  fingerprint: null,
  canvasInitialized: false,

  // Initialize application
  async init() {
    console.log('🎨 PLACE - Initializing...');

    try {
      // Generate session ID
      this.sessionId = Fingerprint.generateSessionId();
      console.log('📋 Session ID:', this.sessionId);

      // Generate fingerprint
      this.fingerprint = await Fingerprint.getFullFingerprint();
      console.log('👆 Fingerprint generated');

      // Initialize behavior tracker
      BehaviorTracker.init(this.sessionId);
      console.log('📊 Behavior tracker initialized');

      // Initialize API client
      API.init(this.sessionId);
      console.log('🌐 API client initialized');

      // Set up WebSocket handlers
      this.setupWebSocketHandlers();

      // Initialize UI
      UI.init();
      console.log('🎨 UI initialized');

// Initialize canvas
const canvasElement = document.getElementById('place-canvas');
CanvasRenderer.init(canvasElement);
CanvasRenderer.setPalette(PALETTE); // Pass the palette to canvas renderer
CanvasRenderer.setTargetScale(1);
this.canvasInitialized = true;
console.log('🖼️ Canvas initialized');

      // Set up canvas click handler
      UI.setupCanvasClick();
      console.log('👆 Canvas click handler set up');

      // Set up coordinate tracking
      this.setupCoordinateTracking();

      // Set up mobile controls
      this.setupMobileControls();

      // Load canvas data
      await this.loadCanvasData();
      console.log('📊 Canvas data loaded');

      // Load activity feed
      await UI.loadActivity();
      console.log('📋 Activity feed loaded');

      // Check initial cooldown
      await this.checkCooldown();
      console.log('⏱️ Cooldown checked');

      // Hide loading screen
      this.hideLoadingScreen();
      console.log('✅ Application initialized successfully');

      this.initialized = true;

      // Seed canvas if empty (admin function, placeholder)
      // this.seedCanvasIfNeeded();
    } catch (error) {
      console.error('❌ Initialization error:', error);
      this.showError('Failed to initialize application. Please refresh the page.');
    }
  },

  // Set up WebSocket event handlers
  setupWebSocketHandlers() {
    API.onCanvasSync = (payload) => {
      console.log('📊 Canvas sync received');
      CanvasRenderer.loadCanvasData(payload.pixels);
    };

    API.onPixelPlaced = (payload) => {
      console.log('🎨 Pixel placed:', payload);
      
      // Update canvas
      CanvasRenderer.setPixel(payload.x, payload.y, payload.color);
      
      // Add to activity feed
      UI.addActivityItem(payload);
      
      // Update stats if on stats page
      if (window.location.pathname.includes('stats.html')) {
        // Trigger stats refresh
      }
    };

    API.onCooldownUpdate = (payload) => {
      UI.updateCooldown(payload.remaining);
    };

    API.onError = (payload) => {
      console.error('WebSocket error:', payload);
      UI.showToast(payload.message, 'error');
    };
  },

  // Load canvas data from server
  async loadCanvasData() {
    try {
      // Try bitmap first (compressed)
      const bitmapData = await API.getCanvasBitmap();
      
      if (bitmapData.success && bitmapData.bitmap) {
        CanvasRenderer.loadFromBitmap(bitmapData.bitmap);
        console.log(`📊 Loaded canvas from bitmap (${bitmapData.width}x${bitmapData.height})`);
      } else {
        // Fall back to regular canvas data
        const canvasData = await API.getCanvas();
        
        if (canvasData.success) {
          CanvasRenderer.loadCanvasData(canvasData.pixels);
          console.log(`📊 Loaded ${canvasData.count} pixels from server`);
        }
      }
    } catch (error) {
      console.error('Error loading canvas data:', error);
    }
  },

  // Check initial cooldown status
  async checkCooldown() {
    try {
      const data = await API.getCooldown();
      
      if (data.success) {
        UI.updateCooldown(data.remaining);
      }
    } catch (error) {
      console.error('Error checking cooldown:', error);
    }
  },

  // Set up coordinate tracking
  setupCoordinateTracking() {
    const canvas = document.getElementById('place-canvas');
    
    canvas.addEventListener('mousemove', (e) => {
      if (!this.canvasInitialized) return;
      
      const coords = CanvasRenderer.getCanvasCoords(e.clientX, e.clientY);
      
      if (coords.x >= 0 && coords.x < 256 && coords.y >= 0 && coords.y < 256) {
        UI.updateCoordinates(coords.x, coords.y);
      } else {
        UI.updateCoordinates(-1, -1);
      }
    });
  },

  // Set up mobile controls
  setupMobileControls() {
    const mobilePaletteBtn = document.getElementById('mobile-palette-btn');
    const mobileActivityBtn = document.getElementById('mobile-activity-btn');
    const paletteContainer = document.getElementById('palette-container');
    const activityFeed = document.getElementById('activity-feed');

    // Show/hide palette on mobile
    if (mobilePaletteBtn) {
      mobilePaletteBtn.addEventListener('click', () => {
        paletteContainer.classList.toggle('mobile-visible');
      });
    }

    // Show/hide activity on mobile
    if (mobileActivityBtn) {
      mobileActivityBtn.addEventListener('click', () => {
        activityFeed.classList.toggle('mobile-visible');
      });
    }

    // Detect touch device
    if ('ontouchstart' in window) {
      document.body.classList.add('touch-device');
    }
  },

  // Hide loading screen
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.classList.add('fade-out');
    
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
  },

  // Show error
  showError(message) {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.innerHTML = `
      <div class="loading-content">
        <h1>PLACE</h1>
        <p style="color: #E50000;">${message}</p>
        <button onclick="location.reload()" class="reload-btn">Reload Page</button>
      </div>
    `;
    loadingScreen.style.display = 'flex';
  },

  // Seed canvas with random pixels (for initial setup)
  async seedCanvasIfNeeded() {
    // This would be called by admin to seed the canvas
    // For now, it's just a placeholder
    console.log('🌱 Canvas seeding would happen here');
  },
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// Handle page visibility changes (pause/resume tracking)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    BehaviorTracker.stop();
  } else {
    BehaviorTracker.isTracking = true;
  }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  BehaviorTracker.stop();
  API.close();
});

// Service Worker registration (for PWA support, optional)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {
    // Service worker registration failed (optional feature)
  });
}
