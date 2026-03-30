const express = require('express');
const router = express.Router();
const { getDatabase } = require('../services/firebase');

/**
 * GET /api/stats
 * Get public statistics
 */
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    
    // Get all stats in parallel
    const [
      totalPixelsSnap,
      todayPixelsSnap,
      activeSessionsSnap,
      colorDistSnap,
      sessionsSnap,
    ] = await Promise.all([
      db.ref('stats/totalPixels').once('value'),
      db.ref('stats/todayPixels').once('value'),
      db.ref('sessions').once('value'),
      db.ref('stats/colorDistribution').once('value'),
      db.ref('sessions').once('value'),
    ]);

    const totalPixels = totalPixelsSnap.val() || 0;
    const todayPixels = todayPixelsSnap.val() || 0;
    const colorDistribution = colorDistSnap.val() || {};

    // Calculate active sessions (last 24 hours)
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    const sessions = sessionsSnap.val() || {};
    
    let activeSessions = 0;
    const contributors = [];

    Object.entries(sessions).forEach(([sessionId, data]) => {
      if (data.lastActive && data.lastActive > twentyFourHoursAgo) {
        activeSessions++;
      }
      
      if (data.totalPixels && data.totalPixels > 0) {
        contributors.push({
          sessionId,
          username: data.username || 'Anonymous',
          pixels: data.totalPixels,
          botScore: data.botScore || 0,
        });
      }
    });

    // Sort contributors by pixel count
    contributors.sort((a, b) => b.pixels - a.pixels);
    const topContributors = contributors.slice(0, 10);

    // Count flagged/banned
    const flaggedCount = Object.values(sessions).filter(s => s.flagged).length;
    const bannedCount = Object.values(sessions).filter(s => s.banned).length;

    // Calculate canvas completion
    const canvasSize = 256 * 256; // 65536 pixels
    const completionPercentage = ((totalPixels / canvasSize) * 100).toFixed(2);

    res.json({
      success: true,
      stats: {
        totalPixels,
        todayPixels,
        activeSessions24h: activeSessions,
        totalSessions: Object.keys(sessions).length,
        canvasCompletion: {
          percentage: completionPercentage,
          totalPixels,
          canvasSize,
        },
        colorDistribution,
        topContributors,
        botDetection: {
          flagged: flaggedCount,
          banned: bannedCount,
        },
      },
      timestamp: now,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
});

/**
 * GET /api/stats/top
 * Get top contributors
 */
router.get('/top', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const db = getDatabase();
    const sessionsSnap = await db.ref('sessions').once('value');
    const sessions = sessionsSnap.val() || {};

    const contributors = Object.entries(sessions)
      .filter(([sessionId, data]) => data.totalPixels && data.totalPixels > 0)
      .map(([sessionId, data]) => ({
        sessionId,
        username: data.username || 'Anonymous',
        pixels: data.totalPixels,
        botScore: data.botScore || 0,
      }))
      .sort((a, b) => b.pixels - a.pixels)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      contributors,
    });
  } catch (error) {
    console.error('Error fetching top contributors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top contributors',
    });
  }
});

/**
 * GET /api/stats/colors
 * Get color distribution
 */
router.get('/colors', async (req, res) => {
  try {
    const db = getDatabase();
    const colorDistSnap = await db.ref('stats/colorDistribution').once('value');
    const colorDistribution = colorDistSnap.val() || {};

    // Convert to array for easier chart rendering
    const colors = Object.entries(colorDistribution).map(([color, count]) => ({
      color: parseInt(color),
      count,
      percentage: 0, // Will be calculated client-side
    }));

    const total = colors.reduce((sum, c) => sum + c.count, 0);
    colors.forEach(c => {
      c.percentage = total > 0 ? ((c.count / total) * 100).toFixed(2) : 0;
    });

    res.json({
      success: true,
      colors,
      total,
    });
  } catch (error) {
    console.error('Error fetching color distribution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch color distribution',
    });
  }
});

module.exports = router;
