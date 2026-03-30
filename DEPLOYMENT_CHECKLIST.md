# PLACE Clone - Deployment Checklist

Use this checklist to ensure successful deployment!

---

## ✅ Pre-Deployment

### Firebase Setup
- [ ] Created Firebase project
- [ ] Enabled Realtime Database
- [ ] Selected database location (us-central1 recommended)
- [ ] Set security rules to test mode (temporarily)
- [ ] Copied Firebase config values:
  - [ ] `apiKey`
  - [ ] `authDomain`
  - [ ] `databaseURL`
  - [ ] `projectId`
- [ ] Published custom security rules
- [ ] Downloaded service account key (for backend)

### Render Setup
- [ ] Created Render account
- [ ] Created new Web Service
- [ ] Connected GitHub repository
- [ ] Set build command: `npm install`
- [ ] Set start command: `node server.js`
- [ ] Selected free tier
- [ ] Added all environment variables:
  - [ ] `FIREBASE_API_KEY`
  - [ ] `FIREBASE_AUTH_DOMAIN`
  - [ ] `FIREBASE_DATABASE_URL`
  - [ ] `FIREBASE_PROJECT_ID`
  - [ ] `ADMIN_PASSWORD` (strong password!)
  - [ ] `CORS_ORIGIN` (your Neocities URL)
  - [ ] `BOT_LOG_RETENTION_DAYS=7`
  - [ ] `AUTO_CLEANUP_ENABLED=true`

### Neocities Setup
- [ ] Created Neocities account
- [ ] Noted your site URL: `https://________.neocities.org`
- [ ] Prepared to upload frontend files

---

## ✅ Configuration

### Backend Configuration
- [ ] Updated `backend/.env` with actual values
- [ ] Set strong admin password (12+ characters)
- [ ] Set `CORS_ORIGIN` to exact Neocities URL (no trailing slash)
- [ ] Verified all Firebase URLs are correct

### Frontend Configuration
- [ ] Updated `frontend/js/api.js`:
  - [ ] `BACKEND_URL` = your Render URL
  - [ ] `WS_URL` = your Render WebSocket URL
- [ ] Updated `frontend/admin.html` with Render URL
- [ ] Updated `frontend/stats.html` with Render URL
- [ ] Tested that URLs are correct (no typos)

---

## ✅ Deployment

### Backend Deployment (Render)
- [ ] Pushed code to GitHub (if using Git)
- [ ] Triggered deployment on Render
- [ ] Waited for deployment to complete (3-5 minutes)
- [ ] Checked deployment logs for errors
- [ ] Verified health check endpoint works:
  - [ ] Visited `https://your-backend.onrender.com/api/health`
  - [ ] Got response: `{"status":"ok"}`
- [ ] Copied final backend URL

### Frontend Deployment (Neocities)
- [ ] Uploaded all HTML files:
  - [ ] `index.html`
  - [ ] `admin.html`
  - [ ] `stats.html`
- [ ] Uploaded all JS files:
  - [ ] `js/main.js`
  - [ ] `js/api.js`
  - [ ] `js/canvas.js`
  - [ ] `js/ui.js`
  - [ ] `js/fingerprint.js`
  - [ ] `js/behavior-tracker.js`
- [ ] Uploaded CSS file:
  - [ ] `css/styles.css`
- [ ] Verified file structure on Neocities matches local structure

---

## ✅ Testing

### Basic Functionality
- [ ] Visited Neocities page
- [ ] Page loaded without errors
- [ ] Canvas rendered correctly (256×256)
- [ ] Color palette displayed (16 colors)
- [ ] Username input works
- [ ] Cooldown timer shows "Ready!"

### Pixel Placement Test
- [ ] Selected a color
- [ ] Clicked on canvas
- [ ] Pixel appeared immediately
- [ ] Cooldown timer started (120 seconds)
- [ ] Activity feed updated
- [ ] Tried to place another pixel (blocked by cooldown)

### Real-Time Updates Test
- [ ] Opened page in two browser tabs
- [ ] Placed pixel in Tab 1
- [ ] Pixel appeared in Tab 2 automatically (WebSocket working)
- [ ] Activity feed synced between tabs

### Mobile Test (if possible)
- [ ] Tested on mobile device or responsive mode
- [ ] Touch pan works (one finger swipe)
- [ ] Touch zoom works (two finger pinch)
- [ ] Mobile controls visible
- [ ] Palette accessible on mobile

### Admin Panel Test
- [ ] Visited `admin.html`
- [ ] Entered admin password
- [ ] Logged in successfully
- [ ] Dashboard showed statistics
- [ ] User list populated
- [ ] Tried ban/unban (on test session)
- [ ] Tried clear pixel tool
- [ ] Tried export logs

### Stats Page Test
- [ ] Visited `stats.html`
- [ ] Statistics loaded
- [ ] Color distribution displayed
- [ ] Top contributors listed
- [ ] Bot detection stats shown
- [ ] Auto-refresh works (every 30 seconds)

### Bot Detection Test
- [ ] Checked browser console for fingerprint generation
- [ ] Verified behavior tracking active
- [ ] Placed multiple pixels
- [ ] Checked admin panel for bot score
- [ ] Score should be low (0-25) for human behavior

### Cooldown Test
- [ ] Waited for cooldown to expire (2 minutes)
- [ ] Timer reached 0
- [ ] "Ready!" message appeared
- [ ] Could place another pixel

---

## ✅ Post-Deployment

### Security
- [ ] Updated Firebase security rules from test mode to production rules
- [ ] Changed admin password from default (if set)
- [ ] Verified CORS restrictions working
- [ ] Checked that admin endpoints require authentication

### Monitoring
- [ ] Bookmarked Render dashboard for logs
- [ ] Bookmarked Firebase console for database monitoring
- [ ] Set up Render email notifications for deployments
- [ ] Noted Neocities stats URL

### Documentation
- [ ] Saved all URLs in safe place:
  - [ ] Neocities site: `https://____.neocities.org`
  - [ ] Backend: `https://____.onrender.com`
  - [ ] Admin panel: `https://____.neocities.org/admin.html`
  - [ ] Stats: `https://____.neocities.org/stats.html`
- [ ] Saved admin password in password manager
- [ ] Saved Firebase credentials in safe place

### Community
- [ ] Added footer notice about bot detection
- [ ] Prepared community guidelines (optional)
- [ ] Set up Discord/communication channel (optional)
- [ ] Announced launch to Neocities community

---

## 🔧 Troubleshooting Common Issues

### Issue: Canvas doesn't load
**Check:**
- [ ] Backend URL correct in `api.js`?
- [ ] Render deployment successful?
- [ ] No CORS errors in browser console?
- [ ] Backend logs show requests?

### Issue: Can't place pixels
**Check:**
- [ ] Backend logs for errors?
- [ ] Firebase database writable?
- [ ] Session ID being generated?
- [ ] Cooldown not already active?

### Issue: WebSocket not connecting
**Check:**
- [ ] Using `wss://` (not `ws://`)?
- [ ] Backend URL correct?
- [ ] Network allowing WebSocket connections?
- [ ] Render logs show WebSocket connections?

### Issue: Admin panel won't login
**Check:**
- [ ] Admin password matches environment variable?
- [ ] No extra spaces in password?
- [ ] Firebase rules allow writes to `moderation/`?

### Issue: Bot scores all zero
**Check:**
- [ ] `fingerprint.js` loaded?
- [ ] `behavior-tracker.js` loaded?
- [ ] Browser console for errors?
- [ ] Behavior data in API requests?

---

## 📊 Success Metrics

Your deployment is successful when:

- ✅ Canvas loads and displays correctly
- ✅ Can place pixels with 2-minute cooldown
- ✅ Real-time updates work (WebSocket)
- ✅ Activity feed shows recent placements
- ✅ Stats page displays data
- ✅ Admin panel accessible with password
- ✅ Bot detection scoring active
- ✅ Mobile touch controls work
- ✅ No console errors

---

## 🎉 Launch Checklist

When everything is working:

- [ ] Test all features one final time
- [ ] Clear test data from Firebase (if desired)
- [ ] Seed canvas with initial pixels (optional)
- [ ] Announce launch to community
- [ ] Monitor logs for first 24 hours
- [ ] Check admin panel regularly for flagged users
- [ ] Enjoy watching your community create art!

---

## 📞 Support Resources

- **Setup Guide:** [docs/SETUP.md](docs/SETUP.md)
- **API Docs:** [docs/API.md](docs/API.md)
- **Bot Detection:** [docs/BOT_DETECTION.md](docs/BOT_DETECTION.md)
- **Render Docs:** https://render.com/docs
- **Firebase Docs:** https://firebase.google.com/docs
- **Neocities Docs:** https://neocities.org/tutorials

---

**Good luck with your PLACE deployment!** 🎨
