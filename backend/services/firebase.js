const admin = require('firebase-admin');

let db = null;

function initializeFirebase() {
  if (db) return db;

  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
  };

  // Validate required config
  if (!firebaseConfig.apiKey || !firebaseConfig.databaseURL) {
    throw new Error('Firebase configuration is incomplete. Check environment variables.');
  }

  // Initialize Firebase app - for server-side access to Realtime Database
  // Try application default credentials first, then fall back
  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: firebaseConfig.databaseURL,
      });
    }
  } catch (credError) {
    // If application default credentials fail (common in local/dev),
    // initialize without explicit credential - this works for basic DB operations
    if (admin.apps.length === 0) {
      admin.initializeApp({
        databaseURL: firebaseConfig.databaseURL,
      });
    }
    console.log('⚠️ Using Firebase init without explicit credentials');
  }

  db = admin.database();
  console.log('✅ Firebase initialized');

  return db;
}

function getDatabase() {
  if (!db) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return db;
}

// Canvas operations
async function getCanvas() {
  const snapshot = await getDatabase().ref('canvas/pixels').once('value');
  return snapshot.val() || {};
}

async function setPixel(x, y, color, sessionId, metadata) {
  const pixelRef = getDatabase().ref(`canvas/pixels/${y * 256 + x}`);
  const pixelData = {
    x,
    y,
    color,
    timestamp: Date.now(),
  };
  
  await pixelRef.set(pixelData);
  
  // Update canvas metadata
  await getDatabase().ref('canvas/lastUpdate').set(Date.now());
  await getDatabase().ref('canvas/pixelCount').transaction(count => (count || 0) + 1);
  
  // Log pixel placement
  const logRef = getDatabase().ref(`pixelLog/log_${Date.now()}_${sessionId}`);
  await logRef.set({
    x,
    y,
    color,
    sessionId,
    timestamp: Date.now(),
    ...metadata,
  });
  
  // Add to activity feed
  const activityRef = getDatabase().ref('activity/recent');
  await activityRef.push({
    x,
    y,
    color,
    sessionId,
    timestamp: Date.now(),
  });
  
  // Keep only last 100 activity items
  await activityRef.limitToLast(100).once('value', async snapshot => {
    const updates = {};
    snapshot.forEach(child => {
      updates[child.key] = null;
    });
    // Re-add only the ones we want to keep
  });
  
  return pixelData;
}

async function getPixel(x, y) {
  const snapshot = await getDatabase().ref(`canvas/pixels/${y * 256 + x}`).once('value');
  return snapshot.val();
}

// Session operations
async function getSession(sessionId) {
  const snapshot = await getDatabase().ref(`sessions/${sessionId}`).once('value');
  return snapshot.val();
}

async function createSession(sessionId, data) {
  const sessionRef = getDatabase().ref(`sessions/${sessionId}`);
  const sessionData = {
    ...data,
    firstSeen: Date.now(),
    lastActive: Date.now(),
    totalPixels: 0,
    flagged: false,
    banned: false,
  };
  await sessionRef.set(sessionData);
  return sessionData;
}

async function updateSession(sessionId, updates) {
  const sessionRef = getDatabase().ref(`sessions/${sessionId}`);
  await sessionRef.update({
    ...updates,
    lastActive: Date.now(),
  });
}

async function incrementPixelCount(sessionId) {
  await getDatabase().ref(`sessions/${sessionId}/totalPixels`).transaction(count => (count || 0) + 1);
}

// Activity operations
async function getRecentActivity(limit = 30) {
  const snapshot = await getDatabase().ref('activity/recent')
    .limitToLast(limit)
    .once('value');
  
  const activities = [];
  snapshot.forEach(child => {
    activities.push(child.val());
  });
  
  return activities.reverse(); // Newest first
}

// Stats operations
async function updateStats(pixelData) {
  const statsRef = getDatabase().ref('stats');
  
  // Update total pixels
  await statsRef.child('totalPixels').transaction(count => (count || 0) + 1);
  
  // Update today's pixels
  const today = new Date().toDateString();
  const todayRef = statsRef.child('todayPixels');
  const lastDateRef = statsRef.child('lastResetDate');
  
  const lastDate = (await lastDateRef.once('value')).val();
  if (lastDate !== today) {
    await todayRef.set(1);
    await lastDateRef.set(today);
  } else {
    await todayRef.transaction(count => (count || 0) + 1);
  }
  
  // Update color distribution
  await statsRef.child(`colorDistribution/${pixelData.color}`).transaction(count => (count || 0) + 1);
}

// Moderation operations
async function banSession(sessionId) {
  await getDatabase().ref(`sessions/${sessionId}/banned`).set(true);
  await getDatabase().ref(`sessions/${sessionId}/flagged`).set(true);
  await getDatabase().ref('moderation/bannedSessions').child(sessionId).set(true);
}

async function unbanSession(sessionId) {
  await getDatabase().ref(`sessions/${sessionId}/banned`).set(false);
  await getDatabase().ref('moderation/bannedSessions').child(sessionId).remove();
}

async function flagSession(sessionId) {
  await getDatabase().ref(`sessions/${sessionId}/flagged`).set(true);
  await getDatabase().ref('moderation/flaggedSessions').child(sessionId).set(true);
}

async function getAllSessions() {
  const snapshot = await getDatabase().ref('sessions').once('value');
  return snapshot.val() || {};
}

async function clearPixel(x, y) {
  await getDatabase().ref(`canvas/pixels/${y * 256 + x}`).remove();
  await getDatabase().ref('canvas/lastUpdate').set(Date.now());
}

async function fillRectangle(x, y, width, height, color) {
  const updates = {};
  
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      const pixelX = x + i;
      const pixelY = y + j;
      
      if (pixelX >= 0 && pixelX < 256 && pixelY >= 0 && pixelY < 256) {
        updates[`canvas/pixels/${pixelY * 256 + pixelX}`] = {
          x: pixelX,
          y: pixelY,
          color,
          timestamp: Date.now(),
        };
      }
    }
  }
  
  await getDatabase().ref().update(updates);
  await getDatabase().ref('canvas/lastUpdate').set(Date.now());
}

module.exports = {
  initializeFirebase,
  getDatabase,
  getCanvas,
  setPixel,
  getPixel,
  getSession,
  createSession,
  updateSession,
  incrementPixelCount,
  getRecentActivity,
  updateStats,
  banSession,
  unbanSession,
  flagSession,
  getAllSessions,
  clearPixel,
  fillRectangle,
};
