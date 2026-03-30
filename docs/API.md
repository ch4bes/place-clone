# PLACE Clone - API Documentation

Complete API reference for the PLACE collaborative pixel canvas.

---

## Base URLs

**Production (Render):**
- REST API: `https://your-backend.onrender.com/api`
- WebSocket: `wss://your-backend.onrender.com/ws`

**Local Development:**
- REST API: `http://localhost:3000/api`
- WebSocket: `ws://localhost:3000/ws`

---

## Authentication

### Session-Based (Frontend Users)

No authentication required for public endpoints. Sessions are identified by `sessionId` (generated client-side, stored in localStorage).

### Admin Authentication

Admin endpoints require Bearer token authentication.

**Login:**
```http
POST /api/admin/login
Content-Type: application/json

{
  "password": "your_admin_password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "expiresIn": 3600
}
```

**Usage:**
```http
GET /api/admin/users
Authorization: Bearer eyJhbGc...
```

---

## Public Endpoints

### Canvas Operations

#### GET /api/canvas

Get full canvas state as array of pixels.

**Response:**
```json
{
  "success": true,
  "pixels": [
    {
      "x": 50,
      "y": 30,
      "color": 3,
      "timestamp": 1234567890
    }
  ],
  "count": 1542,
  "timestamp": 1234567890
}
```

#### GET /api/canvas/bitmap

Get compressed bitmap representation (smaller payload).

**Response:**
```json
{
  "success": true,
  "bitmap": "base64_encoded_bitmap_data",
  "width": 256,
  "height": 256,
  "timestamp": 1234567890
}
```

**Bitmap Format:**
- 2 pixels per byte (4 bits each)
- Base64 encoded
- 32KB total size (256×256÷2)

---

### Pixel Operations

#### POST /api/pixel

Place a pixel on the canvas.

**Request:**
```json
{
  "x": 50,
  "y": 30,
  "color": 3,
  "sessionId": "session_abc123",
  "fingerprint": { /* device fingerprint */ },
  "behavior": { /* behavior data */ },
  "username": "PlayerOne"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "pixel": {
    "x": 50,
    "y": 30,
    "color": 3,
    "timestamp": 1234567890
  },
  "waitSeconds": 120,
  "botScore": 15,
  "riskTier": "human"
}
```

**Cooldown Response (429):**
```json
{
  "success": false,
  "error": "Cooldown active",
  "waitSeconds": 95
}
```

**Banned Response (403):**
```json
{
  "success": false,
  "error": "Session banned",
  "waitSeconds": -1
}
```

**Validation Errors (400):**
```json
{
  "success": false,
  "error": "Invalid coordinates",
  "waitSeconds": 0
}
```

#### GET /api/pixel/:x/:y

Get metadata for a specific pixel.

**Request:**
```
GET /api/pixel/50/30
```

**Response (pixel exists):**
```json
{
  "success": true,
  "pixel": {
    "x": 50,
    "y": 30,
    "color": 3,
    "timestamp": 1234567890
  }
}
```

**Response (no pixel):**
```json
{
  "success": true,
  "pixel": null,
  "message": "No pixel at this location"
}
```

#### GET /api/pixel/cooldown/:sessionId

Check remaining cooldown time for a session.

**Request:**
```
GET /api/pixel/cooldown/session_abc123
```

**Response (cooldown active):**
```json
{
  "success": true,
  "remaining": 95,
  "canPlace": false
}
```

**Response (ready):**
```json
{
  "success": true,
  "remaining": 0,
  "canPlace": true
}
```

#### GET /api/pixel/activity

Get recent activity feed.

**Query Parameters:**
- `limit` (optional): Number of items (default: 30)

**Request:**
```
GET /api/pixel/activity?limit=20
```

**Response:**
```json
{
  "success": true,
  "activity": [
    {
      "x": 50,
      "y": 30,
      "color": 3,
      "sessionId": "session_abc123",
      "username": "PlayerOne",
      "timestamp": 1234567890
    }
  ],
  "count": 20
}
```

---

### Statistics

#### GET /api/stats

Get public statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalPixels": 15420,
    "todayPixels": 523,
    "activeSessions24h": 47,
    "totalSessions": 1250,
    "canvasCompletion": {
      "percentage": "23.45",
      "totalPixels": 15420,
      "canvasSize": 65536
    },
    "colorDistribution": {
      "0": 3200,
      "1": 1800,
      "2": 950
    },
    "topContributors": [
      {
        "sessionId": "session_abc123",
        "username": "PlayerOne",
        "pixels": 142,
        "botScore": 15
      }
    ],
    "botDetection": {
      "flagged": 12,
      "banned": 3
    }
  },
  "timestamp": 1234567890
}
```

#### GET /api/stats/top

Get top contributors.

**Query Parameters:**
- `limit` (optional): Number of contributors (default: 10)

**Response:**
```json
{
  "success": true,
  "contributors": [
    {
      "sessionId": "session_abc123",
      "username": "PlayerOne",
      "pixels": 142,
      "botScore": 15
    }
  ]
}
```

#### GET /api/stats/colors

Get color distribution breakdown.

**Response:**
```json
{
  "success": true,
  "colors": [
    {
      "color": 0,
      "count": 3200,
      "percentage": "20.75"
    }
  ],
  "total": 15420
}
```

---

## Admin Endpoints

All admin endpoints require `Authorization: Bearer <token>` header.

### Session Management

#### GET /api/admin/users

List all user sessions.

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "sessionId": "session_abc123",
      "username": "PlayerOne",
      "botScore": 15,
      "riskTier": "human",
      "totalPixels": 5,
      "lastActive": 1234567900,
      "firstSeen": 1234567890,
      "flagged": false,
      "banned": false
    }
  ],
  "count": 1250
}
```

#### GET /api/admin/flagged

Get only flagged sessions.

**Response:**
```json
{
  "success": true,
  "sessions": [ /* ... */ ],
  "count": 12
}
```

#### POST /api/admin/ban/:sessionId

Ban a user session.

**Request:**
```
POST /api/admin/ban/session_abc123
```

**Response:**
```json
{
  "success": true,
  "message": "Session banned"
}
```

#### POST /api/admin/unban/:sessionId

Unban a user session.

**Response:**
```json
{
  "success": true,
  "message": "Session unbanned"
}
```

---

### Canvas Tools

#### POST /api/admin/clear-pixel

Clear a single pixel.

**Request:**
```json
{
  "x": 50,
  "y": 30
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pixel cleared"
}
```

#### POST /api/admin/fill-rect

Fill rectangle with color.

**Request:**
```json
{
  "x": 0,
  "y": 0,
  "width": 50,
  "height": 50,
  "color": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Rectangle filled"
}
```

**Validation:**
- `x`, `y`: 0-255
- `width`, `height`: 1-256
- `color`: 0-15

---

### Data Export

#### GET /api/admin/export-logs

Export logs as JSON.

**Query Parameters:**
- `startDate`: Unix timestamp (optional)
- `endDate`: Unix timestamp (optional)
- `minBotScore`: Minimum bot score (optional)
- `flaggedOnly`: true/false (optional)
- `sessionId`: Specific session ID (optional)

**Request:**
```
GET /api/admin/export-logs?flaggedOnly=true&minBotScore=50
```

**Response:**
```json
{
  "success": true,
  "sessions": [ /* ... */ ],
  "pixelLogs": [ /* ... */ ],
  "exportedAt": 1234567890
}
```

---

## WebSocket API

### Connection

```javascript
const ws = new WebSocket('wss://your-backend.onrender.com/ws');
```

### Client → Server Messages

#### Subscribe to Updates

```json
{
  "type": "subscribe",
  "sessionId": "session_abc123"
}
```

#### Ping (Keep-Alive)

```json
{
  "type": "ping"
}
```

### Server → Client Messages

#### Canvas Sync (on connect)

```json
{
  "type": "canvas:sync",
  "payload": {
    "pixels": [ /* all pixels */ ],
    "timestamp": 1234567890
  }
}
```

#### Pixel Placed (broadcast)

```json
{
  "type": "pixel:placed",
  "payload": {
    "x": 50,
    "y": 30,
    "color": 3,
    "username": "PlayerOne",
    "timestamp": 1234567890
  }
}
```

#### Cooldown Update

```json
{
  "type": "cooldown:status",
  "payload": {
    "remaining": 95
  }
}
```

#### Error

```json
{
  "type": "error",
  "payload": {
    "message": "Error message",
    "code": "ERROR_CODE"
  }
}
```

#### Pong (Keep-Alive Response)

```json
{
  "type": "pong"
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 401 | Unauthorized (admin endpoints) |
| 403 | Forbidden (banned session) |
| 404 | Not Found |
| 429 | Too Many Requests (cooldown active) |
| 500 | Internal Server Error |

### Application Error Codes

| Code | Description |
|------|-------------|
| `COOLDOWN_ACTIVE` | User must wait before placing another pixel |
| `SESSION_BANNED` | Session has been banned by admin |
| `INVALID_COORDS` | X or Y coordinates out of range (0-255) |
| `INVALID_COLOR` | Color index out of range (0-15) |
| `INVALID_SESSION` | Session ID missing or invalid |
| `RATE_LIMITED` | Too many requests from same session |

---

## Rate Limits

### Pixel Placement

- **Cooldown:** 120 seconds (2 minutes) per session
- **Enforcement:** Server-side
- **Reset:** Automatic after cooldown period

### API Requests

- **Public endpoints:** No strict limit (reasonable use)
- **Admin endpoints:** 100 requests/minute
- **WebSocket:** 10 messages/second

### Bandwidth

- **Canvas bitmap:** ~32KB per request
- **Full canvas JSON:** ~200-500KB (varies by activity)
- **Activity feed:** ~5-10KB per request

---

## Data Structures

### Pixel Object

```typescript
{
  x: number;          // 0-255
  y: number;          // 0-255
  color: number;      // 0-15
  timestamp: number;  // Unix timestamp (ms)
}
```

### Session Object

```typescript
{
  sessionId: string;
  username: string;
  fingerprint: {
    userAgent: string;
    platform: string;
    screenResolution: string;
    timezone: string;
    hardwareConcurrency: number;
    deviceMemory: number;
    canvasFingerprint: string;
    webglFingerprint: string;
  };
  behavior: {
    mouseMovements: number;
    touchGestures: number;
    clickPrecision: number[];
    pixelPlacements: number;
    colorChangeFrequency: number;
    zoomPanInteractions: number;
    sessionDuration: number;
    idleTime: number;
    pixelsPerMinute: number;
  };
  botScore: number;       // 0-100
  riskTier: string;       // 'human' | 'likely_human' | 'suspicious' | 'likely_bot'
  totalPixels: number;
  firstSeen: number;
  lastActive: number;
  flagged: boolean;
  banned: boolean;
}
```

### Activity Object

```typescript
{
  x: number;
  y: number;
  color: number;
  sessionId: string;
  username: string;
  timestamp: number;
}
```

---

## Color Palette

Standard 16-color palette (original r/place):

| Index | Hex | Name |
|-------|-----|------|
| 0 | #FFFFFF | White |
| 1 | #E4E4E4 | Light Gray |
| 2 | #888888 | Gray |
| 3 | #222222 | Black |
| 4 | #FFA7D1 | Pink |
| 5 | #E50000 | Red |
| 6 | #E59500 | Orange |
| 7 | #A06A42 | Brown |
| 8 | #E5D900 | Yellow |
| 9 | #94E044 | Lime |
| 10 | #02BE01 | Green |
| 11 | #00D3DD | Cyan |
| 12 | #0083C7 | Blue |
| 13 | #0000EA | Dark Blue |
| 14 | #CF6EE4 | Magenta |
| 15 | #820080 | Purple |

---

## Code Examples

### JavaScript (Frontend)

```javascript
// Place a pixel
async function placePixel(x, y, color, sessionId) {
  const response = await fetch('https://your-backend.onrender.com/api/pixel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      x, y, color, sessionId,
      fingerprint: await getFingerprint(),
      behavior: getBehaviorData()
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Pixel placed!');
    console.log('Cooldown:', data.waitSeconds, 'seconds');
  } else {
    console.error('Error:', data.error);
  }
}

// WebSocket connection
const ws = new WebSocket('wss://your-backend.onrender.com/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    sessionId: 'session_abc123'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'pixel:placed') {
    console.log('New pixel:', data.payload);
  }
};
```

### Python (Backend Script)

```python
import requests

BACKEND_URL = 'https://your-backend.onrender.com/api'

# Get canvas
response = requests.get(f'{BACKEND_URL}/canvas')
canvas_data = response.json()
print(f"Total pixels: {canvas_data['count']}")

# Get stats
response = requests.get(f'{BACKEND_URL}/stats')
stats = response.json()
print(f"Active users: {stats['stats']['activeSessions24h']}")

# Admin login
response = requests.post(f'{BACKEND_URL}/admin/login', json={
    'password': 'your_password'
})
token = response.json()['token']

# Get flagged users
headers = {'Authorization': f'Bearer {token}'}
response = requests.get(f'{BACKEND_URL}/admin/flagged', headers=headers)
flagged = response.json()
print(f"Flagged sessions: {flagged['count']}")
```

### cURL (Command Line)

```bash
# Get canvas
curl https://your-backend.onrender.com/api/canvas

# Place pixel
curl -X POST https://your-backend.onrender.com/api/pixel \
  -H "Content-Type: application/json" \
  -d '{"x":50,"y":30,"color":3,"sessionId":"session_abc123"}'

# Get stats
curl https://your-backend.onrender.com/api/stats

# Admin login
curl -X POST https://your-backend.onrender.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your_password"}'

# Export logs (admin)
curl https://your-backend.onrender.com/api/admin/export-logs?flaggedOnly=true \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Support

For API issues or questions:
- Check documentation in `/docs` folder
- Review backend logs on Render
- Contact project maintainer
