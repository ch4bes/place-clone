const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const {
  getAllSessions,
  banSession,
  unbanSession,
  clearPixel,
  fillRectangle,
  getDatabase,
} = require('../services/firebase');
const { exportLogs } = require('../services/logger');

let adminPasswordHash = null;

/**
 * POST /api/admin/login
 * Authenticate admin
 */
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password required',
      });
    }

    // Get stored hash or create new one
    if (!adminPasswordHash) {
      const db = getDatabase();
      const snapshot = await db.ref('moderation/adminPasswordHash').once('value');
      adminPasswordHash = snapshot.val();

      if (!adminPasswordHash) {
        // First login - create hash from provided password
        adminPasswordHash = await bcrypt.hash(password, 10);
        await db.ref('moderation/adminPasswordHash').set(adminPasswordHash);
      }
    }

    // Verify password
    const isValid = await bcrypt.compare(password, adminPasswordHash);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password',
      });
    }

    // Generate session token (simple implementation)
    const token = Buffer.from(`admin_${Date.now()}`).toString('base64');

    res.json({
      success: true,
      token,
      expiresIn: 3600, // 1 hour
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
});

/**
 * GET /api/admin/users
 * List all user sessions
 */
router.get('/users', async (req, res) => {
  try {
    const sessions = await getAllSessions();
    
    // Convert to array and sort by bot score
    const sessionList = Object.entries(sessions).map(([sessionId, data]) => ({
      sessionId,
      ...data,
    })).sort((a, b) => (b.botScore || 0) - (a.botScore || 0));

    res.json({
      success: true,
      sessions: sessionList,
      count: sessionList.length,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions',
    });
  }
});

/**
 * POST /api/admin/ban/:sessionId
 * Ban a user session
 */
router.post('/ban/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    await banSession(sessionId);

    res.json({
      success: true,
      message: 'Session banned',
    });
  } catch (error) {
    console.error('Error banning session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to ban session',
    });
  }
});

/**
 * POST /api/admin/unban/:sessionId
 * Unban a user session
 */
router.post('/unban/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    await unbanSession(sessionId);

    res.json({
      success: true,
      message: 'Session unbanned',
    });
  } catch (error) {
    console.error('Error unbanning session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unban session',
    });
  }
});

/**
 * POST /api/admin/clear-pixel
 * Clear pixel at coordinates
 */
router.post('/clear-pixel', async (req, res) => {
  try {
    const { x, y } = req.body;

    if (x < 0 || x >= 256 || y < 0 || y >= 256) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates',
      });
    }

    await clearPixel(x, y);

    res.json({
      success: true,
      message: 'Pixel cleared',
    });
  } catch (error) {
    console.error('Error clearing pixel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear pixel',
    });
  }
});

/**
 * POST /api/admin/fill-rect
 * Fill rectangle with color
 */
router.post('/fill-rect', async (req, res) => {
  try {
    const { x, y, width, height, color } = req.body;

    if (x < 0 || x >= 256 || y < 0 || y >= 256) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates',
      });
    }

    if (width < 1 || width > 256 || height < 1 || height > 256) {
      return res.status(400).json({
        success: false,
        error: 'Invalid dimensions',
      });
    }

    if (color < 0 || color > 15) {
      return res.status(400).json({
        success: false,
        error: 'Invalid color',
      });
    }

    await fillRectangle(x, y, width, height, color);

    res.json({
      success: true,
      message: 'Rectangle filled',
    });
  } catch (error) {
    console.error('Error filling rectangle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fill rectangle',
    });
  }
});

/**
 * GET /api/admin/export-logs
 * Export logs as JSON
 */
router.get('/export-logs', async (req, res) => {
  try {
    const { startDate, endDate, minBotScore, flaggedOnly, sessionId } = req.query;
    
    const logs = await exportLogs({
      startDate: startDate ? parseInt(startDate) : undefined,
      endDate: endDate ? parseInt(endDate) : undefined,
      minBotScore: minBotScore ? parseInt(minBotScore) : undefined,
      flaggedOnly: flaggedOnly === 'true',
      sessionId: sessionId || undefined,
    });

    res.json({
      success: true,
      ...logs,
    });
  } catch (error) {
    console.error('Error exporting logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export logs',
    });
  }
});

/**
 * GET /api/admin/flagged
 * Get flagged sessions
 */
router.get('/flagged', async (req, res) => {
  try {
    const sessions = await getAllSessions();
    
    const flaggedSessions = Object.entries(sessions)
      .filter(([sessionId, data]) => data.flagged)
      .map(([sessionId, data]) => ({
        sessionId,
        ...data,
      }))
      .sort((a, b) => (b.botScore || 0) - (a.botScore || 0));

    res.json({
      success: true,
      sessions: flaggedSessions,
      count: flaggedSessions.length,
    });
  } catch (error) {
    console.error('Error fetching flagged sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flagged sessions',
    });
  }
});

module.exports = router;
