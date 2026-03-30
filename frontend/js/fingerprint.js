/**
 * Fingerprinting Module
 * Generates unique device fingerprints for bot detection
 */

const Fingerprint = {
  // Generate canvas fingerprint
  async generateCanvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 200;
      canvas.height = 50;

      // Draw fingerprint-generating content
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Fingerprint Test', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Fingerprint Test', 4, 17);

      // Get data URL and hash it
      const dataURL = canvas.toDataURL();
      return this.hashString(dataURL);
    } catch (error) {
      console.error('Canvas fingerprint error:', error);
      return 'canvas_unavailable';
    }
  },

  // Generate WebGL fingerprint
  async generateWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        return 'webgl_unavailable';
      }

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) {
        return 'webgl_debug_unavailable';
      }

      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      const version = gl.getParameter(gl.VERSION);
      const shadingLanguageVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);

      const fingerprint = `${vendor}|${renderer}|${version}|${shadingLanguageVersion}`;
      return this.hashString(fingerprint);
    } catch (error) {
      console.error('WebGL fingerprint error:', error);
      return 'webgl_error';
    }
  },

  // Get comprehensive device fingerprint
  async getFullFingerprint() {
    const [canvasFp, webglFp] = await Promise.all([
      this.generateCanvasFingerprint(),
      this.generateWebGLFingerprint()
    ]);

    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      deviceMemory: navigator.deviceMemory || 'unknown',
      touchSupport: navigator.maxTouchPoints > 0,
      maxTouchPoints: navigator.maxTouchPoints,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      connectionType: navigator.connection?.effectiveType || 'unknown',
      canvasFingerprint: canvasFp,
      webglFingerprint: webglFp,
    };
  },

  // Simple hash function
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  },

  // Generate session ID
  generateSessionId() {
    const storedId = localStorage.getItem('place_session_id');
    if (storedId) return storedId;

    const newId = 'session_' + Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    localStorage.setItem('place_session_id', newId);
    return newId;
  },
};
