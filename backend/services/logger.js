const { getDatabase } = require('./firebase');

const DEFAULT_RETENTION_DAYS = 7;

/**
 * Log user session data for bot detection
 */
async function logSession(sessionId, data) {
  const sessionRef = getDatabase().ref(`sessions/${sessionId}`);
  await sessionRef.update({
    ...data,
    lastActive: Date.now(),
  });
}

/**
 * Log pixel placement with behavioral metadata
 */
async function logPixelPlacement(sessionId, pixelData, behaviorData) {
  const logRef = getDatabase().ref(`pixelLog/log_${Date.now()}_${sessionId}_${pixelData.x}_${pixelData.y}`);
  await logRef.set({
    sessionId,
    ...pixelData,
    ...behaviorData,
    loggedAt: Date.now(),
  });
}

/**
 * Start automated cleanup job for old logs
 * Runs every 24 hours
 */
function startCleanupJob() {
  const retentionDays = parseInt(process.env.BOT_LOG_RETENTION_DAYS) || DEFAULT_RETENTION_DAYS;
  const cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours

  console.log(`🧹 Starting cleanup job (retention: ${retentionDays} days)`);

  const cleanup = async () => {
    try {
      const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
      console.log(`🧹 Running cleanup, removing data older than ${new Date(cutoffTime).toISOString()}`);

      // Clean up old pixel logs
      const pixelLogRef = getDatabase().ref('pixelLog');
      const pixelSnapshot = await pixelLogRef.once('value');
      
      const pixelUpdates = {};
      pixelSnapshot.forEach(child => {
        const data = child.val();
        if (data.loggedAt && data.loggedAt < cutoffTime) {
          pixelUpdates[child.key] = null;
        }
      });

      if (Object.keys(pixelUpdates).length > 0) {
        await pixelLogRef.update(pixelUpdates);
        console.log(`🧹 Removed ${Object.keys(pixelUpdates).length} old pixel logs`);
      }

      // Clean up old sessions (but keep banned/flagged ones)
      const sessionsRef = getDatabase().ref('sessions');
      const sessionsSnapshot = await sessionsRef.once('value');
      
      const sessionUpdates = {};
      sessionsSnapshot.forEach(child => {
        const data = child.val();
        // Don't delete banned or flagged sessions
        if (data.banned || data.flagged) return;
        
        if (data.lastActive && data.lastActive < cutoffTime) {
          sessionUpdates[child.key] = null;
        }
      });

      if (Object.keys(sessionUpdates).length > 0) {
        await sessionsRef.update(sessionUpdates);
        console.log(`🧹 Removed ${Object.keys(sessionUpdates).length} old sessions`);
      }

      // Clean up old activity feed entries (keep only last 100)
      const activityRef = getDatabase().ref('activity/recent');
      const activitySnapshot = await activityRef.orderByKey().once('value');
      
      const activityKeys = [];
      activitySnapshot.forEach(child => {
        activityKeys.push(child.key);
      });

      if (activityKeys.length > 100) {
        const toDelete = activityKeys.length - 100;
        const activityUpdates = {};
        for (let i = 0; i < toDelete; i++) {
          activityUpdates[activityKeys[i]] = null;
        }
        await activityRef.update(activityUpdates);
        console.log(`🧹 Removed ${toDelete} old activity entries`);
      }

      console.log('✅ Cleanup complete');
    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  };

  // Run cleanup on startup
  cleanup();

  // Then run every 24 hours
  setInterval(cleanup, cleanupInterval);

  return cleanup;
}

/**
 * Export logs for analysis
 */
async function exportLogs(options = {}) {
  const {
    startDate,
    endDate,
    minBotScore,
    flaggedOnly,
    sessionId
  } = options;

  const results = {
    sessions: [],
    pixelLogs: [],
    exportedAt: Date.now(),
  };

  // Export sessions
  const sessionsRef = getDatabase().ref('sessions');
  const sessionsSnapshot = await sessionsRef.once('value');
  
  sessionsSnapshot.forEach(child => {
    const data = child.val();
    
    // Apply filters
    if (sessionId && child.key !== sessionId) return;
    if (flaggedOnly && !data.flagged) return;
    if (data.botScore && minBotScore && data.botScore < minBotScore) return;
    if (startDate && data.firstSeen < startDate) return;
    if (endDate && data.firstSeen > endDate) return;
    
    results.sessions.push({
      sessionId: child.key,
      ...data,
    });
  });

  // Export pixel logs
  const pixelLogRef = getDatabase().ref('pixelLog');
  const pixelSnapshot = await pixelLogRef.once('value');
  
  pixelSnapshot.forEach(child => {
    const data = child.val();
    
    // Apply filters
    if (sessionId && data.sessionId !== sessionId) return;
    if (startDate && data.timestamp < startDate) return;
    if (endDate && data.timestamp > endDate) return;
    
    results.pixelLogs.push({
      logId: child.key,
      ...data,
    });
  });

  return results;
}

module.exports = {
  logSession,
  logPixelPlacement,
  startCleanupJob,
  exportLogs,
};
