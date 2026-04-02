const express = require('express');
const router = express.Router();
const uuid = require('uuid');
const {
  getPixel,
  setPixel,
  getSession,
  createSession,
  updateSession,
  incrementPixelCount,
  updateStats,
} = require('../services/firebase');
const { calculateBotScore } = require('../services/bot-detector');
const { broadcastPixelPlacement } = require('../services/websocket');
const { logSession, logPixelPlacement } = require('../services/logger');

const COOLDOWN_MS = 120000; // 2 minutes

/**
 * POST /api/pixel
 * Place a pixel on the canvas
 */
router.post('/', async (req, res) => {
  try {
    const { x, y, color, sessionId, fingerprint, behavior } = req.body;

    // Validate required fields
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID required',
        waitSeconds: 0,
      });
    }

    // Validate coordinates
    if (x < 0 || x >= 256 || y < 0 || y >= 256) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates',
        waitSeconds: 0,
      });
    }

    // Validate color (0-15)
    if (color < 0 || color > 15) {
      return res.status(400).json({
        success: false,
        error: 'Invalid color',
        waitSeconds: 0,
      });
    }

    // Get or create session
    let session = await getSession(sessionId);
    if (!session) {
      session = await createSession(sessionId, {
        username: req.body.username || 'Anonymous',
        fingerprint: fingerprint || {},
        behavior: behavior || {},
        userAgent: req.headers['user-agent'],
        ipHash: req.ip,
      });
    } else {
      // Update session with new fingerprint/behavior data
      await updateSession(sessionId, {
        fingerprint: fingerprint || session.fingerprint,
        behavior: behavior || session.behavior,
      });
    }

    // Check if banned
    if (session.banned) {
      return res.status(403).json({
        success: false,
        error: 'Session banned',
        waitSeconds: -1,
      });
    }

    // Check cooldown
    const now = Date.now();
    const lastPixelTime = session.lastPixelTime || 0;
    const timeSinceLastPixel = now - lastPixelTime;
    
    if (timeSinceLastPixel < COOLDOWN_MS) {
      const remaining = Math.ceil((COOLDOWN_MS - timeSinceLastPixel) / 1000);
      return res.status(429).json({
        success: false,
        error: 'Cooldown active',
        waitSeconds: remaining,
      });
    }

    // Calculate bot score with updated behavior data
    const updatedBehavior = {
      ...session.behavior,
      ...behavior,
      pixelsPlaced: (session.totalPixels || 0) + 1,
    };
    
    const botAnalysis = calculateBotScore({
      ...session,
      behavior: updatedBehavior,
    });

    // Update session with bot score
    await updateSession(sessionId, {
      botScore: botAnalysis.score,
      riskTier: botAnalysis.riskTier,
      lastPixelTime: now,
    });

    // Place pixel
    const pixelData = await setPixel(x, y, color, sessionId, {
      username: req.body.username || session.username || 'Anonymous',
      botScore: botAnalysis.score,
      timeToPlace: behavior?.clickPrecision?.[behavior.clickPrecision.length - 1] || 0,
      mouseDistance: behavior?.mouseMovements || 0,
    });

    // Update session pixel count
    await incrementPixelCount(sessionId);

    // Update stats
    await updateStats(pixelData);

    // Log pixel placement
    await logPixelPlacement(sessionId, pixelData, behavior || {});

    // Broadcast to WebSocket clients
    broadcastPixelPlacement(pixelData, session.username);

    // Calculate new cooldown
    const newRemaining = Math.ceil(COOLDOWN_MS / 1000);

    res.json({
      success: true,
      pixel: pixelData,
      waitSeconds: newRemaining,
      botScore: botAnalysis.score,
      riskTier: botAnalysis.riskTier,
    });
  } catch (error) {
    console.error('Error placing pixel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to place pixel',
      waitSeconds: 0,
    });
  }
});

/**
 * GET /api/pixel/:x/:y
 * Get pixel metadata at coordinates
 */
router.get('/:x/:y', async (req, res) => {
  try {
    const { x, y } = req.params;
    const pixelX = parseInt(x);
    const pixelY = parseInt(y);

    if (isNaN(pixelX) || isNaN(pixelY) || pixelX < 0 || pixelX >= 256 || pixelY < 0 || pixelY >= 256) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates',
      });
    }

    const pixel = await getPixel(pixelX, pixelY);

    if (!pixel) {
      return res.json({
        success: true,
        pixel: null,
        message: 'No pixel at this location',
      });
    }

    res.json({
      success: true,
      pixel,
    });
  } catch (error) {
    console.error('Error fetching pixel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pixel',
    });
  }
});

/**
 * GET /api/pixel/cooldown/:sessionId
 * Get remaining cooldown time
 */
router.get('/cooldown/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await getSession(sessionId);

    if (!session) {
      return res.json({
        success: true,
        remaining: 0,
        canPlace: true,
      });
    }

    const now = Date.now();
    const lastPixelTime = session.lastPixelTime || 0;
    const timeSinceLastPixel = now - lastPixelTime;

    if (timeSinceLastPixel >= COOLDOWN_MS) {
      return res.json({
        success: true,
        remaining: 0,
        canPlace: true,
      });
    }

    const remaining = Math.ceil((COOLDOWN_MS - timeSinceLastPixel) / 1000);

    res.json({
      success: true,
      remaining,
      canPlace: false,
    });
  } catch (error) {
    console.error('Error checking cooldown:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check cooldown',
    });
  }
});

/**
 * GET /api/pixel/activity
 * Get recent activity feed
 */
router.get('/activity', async (req, res) => {
  try {
    const { limit = 30 } = req.query;
    const activity = await require('../services/firebase').getRecentActivity(parseInt(limit));

    res.json({
      success: true,
      activity,
      count: activity.length,
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity',
    });
  }
});

module.exports = router;
