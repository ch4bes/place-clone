/**
 * Canvas Rendering Module
 * Handles canvas drawing, pan, and zoom functionality
 */

const CanvasRenderer = {
  canvas: null,
  ctx: null,
  offscreenCanvas: null,
  offscreenCtx: null,
  width: 256,
  height: 256,
  pixelData: null, // Uint8Array of color indices
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  targetScale: 1,
  targetOffsetX: 0,
  targetOffsetY: 0,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0,
  lastTapTime: 0,
  lastTapX: 0,
  lastTapY: 0,
  initialPinchDistance: null,
  initialPinchScale: null,

  // Initialize canvas
  init(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    
    // Create offscreen canvas for double buffering
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.width;
    this.offscreenCanvas.height = this.height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    
    // Initialize pixel data (0 = white/default)
    this.pixelData = new Uint8Array(this.width * this.height);
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start render loop
    this.startRenderLoop();
  },

  // Set up event listeners for pan and zoom
  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
    this.canvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));

    // Prevent context menu on right-click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  },

  // Mouse event handlers
  handleMouseDown(e) {
    this.isDragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.canvas.style.cursor = 'grabbing';
    
    if (BehaviorTracker.isTracking) {
      BehaviorTracker.recordZoomPan();
    }
  },

  handleMouseMove(e) {
    if (!this.isDragging) return;
    
    const dx = e.clientX - this.lastMouseX;
    const dy = e.clientY - this.lastMouseY;
    
    this.targetOffsetX += dx;
    this.targetOffsetY += dy;
    
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    
    if (BehaviorTracker.isTracking) {
      BehaviorTracker.recordZoomPan();
    }
  },

  handleMouseUp(e) {
    this.isDragging = false;
    this.canvas.style.cursor = 'grab';
  },

  handleMouseLeave(e) {
    this.isDragging = false;
    this.canvas.style.cursor = 'grab';
  },

  handleWheel(e) {
    e.preventDefault();
    
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const newScale = this.targetScale * (1 + delta);
    
    this.setTargetScale(Math.max(1, Math.min(40, newScale)));
    
    if (BehaviorTracker.isTracking) {
      BehaviorTracker.recordZoomPan();
    }
  },

  // Touch event handlers
  handleTouchStart(e) {
    e.preventDefault();
    
    if (e.touches.length === 1) {
      // Single touch - start drag
      this.isDragging = true;
      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;
      
      // Check for double-tap
      const now = Date.now();
      if (now - this.lastTapTime < 300) {
        this.toggleZoom(e.touches[0].clientX, e.touches[0].clientY);
      }
      this.lastTapTime = now;
      this.lastTapX = e.touches[0].clientX;
      this.lastTapY = e.touches[0].clientY;
      
    } else if (e.touches.length === 2) {
      // Two-finger pinch
      this.isDragging = false;
      this.initialPinchDistance = this.getPinchDistance(e.touches);
      this.initialPinchScale = this.targetScale;
      
      if (BehaviorTracker.isTracking) {
        BehaviorTracker.recordZoomPan();
      }
    }
  },

  handleTouchMove(e) {
    e.preventDefault();
    
    if (e.touches.length === 1 && this.isDragging) {
      // Single touch drag
      const dx = e.touches[0].clientX - this.lastMouseX;
      const dy = e.touches[0].clientY - this.lastMouseY;
      
      this.targetOffsetX += dx;
      this.targetOffsetY += dy;
      
      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;
      
    } else if (e.touches.length === 2) {
      // Two-finger pinch zoom
      const distance = this.getPinchDistance(e.touches);
      const scaleChange = distance / this.initialPinchDistance;
      const newScale = this.initialPinchScale * scaleChange;
      
      this.setTargetScale(Math.max(1, Math.min(40, newScale)));
    }
    
    if (BehaviorTracker.isTracking) {
      BehaviorTracker.recordZoomPan();
    }
  },

  handleTouchEnd(e) {
    this.isDragging = false;
    this.initialPinchDistance = null;
    this.initialPinchScale = null;
  },

  getPinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  },

  // Zoom controls
  setTargetScale(scale) {
    this.targetScale = scale;
  },

  setScale(scale) {
    this.scale = scale;
  },

  toggleZoom(centerX, centerY) {
    if (this.targetScale < 10) {
      this.setTargetScale(20); // Zoom in
    } else {
      this.setTargetScale(1); // Zoom out
    }
  },

  zoomIn() {
    this.setTargetScale(Math.min(40, this.targetScale * 1.5));
  },

  zoomOut() {
    this.setTargetScale(Math.max(1, this.targetScale / 1.5));
  },

  resetZoom() {
    this.setTargetScale(1);
    this.targetOffsetX = 0;
    this.targetOffsetY = 0;
  },

  // Set pixel at coordinates
  setPixel(x, y, colorIndex) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    
    const index = y * this.width + x;
    this.pixelData[index] = colorIndex;
    
    // Update offscreen canvas
    this.drawPixelOffscreen(x, y, colorIndex);
  },

  // Draw single pixel on offscreen canvas
  drawPixelOffscreen(x, y, colorIndex) {
    const color = PALETTE[colorIndex];
    this.offscreenCtx.fillStyle = color;
    this.offscreenCtx.fillRect(x, y, 1, 1);
  },

  // Load canvas data from server
  loadCanvasData(pixels) {
    // Clear offscreen canvas
    this.offscreenCtx.fillStyle = '#FFFFFF';
    this.offscreenCtx.fillRect(0, 0, this.width, this.height);
    
    // Reset pixel data
    this.pixelData.fill(0);
    
    // Draw all pixels
    pixels.forEach(pixel => {
      const index = pixel.y * this.width + pixel.x;
      this.pixelData[index] = pixel.color;
      this.drawPixelOffscreen(pixel.x, pixel.y, pixel.color);
    });
  },

  // Load canvas from bitmap (compressed)
  loadFromBitmap(base64Bitmap) {
    const binaryString = atob(base64Bitmap);
    const bitmap = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bitmap[i] = binaryString.charCodeAt(i);
    }
    
    // Clear offscreen canvas
    this.offscreenCtx.fillStyle = '#FFFFFF';
    this.offscreenCtx.fillRect(0, 0, this.width, this.height);
    this.pixelData.fill(0);
    
    // Decode bitmap (2 pixels per byte)
    for (let i = 0; i < bitmap.length; i++) {
      const byte = bitmap[i];
      const offset1 = i * 2;
      const offset2 = i * 2 + 1;
      
      if (offset1 < this.pixelData.length) {
        const color1 = (byte >> 4) & 0x0F;
        this.pixelData[offset1] = color1;
        this.drawPixelOffscreen(offset1 % this.width, Math.floor(offset1 / this.width), color1);
      }
      
      if (offset2 < this.pixelData.length) {
        const color2 = byte & 0x0F;
        this.pixelData[offset2] = color2;
        this.drawPixelOffscreen(offset2 % this.width, Math.floor(offset2 / this.width), color2);
      }
    }
  },

  // Get color at coordinates
  getPixelColor(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    
    const index = y * this.width + x;
    return this.pixelData[index];
  },

  // Get coordinates from screen position
  getCanvasCoords(screenX, screenY) {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const x = Math.floor((screenX - rect.left - centerX) / this.scale + centerX - this.offsetX);
    const y = Math.floor((screenY - rect.top - centerY) / this.scale + centerY - this.offsetY);
    
    return { x, y };
  },

  // Render loop with smooth interpolation
  startRenderLoop() {
    const render = () => {
      // Interpolate scale
      if (Math.abs(this.scale - this.targetScale) > 0.01) {
        this.scale += (this.targetScale - this.scale) * 0.2;
      } else {
        this.scale = this.targetScale;
      }
      
      // Interpolate offset
      if (Math.abs(this.offsetX - this.targetOffsetX) > 0.5) {
        this.offsetX += (this.targetOffsetX - this.offsetX) * 0.4;
      } else {
        this.offsetX = this.targetOffsetX;
      }
      
      if (Math.abs(this.offsetY - this.targetOffsetY) > 0.5) {
        this.offsetY += (this.targetOffsetY - this.offsetY) * 0.4;
      } else {
        this.offsetY = this.targetOffsetY;
      }
      
      // Clear canvas
      this.ctx.fillStyle = '#1a1a1a';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Calculate centered position
      const canvasSize = Math.min(this.canvas.width, this.canvas.height) * 0.8;
      const scaledSize = canvasSize * this.scale;
      const startX = (this.canvas.width - scaledSize) / 2 + this.offsetX;
      const startY = (this.canvas.height - scaledSize) / 2 + this.offsetY;
      
      // Draw offscreen canvas scaled
      this.ctx.imageSmoothingEnabled = false; // Keep pixels sharp
      this.ctx.drawImage(this.offscreenCanvas, startX, startY, scaledSize, scaledSize);
      
      // Draw grid at high zoom levels
      if (this.scale > 5) {
        this.drawGrid(startX, startY, scaledSize);
      }
      
      requestAnimationFrame(render);
    };
    
    render();
  },

  // Draw grid overlay
  drawGrid(startX, startY, size) {
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.lineWidth = 1;
    
    const step = size / this.width;
    
    // Vertical lines
    for (let x = 0; x <= this.width; x++) {
      const px = startX + x * step;
      this.ctx.beginPath();
      this.ctx.moveTo(px, startY);
      this.ctx.lineTo(px, startY + size);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= this.height; y++) {
      const py = startY + y * step;
      this.ctx.beginPath();
      this.ctx.moveTo(startX, py);
      this.ctx.lineTo(startX + size, py);
      this.ctx.stroke();
    }
  },

  // Get current scale
  getScale() {
    return this.scale;
  },

  // Set the color palette
  setPalette(palette) {
    PALETTE = palette;
  },

  // Get canvas size
  getSize() {
    return { width: this.width, height: this.height };
  },
};

// Global palette (will be set by main.js)
let PALETTE = null;
