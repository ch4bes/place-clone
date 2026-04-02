const { getCanvas, getSession } = require('./firebase');

const clients = new Map(); // sessionId -> Set of WebSocket connections
const BROADCAST_MESSAGE = 'pixel:placed';

function setupWebSocket(wss) {
  wss.on('connection', (ws, req) => {
    let sessionId = null;
    let isAlive = true;

    console.log('🔌 New WebSocket connection');

    // Handle incoming messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'subscribe':
            sessionId = data.sessionId;
            if (!sessionId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Session ID required' }));
              return;
            }
            
            // Add client to subscribers
            if (!clients.has(sessionId)) {
              clients.set(sessionId, new Set());
            }
            clients.get(sessionId).add(ws);
            
            // Send full canvas sync
            const canvas = await getCanvas();
            ws.send(JSON.stringify({
              type: 'canvas:sync',
              payload: { pixels: canvas, timestamp: Date.now() }
            }));
            
            // Broadcast updated user count
            broadcastUserCount();
            
            console.log(`📡 Client subscribed: ${sessionId}`);
            break;

          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;

          default:
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: `Unknown message type: ${data.type}` 
            }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    // Handle connection close
    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
      if (sessionId && clients.has(sessionId)) {
        clients.get(sessionId).delete(ws);
        if (clients.get(sessionId).size === 0) {
          clients.delete(sessionId);
        }
      }
      // Broadcast updated user count
      broadcastUserCount();
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Ping-pong for keep-alive
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
  });

  // Cleanup dead connections every 30 seconds
  const interval = setInterval(() => {
    wss.clients.forEach(ws => {
      if (!ws.isAlive) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  // Broadcast user count every 10 seconds
  const userCountInterval = setInterval(() => {
    broadcastUserCount();
  }, 10000);

  wss.on('close', () => {
    clearInterval(interval);
    clearInterval(userCountInterval);
  });

  console.log('✅ WebSocket server setup complete');
}

// Get total number of connected clients
function getConnectedUserCount() {
  let count = 0;
  clients.forEach(clientSet => {
    count += clientSet.size;
  });
  return count;
}

// Broadcast user count to all connected clients
function broadcastUserCount() {
  const count = getConnectedUserCount();
  const message = JSON.stringify({
    type: 'users:count',
    payload: { count }
  });

  clients.forEach((clientSet) => {
    clientSet.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  });
}

// Broadcast pixel placement to all connected clients
function broadcastPixelPlacement(pixelData, username) {
  const message = JSON.stringify({
    type: BROADCAST_MESSAGE,
    payload: {
      x: pixelData.x,
      y: pixelData.y,
      color: pixelData.color,
      username: pixelData.username || username || 'Anonymous',
      timestamp: pixelData.timestamp
    }
  });

  // Broadcast to all connected clients
  clients.forEach((clientSet, sessionId) => {
    clientSet.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  });
}

// Send cooldown update to specific session
function sendCooldownUpdate(sessionId, remaining) {
  const message = JSON.stringify({
    type: 'cooldown:status',
    payload: { remaining }
  });

  if (clients.has(sessionId)) {
    clients.get(sessionId).forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

// Broadcast error to all clients
function broadcastError(message, code) {
  const error = JSON.stringify({
    type: 'error',
    payload: { message, code }
  });

  clients.forEach((clientSet) => {
    clientSet.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(error);
      }
    });
  });
}

module.exports = {
  setupWebSocket,
  broadcastPixelPlacement,
  sendCooldownUpdate,
  broadcastError,
  getConnectedUserCount,
};
