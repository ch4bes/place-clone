/**
 * API Client Module
 * Handles communication with backend server
 */

const CONFIG = {
  BACKEND_URL: 'https://place-backend-xyz.onrender.com',
  WS_URL: 'wss://place-backend-xyz.onrender.com',
  CANVAS_SIZE: 256,
  COOLDOWN_SECONDS: 120,
  ACTIVITY_FEED_DESKTOP: 30,
  ACTIVITY_FEED_MOBILE: 15,
};

const API = {
  sessionId: null,
  ws: null,
  wsReconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,

  // Initialize API client
  init(sessionId) {
    this.sessionId = sessionId;
    this.connectWebSocket();
  },

  // WebSocket connection
  connectWebSocket() {
    try {
      this.ws = new WebSocket(CONFIG.WS_URL);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.wsReconnectAttempts = 0;
        
        // Subscribe to updates
        this.ws.send(JSON.stringify({
          type: 'subscribe',
          sessionId: this.sessionId
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('❌ WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.attemptReconnect();
    }
  },

  // Attempt to reconnect WebSocket
  attemptReconnect() {
    if (this.wsReconnectAttempts < this.maxReconnectAttempts) {
      this.wsReconnectAttempts++;
      console.log(`🔄 Reconnecting (attempt ${this.wsReconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connectWebSocket();
      }, this.reconnectDelay * this.wsReconnectAttempts);
    } else {
      console.error('❌ Max WebSocket reconnection attempts reached');
    }
  },

  // Handle incoming WebSocket messages
  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'canvas:sync':
        if (this.onCanvasSync) {
          this.onCanvasSync(data.payload);
        }
        break;

      case 'pixel:placed':
        if (this.onPixelPlaced) {
          this.onPixelPlaced(data.payload);
        }
        break;

      case 'cooldown:status':
        if (this.onCooldownUpdate) {
          this.onCooldownUpdate(data.payload);
        }
        break;

      case 'error':
        if (this.onError) {
          this.onError(data.payload);
        }
        break;

      case 'pong':
        // Keep-alive response
        break;

      default:
        console.warn('Unknown WebSocket message type:', data.type);
    }
  },

  // WebSocket event handlers (to be set by main.js)
  onCanvasSync: null,
  onPixelPlaced: null,
  onCooldownUpdate: null,
  onError: null,

  // REST API: Get full canvas
  async getCanvas() {
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/canvas`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching canvas:', error);
      return { success: false, error: error.message };
    }
  },

  // REST API: Get canvas bitmap (compressed)
  async getCanvasBitmap() {
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/canvas/bitmap`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching bitmap:', error);
      return { success: false, error: error.message };
    }
  },

  // REST API: Place pixel
  async placePixel(x, y, color, fingerprint, behavior) {
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/pixel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x,
          y,
          color,
          sessionId: this.sessionId,
          fingerprint,
          behavior,
          username: localStorage.getItem('place_username') || 'Anonymous',
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error placing pixel:', error);
      return { 
        success: false, 
        error: error.message,
        waitSeconds: 0 
      };
    }
  },

  // REST API: Get pixel at coordinates
  async getPixel(x, y) {
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/pixel/${x}/${y}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching pixel:', error);
      return { success: false, error: error.message };
    }
  },

  // REST API: Get cooldown status
  async getCooldown() {
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/pixel/cooldown/${this.sessionId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking cooldown:', error);
      return { success: false, error: error.message };
    }
  },

  // REST API: Get recent activity
  async getActivity(limit = null) {
    try {
      const url = limit 
        ? `${CONFIG.BACKEND_URL}/api/pixel/activity?limit=${limit}`
        : `${CONFIG.BACKEND_URL}/api/pixel/activity`;
      
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching activity:', error);
      return { success: false, error: error.message };
    }
  },

  // REST API: Get statistics
  async getStats() {
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/stats`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return { success: false, error: error.message };
    }
  },

  // Send ping to keep WebSocket alive
  sendPing() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  },

  // Close WebSocket connection
  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  },
};

// Keep-alive ping every 30 seconds
setInterval(() => {
  if (API.ws && API.ws.readyState === WebSocket.OPEN) {
    API.sendPing();
  }
}, 30000);
