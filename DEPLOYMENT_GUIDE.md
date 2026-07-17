# AI Blogging System - Deployment Guide

## Overview
This guide covers setting up the complete AI blogging system with frontend (Vercel), backend (Railway), and database (MongoDB Atlas).

## Prerequisites
- MongoDB Atlas account and connection string
- Vercel account connected to GitHub
- Railway account
- GitHub account with the repository

## 1. MongoDB Atlas Setup

### Create a Cluster
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new project
3. Create a cluster (use M0 free tier)
4. Set Network Access to "Allow Access from Anywhere" (0.0.0.0/0)
5. Create a database user with password

### Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string: `mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0`
4. Replace `<password>` with your database password

## 2. Backend Deployment (Railway)

### Environment Variables Required
```
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-blogging?appName=Cluster0
JWT_SECRET=your-very-secure-random-secret-key-here
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d
PASSWORD_MIN_LENGTH=12
FRONTEND_URL=https://your-vercel-domain.vercel.app
ENABLE_USER_REGISTRATION=false
DEFAULT_USER_ROLE=viewer
OPENAI_API_KEY=sk-your-openai-key-here (optional)
```

### Deploy Steps
1. Go to [Railway.app](https://railway.app)
2. Create a new project
3. Connect your GitHub repository
4. Select the repository
5. Add environment variables (see above)
6. Railway will automatically deploy
7. Your backend URL will be: `https://your-railway-domain.up.railway.app`

### Verify Backend
- Health check: `curl https://your-railway-domain.up.railway.app/api/health`
- Should return: `{"status":"ok","timestamp":"...","uptime":...}`

## 3. Frontend Deployment (Vercel)

### Environment Variables Required
```
NEXT_PUBLIC_API_URL=https://your-railway-domain.up.railway.app/api
```

### Deploy Steps
1. Go to [Vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Select the `frontend` directory as root
4. Add environment variable: `NEXT_PUBLIC_API_URL`
5. Deploy
6. Your frontend URL will be: `https://your-vercel-domain.vercel.app`

### Verify Frontend
- Login page: `https://your-vercel-domain.vercel.app/login`
- Should load the login form

## 4. Create Initial Admin User

### Option A: Seed Script (preferred)
```bash
cd backend
npm install
node scripts/seed-db.js
```

### Option B: Manual via API
```bash
curl -X POST https://your-railway-domain.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@blog.com",
    "password": "Admin@2024!",
    "name": "Admin User"
  }'
```

## 5. Testing the Complete Flow

1. **Test Backend API**
   ```bash
   curl https://your-railway-domain.up.railway.app/api/health
   ```

2. **Test Frontend**
   - Visit: https://your-vercel-domain.vercel.app
   - Should redirect to login page

3. **Test Login**
   - Go to: https://your-vercel-domain.vercel.app/login
   - Use credentials:
     - Email: admin@blog.com
     - Password: Admin@2024!

4. **Test Dashboard**
   - Should be redirected to: https://your-vercel-domain.vercel.app/dashboard

## Troubleshooting

### Backend Not Responding
- Check Railway logs for errors
- Verify MONGODB_URI is correct and MongoDB is accessible
- Check JWT_SECRET is set and is secure
- Verify FRONTEND_URL matches your Vercel domain

### Frontend 404 Errors
- Verify Vercel has latest code deployed
- Check NEXT_PUBLIC_API_URL environment variable
- Clear browser cache and try hard refresh (Ctrl+Shift+R)
- Check browser console for API errors

### Cannot Connect to MongoDB
- Verify MongoDB cluster network access includes 0.0.0.0/0
- Verify database user has correct password
- Test connection string locally first

### Login Failing
- Check backend /api/health endpoint
- Verify database has users collection
- Check browser console for exact API error
- Verify JWT_SECRET matches between deployments

## Project Structure
```
.
├── frontend/              # Next.js React frontend
│   ├── app/              # Next.js app directory
│   ├── lib/              # API clients and utilities
│   └── components/       # React components
├── backend/              # Node.js Express backend
│   ├── src/
│   │   ├── models/       # MongoDB schemas
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   └── server.js     # Express server
│   └── package.json
└── DEPLOYMENT_GUIDE.md   # This file
```

## Support
For issues, check the console logs and error messages. Both Vercel and Railway provide detailed logs in their dashboards.
