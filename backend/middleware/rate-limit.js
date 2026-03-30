/**
 * Rate Limiting Middleware
 * Enforces cooldown periods for pixel placement
 */

const cooldowns = new Map(); // sessionId -> { lastPixelTime, remaining }

const COOLDOWN_MS = 120000; // 2 minutes

/**
 * Check if session is in cooldown
 */
function isOnCooldown(sessionId) {
  const session = cooldowns.get(sessionId);
  
  if (!session) {
    return { onCooldown: false, remaining: 0 };
  }
  
  const now = Date.now();
  const elapsed = now - session.lastPixelTime;
  
  if (elapsed < COOLDOWN_MS) {
    const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
    return { onCooldown: true, remaining };
  }
  
  return { onCooldown: false, remaining: 0 };
}

/**
 * Record pixel placement for session
 */
function recordPlacement(sessionId) {
  cooldowns.set(sessionId, {
    lastPixelTime: Date.now(),
    remaining: Math.ceil(COOLDOWN_MS / 1000),
  });
}

/**
 * Express middleware to enforce cooldown
 */
function rateLimit(req, res, next) {
  const sessionId = req.body?.sessionId || req.params?.sessionId;
  
  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: 'Session ID required',
    });
  }
  
  const { onCooldown, remaining } = isOnCooldown(sessionId);
  
  if (onCooldown) {
    return res.status(429).json({
      success: false,
      error: 'Cooldown active',
      waitSeconds: remaining,
    });
  }
  
  // Store placement time for after successful request
  res.on('finish', () => {
    if (res.statusCode === 200 && req.route?.path === '/pixel') {
      recordPlacement(sessionId);
    }
  });
  
  next();
}

/**
 * Get cooldown status for session
 */
function getCooldownStatus(sessionId) {
  return isOnCooldown(sessionId);
}

/**
 * Clear cooldown for session (admin function)
 */
function clearCooldown(sessionId) {
  cooldowns.delete(sessionId);
}

/**
 * Cleanup old cooldown entries (run every hour)
 */
function cleanupCooldowns() {
  const now = Date.now();
  const maxAge = COOLDOWN_MS * 2; // Keep for 2x cooldown period
  
  cooldowns.forEach((session, sessionId) => {
    if (now - session.lastPixelTime > maxAge) {
      cooldowns.delete(sessionId);
    }
  });
}

// Run cleanup every hour
setInterval(cleanupCooldowns, 3600000);

module.exports = {
  rateLimit,
  isOnCooldown,
  recordPlacement,
  getCooldownStatus,
  clearCooldown,
  cleanupCooldowns,
};
