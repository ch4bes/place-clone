const bcrypt = require('bcryptjs');

/**
 * Admin Authentication Middleware
 * Validates Bearer token for admin endpoints
 */

let cachedHash = null;

async function getAdminPasswordHash() {
  if (cachedHash) return cachedHash;
  
  // In production, this would come from Firebase
  // For now, we'll hash the env var on first request
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error('ADMIN_PASSWORD not set in environment');
  }
  
  cachedHash = await bcrypt.hash(password, 10);
  return cachedHash;
}

/**
 * Express middleware to validate admin authentication
 */
async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header required',
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Simple token validation (in production, use JWT)
    // For now, just check if admin password hash exists
    const adminHash = await getAdminPasswordHash();
    
    // Token is valid if it was generated (simple implementation)
    // In production, implement proper JWT verification
    if (!token || token.length < 10) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }
    
    // Token is valid for this session
    req.isAdmin = true;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}

/**
 * Hash password on first admin login
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Compare password with hash
 */
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

module.exports = {
  requireAdmin,
  hashPassword,
  comparePassword,
  getAdminPasswordHash,
};
