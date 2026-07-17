# Critical Fixes & Checklist

## Issues Found & Fixed

### ✅ Frontend Issues - FIXED
1. **Login page using hardcoded API URLs**
   - **Issue**: Login page made direct axios calls to `/api/auth/login` which resolved to Vercel domain instead of Railway backend
   - **Fix**: Updated to use `authAPI` client that reads `NEXT_PUBLIC_API_URL` environment variable
   - **Status**: FIXED in commit 7211a65

2. **Server-side routing not working**
   - **Issue**: Used client-side router push which failed on Vercel
   - **Fix**: Changed to server-side `redirect()` function
   - **Status**: FIXED in commit 14425ec

### ✅ Backend Issues - FIXED
1. **Missing Blog model**
   - **Issue**: Authorization service tried to import Blog model but it didn't exist
   - **Fix**: Created `/backend/src/models/Blog.js` with complete schema
   - **Status**: FIXED in commit e518b41

2. **Missing blogs route**
   - **Issue**: No `/api/blogs` endpoint
   - **Fix**: Created `/backend/src/routes/blogs.js` with full CRUD operations
   - **Status**: FIXED in commit e518b41

3. **Missing database seeding script**
   - **Issue**: No way to initialize database with default roles and users
   - **Fix**: Created `/backend/scripts/seed-db.js` with admin user and test users
   - **Status**: FIXED

## Railway Configuration Checklist

### Environment Variables
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3001`
- [ ] `MONGODB_URI` = `mongodb+srv://username:password@cluster.mongodb.net/ai-blogging?appName=Cluster0`
- [ ] `JWT_SECRET` = A secure random string (min 32 characters)
- [ ] `JWT_EXPIRY` = `24h`
- [ ] `REFRESH_TOKEN_EXPIRY` = `7d`
- [ ] `PASSWORD_MIN_LENGTH` = `12`
- [ ] `FRONTEND_URL` = Your Vercel domain (e.g., `https://amit-xi.vercel.app`)
- [ ] `ENABLE_USER_REGISTRATION` = `false`
- [ ] `DEFAULT_USER_ROLE` = `viewer`

### Deployment Steps
1. [ ] Push latest code to GitHub branch `claude/ai-blogging-agent-dashboard-hr4p53`
2. [ ] Go to Railway dashboard
3. [ ] Click on "amit" project
4. [ ] Go to Environment Variables
5. [ ] Add all environment variables listed above
6. [ ] Deploy button should trigger automatically
7. [ ] Wait for deployment to complete (green checkmark)
8. [ ] Note your backend URL: `https://your-railway-domain.up.railway.app`

### Verify Backend
```bash
# Test health endpoint
curl https://your-railway-domain.up.railway.app/api/health

# Should return:
# {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z","uptime":123.45}
```

## Vercel Configuration Checklist

### Environment Variables
- [ ] `NEXT_PUBLIC_API_URL` = Your Railway backend URL with `/api` suffix
  - Example: `https://amit-production-ee62.up.railway.app/api`

### Deployment Steps
1. [ ] Latest code is on GitHub branch
2. [ ] Go to Vercel dashboard
3. [ ] Click on "amit" project (Frontend)
4. [ ] Go to Settings > Environment Variables
5. [ ] Update `NEXT_PUBLIC_API_URL` with correct Railway backend URL
6. [ ] Go to Deployments tab
7. [ ] Click "Redeploy" on latest deployment
8. [ ] Wait for deployment to complete (Ready status)
9. [ ] Note your frontend URL: `https://amit-xi.vercel.app`

### Verify Frontend
```
https://amit-xi.vercel.app
# Should redirect to login page

https://amit-xi.vercel.app/login
# Should show login form
```

## MongoDB Atlas Setup Checklist

### Cluster Configuration
- [ ] Cluster created (M0 free tier acceptable)
- [ ] Network Access set to `0.0.0.0/0` (Allow from anywhere)
- [ ] Database user created with strong password
- [ ] Connection string saved: `mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0`

### Create Database
```bash
# After Railway and backend are running, seed the database:
cd backend
npm install
node scripts/seed-db.js
```

## Testing Order

1. **Backend Health Check**
   ```bash
   curl https://[YOUR_RAILWAY_DOMAIN]/api/health
   ```
   Expected: `{"status":"ok"...}`

2. **Frontend Access**
   ```
   https://[YOUR_VERCEL_DOMAIN]/
   ```
   Expected: Redirects to login page

3. **Login Page**
   ```
   https://[YOUR_VERCEL_DOMAIN]/login
   ```
   Expected: Loads login form

4. **Seed Database**
   ```bash
   # From Railway dashboard or local machine with proper .env
   npm install
   node scripts/seed-db.js
   ```
   Expected: Admin user and test users created

5. **Test Login**
   ```
   Email: admin@blog.com
   Password: Admin@2024!
   ```
   Expected: Logs in successfully, redirects to dashboard

## Common Issues & Solutions

### Issue: Backend returns 404 on health check
**Solution**: 
- Check Railway logs for errors
- Verify MONGODB_URI is correct
- Verify JWT_SECRET is set
- Check FRONTEND_URL matches Vercel domain

### Issue: Frontend shows 404 on login page
**Solution**:
- Verify Vercel has redeployed with latest code
- Clear browser cache (Ctrl+Shift+R)
- Check NEXT_PUBLIC_API_URL environment variable
- Check browser console for API errors

### Issue: Login fails with API error
**Solution**:
- Check backend is running: `curl [BACKEND_URL]/api/health`
- Check database has users: Run seed script
- Check backend console logs in Railway
- Verify JWT_SECRET is the same in backend

### Issue: "Cannot connect to MongoDB"
**Solution**:
- Verify MongoDB cluster allows access from 0.0.0.0/0
- Verify database user password is correct
- Test connection string in MongoDB Compass
- Check MONGODB_URI format is correct

## Files Modified/Created

### Created
- `/backend/src/models/Blog.js` - Blog model
- `/backend/src/routes/blogs.js` - Blog API routes
- `/backend/scripts/seed-db.js` - Database seeding script
- `/DEPLOYMENT_GUIDE.md` - Complete deployment documentation
- `/CRITICAL_FIXES_CHECKLIST.md` - This file

### Modified
- `/frontend/app/login/page.js` - Use authAPI client
- `/backend/src/server.js` - Add blogs route
- `/frontend/lib/auth-api.js` - Use NEXT_PUBLIC_API_URL

## Next Steps

1. ✅ Commit and push all changes to GitHub (DONE)
2. ✅ Update Railway environment variables with correct values
3. ✅ Update Vercel environment variables with correct Railway URL
4. ✅ Trigger Vercel redeploy
5. ✅ Test backend health endpoint
6. ✅ Test frontend login page
7. ✅ Seed database with users
8. ✅ Test complete login flow

## Support

If you encounter issues:
1. Check Railway logs (Project > Deployments > Logs)
2. Check Vercel logs (Project > Deployments > Logs)
3. Use browser DevTools (F12) to check API responses
4. Verify all environment variables are set correctly
5. Ensure MongoDB cluster is accessible
