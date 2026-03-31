const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initializeFirebase } = require('./services/firebase');
const canvasRoutes = require('./routes/canvas');
const pixelRoutes = require('./routes/pixels');
const adminRoutes = require('./routes/admin');
const statsRoutes = require('./routes/stats');
const { setupWebSocket } = require('./services/websocket');
const { startCleanupJob } = require('./services/logger');

const app = express();
const server = http.createServer(app);

// Initialize Firebase
initializeFirebase();

// Middleware
const corsOrigin = process.env.CORS_ORIGIN || '*';
let allowedOrigins = corsOrigin.split(',').map(o => o.trim());

// Also add the domain without path
const domainOrigins = allowedOrigins.map(o => {
  try {
    const url = new URL(o);
    return url.origin;
  } catch {
    return o;
  }
});
allowedOrigins = [...new Set([...allowedOrigins, ...domainOrigins])];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(null, true); // Allow for debugging
    }
  },
  credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/canvas', canvasRoutes);
app.use('/api/pixel', pixelRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// WebSocket setup
const wss = new WebSocket.Server({ server, path: '/ws' });
setupWebSocket(wss);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 WebSocket server ready`);
  
  // Start cleanup job for old logs
  startCleanupJob();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, wss };
