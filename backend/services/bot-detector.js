/**
 * Bot Detection Service
 * Calculates bot score based on user behavior and fingerprinting
 * Score: 0-100 (higher = more likely bot)
 */

function calculateBotScore(session) {
  let score = 0;
  const reasons = [];

  // 1. Timing patterns (max 30 points)
  if (session.pixelIntervals && session.pixelIntervals.length > 2) {
    const stdDev = calculateStdDev(session.pixelIntervals);
    if (stdDev < 100) {
      score += 30;
      reasons.push('Perfect timing pattern (stdDev < 100ms)');
    } else if (stdDev < 500) {
      score += 15;
      reasons.push('Suspicious timing pattern (stdDev < 500ms)');
    }
  }

  // 2. Mouse/touch behavior (max 25 points)
  if (session.mouseMovements === 0 && session.pixelsPlaced > 3) {
    score += 25;
    reasons.push('No mouse movement detected');
  }

  // 3. Click precision (max 20 points)
  if (session.clickPrecision && session.clickPrecision.length > 0) {
    const avgClickTime = average(session.clickPrecision);
    if (avgClickTime < 50) {
      score += 20;
      reasons.push('Instant click-to-placement (< 50ms)');
    } else if (avgClickTime < 200) {
      score += 10;
      reasons.push('Very fast click-to-placement (< 200ms)');
    }
  }

  // 4. User agent analysis (max 15 points)
  if (session.userAgent && isHeadlessBrowser(session.userAgent)) {
    score += 15;
    reasons.push('Headless browser detected');
  }

  // 5. Placement rate (max 10 points)
  if (session.pixelsPerMinute && session.pixelsPerMinute > 0.5) {
    score += 10;
    reasons.push('High placement rate (> 30/hour)');
  }

  // 6. No zoom/pan interactions (max 10 points)
  if (session.zoomPanInteractions === 0 && session.sessionDuration > 60000) {
    score += 10;
    reasons.push('No canvas navigation (> 1 min session)');
  }

  // 7. Fingerprint mismatch (max 15 points)
  if (session.fingerprintMismatch) {
    score += 15;
    reasons.push('Fingerprint inconsistency detected');
  }

  // 8. Touch support mismatch (max 10 points)
  if (session.touchSupport === false && session.touchGestures > 0) {
    score += 10;
    reasons.push('Touch gestures without touch support');
  }

  return {
    score: Math.min(100, score),
    reasons,
    riskTier: getRiskTier(score)
  };
}

function getRiskTier(score) {
  if (score <= 25) return 'human';
  if (score <= 50) return 'likely_human';
  if (score <= 75) return 'suspicious';
  return 'likely_bot';
}

function calculateStdDev(array) {
  if (array.length < 2) return Infinity;
  const mean = average(array);
  const squareDiffs = array.map(value => Math.pow(value - mean, 2));
  return Math.sqrt(average(squareDiffs));
}

function average(array) {
  if (array.length === 0) return 0;
  return array.reduce((a, b) => a + b, 0) / array.length;
}

function isHeadlessBrowser(userAgent) {
  if (!userAgent) return false;
  
  const headlessIndicators = [
    'headless',
    'phantomjs',
    'slimerjs',
    'trident',
    'webkit',
    'electron',
    'jsdom',
    'puppeteer',
    'playwright',
    'selenium',
  ];
  
  const lowerUA = userAgent.toLowerCase();
  return headlessIndicators.some(indicator => lowerUA.includes(indicator));
}

// Analyze mouse movement pattern
function analyzeMousePattern(movements) {
  if (!movements || movements.length < 2) {
    return { isLinear: false, avgSpeed: 0 };
  }

  // Check if movement is perfectly linear (bot-like)
  let isLinear = true;
  let totalDistance = 0;
  
  for (let i = 1; i < movements.length; i++) {
    const dx = movements[i].x - movements[i-1].x;
    const dy = movements[i].y - movements[i-1].y;
    totalDistance += Math.sqrt(dx * dx + dy * dy);
    
    // Check for perfect straight lines
    if (i > 1) {
      const prevDx = movements[i-1].x - movements[i-2].x;
      const prevDy = movements[i-1].y - movements[i-2].y;
      
      // If direction changes are too perfect, it's suspicious
      const angle1 = Math.atan2(dy, dx);
      const angle2 = Math.atan2(prevDy, prevDx);
      const angleDiff = Math.abs(angle1 - angle2);
      
      if (angleDiff > 0.1 && angleDiff < Math.PI - 0.1) {
        isLinear = false;
      }
    }
  }

  return {
    isLinear,
    avgSpeed: totalDistance / movements.length,
    totalDistance
  };
}

// Generate fingerprint hash from device info
function generateFingerprintHash(fingerprint) {
  const crypto = require('crypto');
  const data = JSON.stringify({
    userAgent: fingerprint.userAgent,
    platform: fingerprint.platform,
    language: fingerprint.language,
    screenResolution: fingerprint.screenResolution,
    timezone: fingerprint.timezone,
    hardwareConcurrency: fingerprint.hardwareConcurrency,
    deviceMemory: fingerprint.deviceMemory,
    canvasFingerprint: fingerprint.canvasFingerprint,
    webglFingerprint: fingerprint.webglFingerprint,
  });
  
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

module.exports = {
  calculateBotScore,
  getRiskTier,
  analyzeMousePattern,
  generateFingerprintHash,
  isHeadlessBrowser,
};
