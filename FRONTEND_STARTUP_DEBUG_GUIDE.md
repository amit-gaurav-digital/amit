# Frontend Startup & Debug Guide
**Date:** July 19, 2026  
**Issue:** "Nothing visible on frontend"  
**Root Cause:** Services not running

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Start Backend (Terminal 1)
```bash
cd /home/user/amit/backend
npm install --legacy-peer-deps
npm start
```

**Wait for:**
```
Connected to MongoDB
Default roles initialized
Server is running on port 3001
```

### Step 2: Start Frontend (Terminal 2)
```bash
cd /home/user/amit/frontend
npm install --legacy-peer-deps
npm run dev
```

**Wait for:**
```
ready - started server on 0.0.0.0:3000
event - compiled client and server successfully
```

### Step 3: Access Frontend
```
Browser: http://localhost:3000
```

---

## 🔍 Verification Checklist

### Backend Health
```bash
# Check backend is running
curl http://localhost:3001/api/health

# Expected response:
# {"status":"ok","timestamp":"2026-07-19T...","uptime":123.456}
```

### Frontend Accessibility
```bash
# Check frontend serves HTML
curl -s http://localhost:3000 | head -20

# Should show HTML content with <html>, <head>, <body>
```

### Check Environment Variables
```bash
# Frontend env vars
cat /home/user/amit/frontend/.env.local
# Should have: NEXT_PUBLIC_API_URL=http://localhost:3001

# Backend env vars
cat /home/user/amit/backend/.env
# Should have: MONGODB_URI, PORT=3001, FRONTEND_URL
```

---

## 🐛 Troubleshooting

### Issue 1: "Connection refused" on http://localhost:3000
**Solution:**
```bash
# 1. Verify frontend is running
ps aux | grep "next\|node" | grep -v grep

# 2. Check if port 3000 is in use
lsof -i :3000

# 3. Kill existing process if needed
kill -9 <PID>

# 4. Restart frontend
cd /home/user/amit/frontend
npm run dev
```

### Issue 2: "Cannot GET /dashboard" or blank page
**Solution:**
```bash
# 1. Check if logged in
# Frontend requires auth - you need to:
# - Go to http://localhost:3000/login
# - Register or login
# - Then access http://localhost:3000/dashboard

# 2. Check browser localStorage
# Open DevTools (F12) → Application → Storage → Local Storage
# Should have: token, user, refreshToken

# 3. If no token:
# - Go to http://localhost:3000/login
# - Register new account or login
# - Backend must be running for this to work
```

### Issue 3: API errors in console
**Solution:**
```bash
# 1. Check backend logs
# Look at Terminal 1 where backend is running
# Should show: Connected to MongoDB

# 2. Verify API endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/users

# 3. Check CORS
# Backend should allow origin: http://localhost:3000
# Check backend/src/server.js line 14-28
```

### Issue 4: "Module not found" errors
**Solution:**
```bash
# 1. Reinstall dependencies
cd /home/user/amit/frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# 2. Clear Next.js cache
rm -rf .next

# 3. Restart
npm run dev
```

### Issue 5: Database connection errors
**Solution:**
```bash
# 1. Verify MongoDB is accessible
# Default: mongodb://localhost:27017/ai-blogging

# 2. Check MONGODB_URI in backend/.env
cat /home/user/amit/backend/.env | grep MONGODB

# 3. If remote MongoDB:
# - Verify connection string is correct
# - Check network connectivity
# - Verify IP whitelisting

# 4. If local MongoDB:
# - Verify MongoDB is running: mongo --version
# - Start MongoDB: mongod
```

---

## 📊 What Should You See

### After Login
```
Dashboard should display:
✅ Sidebar with navigation menu
✅ Main content area
✅ Blog list or welcome message
✅ Navigation items:
   - Dashboard (📊)
   - Blogs (📝)
   - AI Generator (✨)
   - Schedule (📅)
   - Analytics (📈)
   - Settings (⚙️)
```

### Navigation Test
```
Click on each sidebar item:
✅ Dashboard → /dashboard (overview)
✅ Blogs → /dashboard/blogs (blog list)
✅ AI Generator → /dashboard/ai/generator
✅ Schedule → /dashboard/workflow/analytics
✅ Analytics → /dashboard/analytics
✅ Settings → /dashboard/settings
```

### Feature Test
```
Try these features:
✅ Create a blog (Dashboard → Blogs → New Blog)
✅ View blog list (Dashboard → Blogs)
✅ View analytics (Dashboard → Analytics)
✅ Access settings (Dashboard → Settings)
```

---

## 🔧 Development Server Commands

### Frontend
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Clean cache
rm -rf .next node_modules
npm install --legacy-peer-deps
```

### Backend
```bash
# Start server
npm start

# Start with nodemon (auto-reload)
npm run dev

# Check dependencies
npm list

# Install legacy peer deps
npm install --legacy-peer-deps
```

---

## 🌐 Access Endpoints

### Development (Local)
| Component | URL | Purpose |
|-----------|-----|---------|
| **Frontend** | http://localhost:3000 | Main web app |
| **Login** | http://localhost:3000/login | Authentication |
| **Dashboard** | http://localhost:3000/dashboard | Main dashboard |
| **Analytics** | http://localhost:3000/dashboard/analytics | Analytics dashboard |
| **Blogs** | http://localhost:3000/dashboard/blogs | Blog management |
| **Backend** | http://localhost:3001 | API server |
| **Health Check** | http://localhost:3001/api/health | API status |

### Production (Live)
| Component | URL | Purpose |
|-----------|-----|---------|
| **Frontend** | https://amit-xi.vercel.app | Deployed on Vercel |
| **Login** | https://amit-xi.vercel.app/login | Production login |
| **Dashboard** | https://amit-xi.vercel.app/dashboard | Production dashboard |
| **Analytics** | https://amit-xi.vercel.app/dashboard/analytics | Production analytics |

---

## 🔐 Authentication Flow

### First Time Setup
```
1. Go to http://localhost:3000/login
2. Click "Register" or "Sign up"
3. Enter email and password
4. Verify backend is running (API must respond)
5. Submit registration
6. Login with credentials
7. Should redirect to /dashboard
```

### Check If Logged In
```bash
# Check localStorage
# Open DevTools (F12) → Application → Local Storage → http://localhost:3000

# Should contain:
- token: JWT token starting with eyJ...
- user: {"_id":"...", "email":"..."}
- refreshToken: JWT refresh token
```

### If Not Logged In
```
You'll see:
- Blank page or redirect to /login
- "Loading..." spinner that never completes
- API errors in console
- 401 Unauthorized errors

Solution:
- Clear localStorage: localStorage.clear()
- Go to http://localhost:3000/login
- Register/login again
```

---

## 🔌 API Integration Check

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Get User Profile
```bash
# Replace YOUR_TOKEN with actual JWT token from localStorage
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/users/me
```

### Get Blogs
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/blogs
```

### Check CORS
```bash
# If frontend can't reach backend, CORS might be blocked
# Check browser console for CORS errors
# Verify backend has correct CORS origin configured
```

---

## 📝 Log Files to Check

### Frontend Logs
```
Terminal where npm run dev is running:
- Compilation errors
- Build errors
- Hot reload status
- Server startup messages
```

### Backend Logs
```
Terminal where npm start is running:
- MongoDB connection status
- Route loading status
- API errors
- Database errors
- Error stack traces
```

### Browser Console Logs
```
Press F12 → Console tab:
- JavaScript errors
- API call errors
- CORS errors
- Network errors
- Component errors
```

---

## 🎯 Complete Startup Procedure

### Terminal 1: Backend
```bash
cd /home/user/amit/backend
npm install --legacy-peer-deps
npm start

# Watch for:
✅ Connected to MongoDB
✅ Default roles initialized  
✅ Server is running on port 3001
```

### Terminal 2: Frontend
```bash
cd /home/user/amit/frontend
npm install --legacy-peer-deps
npm run dev

# Watch for:
✅ ready - started server on 0.0.0.0:3000
✅ event - compiled client and server successfully
```

### Terminal 3: Testing
```bash
# Check health
curl http://localhost:3001/api/health

# Check frontend loads
curl -s http://localhost:3000 | head -50

# Open browser
# Navigate to http://localhost:3000
```

### Browser: Access App
1. Go to `http://localhost:3000`
2. You might see "Loading..." or redirect to login
3. If redirected to login, register or login
4. After login, should see dashboard

---

## ✅ Success Indicators

### You'll know it's working when:
- ✅ Frontend loads at http://localhost:3000
- ✅ No blank page or infinite loading
- ✅ Sidebar menu is visible
- ✅ Navigation works (can click menu items)
- ✅ Can see blog list or dashboard content
- ✅ No red errors in browser console
- ✅ No 401/403 authorization errors

### Common Success Path:
1. Start backend → See "Server is running on port 3001"
2. Start frontend → See "started server on 0.0.0.0:3000"
3. Open browser to http://localhost:3000
4. See login page (or dashboard if already logged in)
5. Register/login
6. Redirect to dashboard
7. See sidebar and content

---

## 🆘 Still Not Working?

### Check This Sequence:
1. ✅ Is backend running? `ps aux | grep node`
2. ✅ Is frontend running? `ps aux | grep next`
3. ✅ Can you reach backend? `curl http://localhost:3001/api/health`
4. ✅ Can you reach frontend? `curl http://localhost:3000`
5. ✅ Do you have token? Check DevTools → Application → Local Storage
6. ✅ Are there console errors? Open F12 → Console
7. ✅ Are there API errors? Check Network tab in DevTools

### If All Else Fails:
```bash
# Nuclear option: Clean start
cd /home/user/amit/backend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm start

# In another terminal:
cd /home/user/amit/frontend
rm -rf node_modules package-lock.json .next
npm install --legacy-peer-deps
npm run dev
```

---

## 📞 Need Help?

Check these files for more context:
- Backend setup: `/home/user/amit/backend/README.md`
- Frontend setup: `/home/user/amit/frontend/README.md`
- API documentation: `/home/user/amit/backend/API_DOCS.md` (if exists)
- Deployment guide: `/home/user/amit/DEPLOYMENT_GUIDE.md`

---

**Last Updated:** July 19, 2026  
**Status:** Troubleshooting Guide for Frontend Display Issue
