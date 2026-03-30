# PLACE Clone - Setup and Deployment Guide

A simplified r/place clone for Neocities with bot detection, built with:
- **Frontend:** HTML5 Canvas + Vanilla JavaScript (hosted on Neocities)
- **Backend:** Node.js + Express + WebSocket (hosted on Render)
- **Database:** Firebase Realtime Database (free tier)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Setup](#firebase-setup)
3. [Render Deployment](#render-deployment)
4. [Neocities Upload](#neocities-upload)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Admin Panel](#admin-panel)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js 18+ installed locally
- Firebase account (free)
- Render account (free)
- Neocities account (free)
- Git (optional, for version control)

---

## Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name: `place-clone` (or your preferred name)
4. Disable Google Analytics (not needed)
5. Click "Create project"

### Step 2: Enable Realtime Database

1. In Firebase Console, click "Realtime Database" in left sidebar
2. Click "Create database"
3. Choose **test mode** for security rules (we'll customize them)
4. Select location: **us-central1** (or closest to your audience)
5. Click "Enable"

### Step 3: Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click "</>" (Web) icon
4. Register app name: "PLACE Frontend"
5. Copy the `firebaseConfig` object values:
   - `apiKey`
   - `authDomain`
   - `databaseURL`
   - `projectId`

### Step 4: Deploy Security Rules

1. In Firebase Console, go to Realtime Database → Rules
2. Replace default rules with these:

```json
{
  "rules": {
    "canvas": {
      ".read": true,
      ".write": false
    },
    "sessions": {
      ".read": false,
      ".write": false
    },
    "pixelLog": {
      ".read": false,
      ".write": false
    },
    "activity": {
      ".read": true,
      ".write": false
    },
    "stats": {
      ".read": true,
      ".write": false
    },
    "moderation": {
      ".read": false,
      ".write": false
    }
  }
}
```

3. Click "Publish"

### Step 5: Enable Service Account Authentication

For the backend to access Firebase:

1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. **Important:** Keep this file secure, never commit to Git

---

## Render Deployment

### Step 1: Prepare Backend

1. Navigate to backend folder:
   ```bash
   cd place-clone/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from template:
   ```bash
   cp .env.example .env
   ```

4. Fill in `.env` with your Firebase credentials and admin password

### Step 2: Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository:
   - If not on GitHub yet:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     # Push to GitHub
     ```
4. Select your repository
5. Configure:
   - **Name:** `place-backend`
   - **Region:** `us-east-1` (default)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** `Free`

6. Add Environment Variables (click "Advanced" → "Add environment variable"):
   ```
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
   FIREBASE_PROJECT_ID=your-project-id
   ADMIN_PASSWORD=your_secure_password
   CORS_ORIGIN=https://yourusername.neocities.org
   BOT_LOG_RETENTION_DAYS=7
   AUTO_CLEANUP_ENABLED=true
   ```

7. Click "Create web service"

### Step 3: Wait for Deployment

- Initial deployment takes 3-5 minutes
- Free tier instances sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up

### Step 4: Get Backend URL

After deployment:
- Copy your Render URL (e.g., `https://place-backend-xyz.onrender.com`)
- You'll need this for frontend configuration

---

## Neocities Upload

### Step 1: Update Frontend Configuration

1. Open `frontend/js/api.js`
2. Replace placeholder URLs with your actual Render URL:
   ```javascript
   const CONFIG = {
     BACKEND_URL: 'https://your-actual-backend.onrender.com',
     WS_URL: 'wss://your-actual-backend.onrender.com',
     // ... rest of config
   };
   ```

3. Do the same for `frontend/admin.html` and `frontend/stats.html`

### Step 2: Upload Files

**Option A: Web Interface**

1. Go to [Neocities Dashboard](https://neocities.org/dashboard)
2. Click "Upload files"
3. Upload these files:
   - `index.html`
   - `admin.html`
   - `stats.html`
   - `js/main.js`
   - `js/api.js`
   - `js/canvas.js`
   - `js/ui.js`
   - `js/fingerprint.js`
   - `js/behavior-tracker.js`
   - `css/styles.css`

**Option B: Neocities CLI**

```bash
npm install -g neocities-cli
neocities apikey
# Enter your API key
neocities upload index.html
neocities upload admin.html
neocities upload stats.html
neocities upload js/main.js
# ... etc for all files
```

**Option C: Drag and Drop**

1. Go to your Neocities site file manager
2. Drag files from your computer to the browser

### Step 3: Organize Files

Ensure file structure on Neocities matches:
```
/
├── index.html
├── admin.html
├── stats.html
├── js/
│   ├── main.js
│   ├── api.js
│   ├── canvas.js
│   ├── ui.js
│   ├── fingerprint.js
│   └── behavior-tracker.js
└── css/
    └── styles.css
```

---

## Configuration

### Canvas Seeding (Optional)

To seed the canvas with initial random pixels:

1. Open browser console on your Neocities page
2. Run:
   ```javascript
   // Seed 150 random pixels
   for (let i = 0; i < 150; i++) {
     const x = Math.floor(Math.random() * 256);
     const y = Math.floor(Math.random() * 256);
     const color = Math.floor(Math.random() * 16);
     // This would call the API - implement as needed
   }
   ```

Or use the admin panel fill-rect tool to create initial designs.

### Admin Password

- Default: Set via `ADMIN_PASSWORD` environment variable on Render
- To change: Update environment variable and redeploy
- First login creates the hash in Firebase

---

## Testing

### Local Testing

1. **Backend:**
   ```bash
   cd backend
   npm install
   npm start
   # Server runs on http://localhost:3000
   ```

2. **Frontend:**
   - Open `frontend/index.html` in browser
   - Or use a local server:
     ```bash
     npx serve frontend
     ```

3. **Test pixel placement:**
   - Select a color
   - Click on canvas
   - Should see 2-minute cooldown
   - Check Firebase for pixel data

### Production Testing

1. Visit your Neocities page
2. Enter username
3. Place a pixel
4. Verify:
   - Cooldown timer works
   - Pixel appears on canvas
   - Activity feed updates
   - Stats page shows data

### Bot Simulation

Test bot detection with these behaviors:

1. **Human-like:**
   - Move mouse before clicking
   - Wait 2+ minutes between pixels
   - Use zoom/pan
   - Change colors frequently

2. **Bot-like:**
   - No mouse movement
   - Instant clicks
   - Perfect timing intervals
   - No navigation

Check admin panel to see bot scores.

---

## Admin Panel

### Access

1. Go to: `https://yourusername.neocities.org/admin.html`
2. Enter admin password
3. Click "Login"

### Features

**Dashboard:**
- Total sessions, flagged users, banned users, active users

**User Management:**
- Sort by bot score, username, pixels, etc.
- Filter by risk level
- Ban/unban users
- View session details

**Canvas Tools:**
- Clear single pixels
- Fill rectangles
- Export logs

**Logs Export:**
- Download all logs as JSON
- Filter by flagged sessions only
- Analyze bot detection data

---

## Troubleshooting

### Backend Issues

**"Cannot connect to Firebase"**
- Check Firebase credentials in Render environment variables
- Ensure Realtime Database is enabled
- Verify service account has database access

**"Server sleeping"**
- Free tier Render instances sleep after 15min
- First request after sleep takes ~30s
- Consider upgrading to Render Hobby ($7/month) for always-on

**CORS errors**
- Verify `CORS_ORIGIN` matches your Neocities URL exactly
- Must include `https://` and no trailing slash

### Frontend Issues

**"Failed to fetch canvas"**
- Check backend URL in `api.js`
- Ensure Render deployment succeeded
- Check browser console for errors

**WebSocket not connecting**
- Verify `WS_URL` uses `wss://` (secure)
- Check Render logs for WebSocket errors
- Some networks block WebSocket connections

**Canvas not rendering**
- Check browser console for JavaScript errors
- Ensure all JS files uploaded correctly
- Try clearing browser cache

### Firebase Issues

**"Permission denied"**
- Check security rules are published
- Verify database URL is correct
- Ensure backend service account has write access

**Data not syncing**
- Check Firebase Realtime Database connection
- Verify writes are happening in Render logs
- Check Firebase usage limits (free tier: 100 concurrent connections)

### Bot Detection Issues

**All scores are 0**
- Ensure `fingerprint.js` and `behavior-tracker.js` are loaded
- Check browser console for errors
- Verify behavior data is being sent in API requests

**Logs not persisting**
- Check Firebase write permissions
- Verify cleanup job isn't deleting too aggressively
- Check `BOT_LOG_RETENTION_DAYS` setting

---

## Monitoring

### Render Logs

1. Go to Render Dashboard
2. Select your service
3. Click "Logs" tab
4. View real-time server logs

### Firebase Data

1. Go to Firebase Console
2. Realtime Database
3. View live data updates
4. Use "Usage" tab to monitor bandwidth

### Neocities Traffic

1. Neocities Dashboard
2. Site stats
3. View visitor counts

---

## Scaling Considerations

### When to Upgrade

**Render ($7/month):**
- More than 50 concurrent users
- Need always-on server
- Want faster wake-up times

**Firebase (Pay-as-you-go):**
- Approaching 1GB storage limit
- Exceeding 10GB/month bandwidth
- Need more than 100 concurrent connections

**Neocities ($5/month supporter):**
- Need more than 1GB storage
- Want faster upload speeds
- Support the platform

### Performance Optimization

1. **Reduce WebSocket broadcasts** if bandwidth is high
2. **Increase cooldown time** to reduce pixel rate
3. **Compress canvas data** more aggressively
4. **Cache static assets** on Neocities

---

## Security Notes

1. **Admin Password:**
   - Use a strong, unique password
   - Never share publicly
   - Change periodically

2. **Firebase Rules:**
   - Keep writes restricted to server-only
   - Never expose admin endpoints to client

3. **User Data:**
   - IP addresses are hashed (SHA-256)
   - Logs auto-delete after 7 days
   - No personal information stored

4. **Rate Limiting:**
   - 2-minute cooldown enforced server-side
   - Additional rate limiting can be added if needed

---

## Support

- **GitHub Issues:** For bug reports and feature requests
- **Documentation:** Check `/docs` folder for API details
- **Bot Detection:** See `BOT_DETECTION.md` for scoring algorithm

---

## License

MIT License - Feel free to modify and deploy your own version!

---

## Credits

Inspired by Reddit's r/place (2017, 2022, 2023)
Built for Neocities community
