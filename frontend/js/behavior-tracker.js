/**
 * Behavior Tracker Module
 * Tracks user interactions for bot detection analysis
 */

const BehaviorTracker = {
  sessionId: null,
  startTime: null,
  mouseMovements: 0,
  touchGestures: 0,
  clickPrecision: [],
  pixelPlacements: 0,
  colorChanges: 0,
  zoomPanInteractions: 0,
  idleTime: 0,
  lastActivityTime: null,
  mousePositions: [],
  isTracking: false,

  // Initialize tracking
  init(sessionId) {
    this.sessionId = sessionId;
    this.startTime = Date.now();
    this.lastActivityTime = Date.now();
    this.isTracking = true;

    // Set up event listeners
    this.setupEventListeners();

    // Start idle timer
    this.startIdleTimer();
  },

  // Set up event listeners
  setupEventListeners() {
    // Mouse movement
    document.addEventListener('mousemove', (e) => {
      if (!this.isTracking) return;
      this.mouseMovements++;
      this.mousePositions.push({ x: e.clientX, y: e.clientY, time: Date.now() });
      
      // Keep only last 100 positions
      if (this.mousePositions.length > 100) {
        this.mousePositions.shift();
      }
      
      this.recordActivity();
    });

    // Click events
    document.addEventListener('click', (e) => {
      if (!this.isTracking) return;
      this.recordActivity();
    });

    // Touch events
    document.addEventListener('touchstart', (e) => {
      if (!this.isTracking) return;
      this.touchGestures++;
      this.recordActivity();
    });

    document.addEventListener('touchmove', (e) => {
      if (!this.isTracking) return;
      this.touchGestures++;
      this.recordActivity();
    });

    document.addEventListener('touchend', (e) => {
      if (!this.isTracking) return;
      this.touchGestures++;
      this.recordActivity();
    });

    // Scroll events (for zoom)
    document.addEventListener('wheel', (e) => {
      if (!this.isTracking) return;
      this.zoomPanInteractions++;
      this.recordActivity();
    });

    // Keyboard events
    document.addEventListener('keydown', (e) => {
      if (!this.isTracking) return;
      this.recordActivity();
    });
  },

  // Record click-to-placement precision
  recordClickToPlacement(timeMs) {
    this.clickPrecision.push(timeMs);
    
    // Keep only last 20 measurements
    if (this.clickPrecision.length > 20) {
      this.clickPrecision.shift();
    }
  },

  // Record pixel placement
  recordPixelPlacement() {
    this.pixelPlacements++;
    this.recordActivity();
  },

  // Record color change
  recordColorChange() {
    this.colorChanges++;
    this.recordActivity();
  },

  // Record zoom/pan interaction
  recordZoomPan() {
    this.zoomPanInteractions++;
    this.recordActivity();
  },

  // Record any activity
  recordActivity() {
    this.lastActivityTime = Date.now();
    this.idleTime = 0;
  },

  // Start idle timer
  startIdleTimer() {
    setInterval(() => {
      if (!this.isTracking) return;
      
      if (this.lastActivityTime) {
        this.idleTime = Date.now() - this.lastActivityTime;
      }
    }, 1000);
  },

  // Get behavior data for submission
  getBehaviorData() {
    const sessionDuration = Date.now() - this.startTime;
    const pixelsPerMinute = this.pixelPlacements / (sessionDuration / 60000);

    return {
      mouseMovements: this.mouseMovements,
      touchGestures: this.touchGestures,
      clickPrecision: [...this.clickPrecision],
      pixelPlacements: this.pixelPlacements,
      colorChangeFrequency: this.colorChanges,
      zoomPanInteractions: this.zoomPanInteractions,
      sessionDuration,
      idleTime: this.idleTime,
      pixelsPerMinute: parseFloat(pixelsPerMinute.toFixed(2)),
      mousePositions: this.mousePositions.slice(-10), // Last 10 positions
    };
  },

  // Get mouse trajectory analysis
  getMouseTrajectory() {
    if (this.mousePositions.length < 2) {
      return { isLinear: false, totalDistance: 0, avgSpeed: 0 };
    }

    let totalDistance = 0;
    let directionChanges = 0;

    for (let i = 1; i < this.mousePositions.length; i++) {
      const prev = this.mousePositions[i - 1];
      const curr = this.mousePositions[i];
      
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      totalDistance += distance;

      if (i > 1) {
        const prevDx = this.mousePositions[i - 1].x - this.mousePositions[i - 2].x;
        const prevDy = this.mousePositions[i - 1].y - this.mousePositions[i - 2].y;
        
        // Check if direction changed significantly
        const angle1 = Math.atan2(dy, dx);
        const angle2 = Math.atan2(prevDy, prevDx);
        const angleDiff = Math.abs(angle1 - angle2);
        
        if (angleDiff > 0.5 && angleDiff < Math.PI - 0.5) {
          directionChanges++;
        }
      }
    }

    const avgSpeed = totalDistance / this.mousePositions.length;
    const isLinear = directionChanges < 2 && this.mousePositions.length > 5;

    return {
      isLinear,
      totalDistance: Math.round(totalDistance),
      avgSpeed: parseFloat(avgSpeed.toFixed(2)),
      directionChanges,
    };
  },

  // Reset tracker for new session
  reset() {
    this.startTime = Date.now();
    this.mouseMovements = 0;
    this.touchGestures = 0;
    this.clickPrecision = [];
    this.pixelPlacements = 0;
    this.colorChanges = 0;
    this.zoomPanInteractions = 0;
    this.idleTime = 0;
    this.lastActivityTime = Date.now();
    this.mousePositions = [];
  },

  // Stop tracking
  stop() {
    this.isTracking = false;
  },
};
