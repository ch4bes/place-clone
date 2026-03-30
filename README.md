# PLACE Clone - Collaborative Pixel Canvas

A simplified r/place clone built for Neocities, featuring real-time collaboration, bot detection, and community moderation tools.

![Canvas Size](https://img.shields.io/badge/canvas-256x256-blue)
![Colors](https://img.shields.io/badge/colors-16-orange)
![Cooldown](https://img.shields.io/badge/cooldown-2min-green)

---

## 🎨 What is PLACE?

PLACE is a collaborative pixel art experiment where users can place one colored pixel on a shared canvas, then wait 2 minutes before placing another. The result is a constantly evolving piece of community-created art.

Inspired by Reddit's r/place (2017, 2022, 2023), this simplified clone is designed to be hosted on Neocities with a free backend.

---

## ✨ Features

### Core Features
- **256×256 pixel canvas** - Smaller than original (1000×1000) but still fun
- **16-color palette** - Original r/place colors
- **2-minute cooldown** - Per-user rate limiting
- **Real-time updates** - WebSocket-based live sync
- **Pan & zoom** - Smooth canvas navigation
- **Mobile support** - Touch gestures for mobile devices

### Advanced Features
- **Bot detection** - Fingerprinting + behavior analysis
- **Activity feed** - See recent pixel placements
- **Statistics page** - Track community progress
- **Admin panel** - Moderation tools and user management
- **Log export** - Download bot detection data

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Frontend      │◄───────►│   Backend        │◄───────►│   Database      │
│   (Neocities)   │  HTTP/  │   (Render)       │  Realtime│   (Firebase)    │
│   - HTML/CSS/JS │  WS     │   - Node.js      │          │   - Free tier   │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

**Technology Stack:**
- **Frontend:** Vanilla JavaScript + HTML5 Canvas
- **Backend:** Node.js + Express + WebSocket
- **Database:** Firebase Realtime Database
- **Hosting:** Neocities (frontend) + Render (backend)

**All free tier!**

---

## 🚀 Quick Start

### 1. Firebase Setup (5 minutes)

1. Create project at [Firebase Console](https://console.firebase.google.com)
2. Enable Realtime Database (test mode)
3. Copy config values (API key, database URL, project ID)

### 2. Render Deployment (10 minutes)

1. Fork/clone this repository
2. Create Render account at [render.com](https://render.com)
3. Deploy backend service from `backend/` folder
4. Set environment variables:
   ```
   FIREBASE_API_KEY=...
   FIREBASE_DATABASE_URL=...
   ADMIN_PASSWORD=your_secure_password
   CORS_ORIGIN=https://yourusername.neocities.org
   ```

### 3. Neocities Upload (5 minutes)

1. Update `frontend/js/api.js` with your Render URL
2. Upload `frontend/` contents to Neocities
3. Visit your site and place a pixel!

**Detailed instructions:** See [docs/SETUP.md](docs/SETUP.md)

---

## 📁 Project Structure

```
place-clone/
├── frontend/              # Upload to Neocities
│   ├── index.html         # Main canvas page
│   ├── admin.html         # Moderation panel
│   ├── stats.html         # Public statistics
│   ├── js/
│   │   ├── main.js        # App initialization
│   │   ├── canvas.js      # Canvas rendering
│   │   ├── api.js         # Backend communication
│   │   ├── ui.js          # UI components
│   │   ├── fingerprint.js # Device fingerprinting
│   │   └── behavior-tracker.js # Bot detection
│   └── css/
│       └── styles.css     # Responsive styles
│
├── backend/               # Deploy to Render
│   ├── server.js          # Main server
│   ├── routes/            # API endpoints
│   ├── services/          # Business logic
│   ├── middleware/        # Auth, rate limiting
│   └── render.yaml        # Render config
│
└── docs/
    ├── SETUP.md           # Deployment guide
    ├── API.md             # API documentation
    └── BOT_DETECTION.md   # Bot detection details
```

---

## 🎮 How to Play

1. **Enter username** - Identify yourself (saved locally)
2. **Select a color** - Choose from 16 colors
3. **Navigate canvas** - Drag to pan, scroll to zoom
4. **Place a pixel** - Click on canvas to place your pixel
5. **Wait 2 minutes** - Cooldown timer before next pixel
6. **Repeat!** - Watch the canvas evolve

### Mobile Controls
- **One-finger swipe:** Pan canvas
- **Two-finger pinch:** Zoom in/out
- **Double-tap:** Toggle zoom level

---

## 🤖 Bot Detection

The system automatically detects and flags bot activity using:

### Fingerprinting
- Canvas fingerprinting
- WebGL fingerprinting
- Browser attributes (user agent, platform, etc.)

### Behavioral Analysis
- Mouse movement patterns
- Click-to-placement timing
- Zoom/pan interactions
- Placement rate and timing patterns

### Risk Tiers
| Score | Classification | Action |
|-------|---------------|--------|
| 0-25 | Human | No action |
| 26-50 | Likely Human | Monitor |
| 51-75 | Suspicious | Flag for review |
| 76-100 | Likely Bot | Flagged + highlighted |

**Privacy:** All data auto-deleted after 7 days. IP addresses hashed. No personal info stored.

See [docs/BOT_DETECTION.md](docs/BOT_DETECTION.md) for details.

---

## 🛠️ Admin Panel

Access at `https://yourusername.neocities.org/admin.html`

### Features
- **Dashboard** - Overview of sessions, flagged users, activity
- **User Management** - Sort/filter by bot score, ban/unban users
- **Canvas Tools** - Clear pixels, fill rectangles
- **Log Export** - Download bot detection data as JSON

### Moderation Actions
- Ban/unban sessions
- Clear individual pixels
- Fill rectangles (for cleanup)
- Export flagged user data

---

## 📊 Statistics

Public stats page at `https://yourusername.neocities.org/stats.html`

**Displays:**
- Total pixels placed (all-time + today)
- Active users (last 24 hours)
- Canvas completion percentage
- Color distribution chart
- Top 10 contributors
- Bot detection stats

Auto-refreshes every 30 seconds.

---

## 🔧 Configuration

### Canvas Settings

Edit `frontend/js/api.js`:

```javascript
const CONFIG = {
  CANVAS_SIZE: 256,           // 256x256 pixels
  COOLDOWN_SECONDS: 120,      // 2 minutes
  ACTIVITY_FEED_DESKTOP: 30,  // Activity items (desktop)
  ACTIVITY_FEED_MOBILE: 15,   // Activity items (mobile)
};
```

### Color Palette

Original r/place 16-color palette in `frontend/js/main.js`:

```javascript
const PALETTE = [
  '#FFFFFF', '#E4E4E4', '#888888', '#222222',
  '#FFA7D1', '#E50000', '#E59500', '#A06A42',
  '#E5D900', '#94E044', '#02BE01', '#00D3DD',
  '#0083C7', '#0000EA', '#CF6EE4', '#820080'
];
```

### Backend Settings

Environment variables on Render:

```bash
BOT_LOG_RETENTION_DAYS=7
AUTO_CLEANUP_ENABLED=true
CORS_ORIGIN=https://yourusername.neocities.org
```

---

## 🧪 Testing

### Local Development

```bash
# Backend
cd backend
npm install
npm start  # Runs on http://localhost:3000

# Frontend
cd frontend
npx serve  # Or open index.html directly
```

### Production Testing

1. Visit your Neocities page
2. Place a pixel
3. Check cooldown timer
4. Verify real-time updates
5. Check stats page
6. Test admin panel

### Bot Simulation

Test detection with:
- Script that places pixels without mouse movement
- Automated clicks with perfect timing
- No zoom/pan interactions

Check admin panel for high bot scores.

---

## 📈 Scaling & Costs

### Current Setup (Free)
- **Neocities:** Free (1GB storage, 200GB bandwidth)
- **Render:** Free (sleeps after 15min inactivity)
- **Firebase:** Free (1GB storage, 10GB/month bandwidth)

### Estimated Capacity
- **Concurrent users:** 50-100 (free tier)
- **Pixels per day:** 5,000-10,000
- **Storage:** ~50MB for 10,000 pixels

### Upgrade Path (If Needed)
- **Render Hobby:** $7/month (always-on server)
- **Firebase Blaze:** Pay-as-you-go (more bandwidth)
- **Neocities Supporter:** $5/month (more storage)

---

## 🔒 Security

### Implemented
- Server-side rate limiting (2-min cooldown)
- Input validation (coordinates, colors)
- CORS restrictions
- Admin password authentication (bcrypt)
- Session banning capability

### Privacy
- IP addresses hashed (SHA-256)
- No personal identifiers stored
- Auto-deletion after 7 days
- Transparent data collection notice

### Recommendations
- Use strong admin password
- Monitor flagged sessions regularly
- Update Firebase security rules for production
- Consider CAPTCHA for high bot score users

---

## 📝 API Documentation

Full API reference in [docs/API.md](docs/API.md)

### Key Endpoints

```
GET  /api/canvas          - Get full canvas state
POST /api/pixel           - Place a pixel
GET  /api/pixel/activity  - Get recent activity
GET  /api/stats           - Get statistics

POST /api/admin/login     - Admin authentication
GET  /api/admin/users     - List all sessions
POST /api/admin/ban/:id   - Ban a session
GET  /api/admin/export-logs - Export logs
```

### WebSocket Events

```
Client → Server: subscribe, ping
Server → Client: canvas:sync, pixel:placed, cooldown:status, error
```

---

## 🐛 Troubleshooting

### Common Issues

**"Failed to fetch canvas"**
- Check backend URL in `api.js`
- Verify Render deployment succeeded
- Check browser console for errors

**"Server sleeping"**
- Free Render instances sleep after 15min
- First request takes ~30s to wake up
- Consider upgrading to Render Hobby ($7/month)

**"Permission denied" (Firebase)**
- Check security rules are published
- Verify database URL is correct
- Ensure backend has write access

See [docs/SETUP.md](docs/SETUP.md#troubleshooting) for more.

---

## 🤝 Contributing

This is a community project! Feel free to:

- Fork and modify for your own Neocities site
- Report bugs via GitHub Issues
- Suggest new features
- Submit pull requests

### Ideas for Improvement
- [ ] Discord/Slack integration for notifications
- [ ] More color palettes
- [ ] Canvas regions (team territories)
- [ ] Mobile app (React Native / Flutter)
- [ ] Timelapse recording
- [ ] Machine learning bot detection

---

## 📄 License

MIT License - Feel free to use, modify, and deploy!

---

## 🙏 Credits

**Inspired by:**
- Reddit's r/place (2017, 2022, 2023)
- Original source: [reddit-archive/reddit-plugin-place-opensource](https://github.com/reddit-archive/reddit-plugin-place-opensource)

**Built for:**
- [Neocities](https://neocities.org) community
- Free web hosting revival

**Technologies:**
- Firebase Realtime Database
- Render hosting
- HTML5 Canvas API
- WebSocket protocol

---

## 📞 Support

- **Documentation:** Check `/docs` folder
- **Setup Issues:** See [SETUP.md](docs/SETUP.md)
- **API Questions:** See [API.md](docs/API.md)
- **Bot Detection:** See [BOT_DETECTION.md](docs/BOT_DETECTION.md)

---

## 🎯 Roadmap

### Phase 1: Core (✅ Complete)
- [x] Canvas rendering
- [x] Pixel placement API
- [x] Cooldown system
- [x] Real-time updates

### Phase 2: Enhanced (✅ Complete)
- [x] Bot detection
- [x] Admin panel
- [x] Statistics page
- [x] Mobile support

### Phase 3: Future (Planned)
- [ ] Discord webhook notifications
- [ ] Canvas timelapse
- [ ] Team/region system
- [ ] Custom color palettes
- [ ] User profiles

---

**Have fun creating!** 🎨
