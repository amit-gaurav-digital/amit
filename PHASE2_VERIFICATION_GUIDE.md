# Phase 2 Analytics System - Verification Guide

## Quick Start: Start Both Services

### Terminal 1: Backend
```bash
cd /home/user/amit/backend
npm install --legacy-peer-deps
npm start
```

**Expected Output:**
```
Connected to MongoDB
Default roles initialized
Server is running on port 3001
Environment: development
Analytics Phase 1 route error: (or route loaded successfully)
Analytics Phase 2 route error: (or route loaded successfully)
```

### Terminal 2: Frontend
```bash
cd /home/user/amit/frontend
npm install --legacy-peer-deps
npm run dev
```

**Expected Output:**
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
event - compiled client and server successfully
```

---

## ✅ Verification Steps (In Order)

### 1️⃣ Health Check (Backend)

**Test:** Open in browser or curl
```bash
curl http://localhost:3001/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-07-17T...",
  "uptime": 123.456
}
```

✅ **Pass if:** Status is "ok" and uptime is positive

---

### 2️⃣ Database Models Verification

**Check if all 11 models exist:**

```bash
# List backend models
ls -1 /home/user/amit/backend/src/models | grep -i analytics
```

**Expected output:**
```
Analytics.js                    ✅
AnalyticsAlert.js              ✅
AnalyticsComparison.js         ✅
AnalyticsEvent.js              ✅
AnalyticsGoal.js               ✅
AnalyticsReport.js             ✅
AnalyticsSession.js            ✅
AnalyticsSegment.js            ✅
GoogleAnalyticsConfig.js       ✅
GoogleAnalyticsData.js         ✅
SearchConsoleData.js           ✅
```

✅ **Pass if:** All 11 files exist

---

### 3️⃣ API Endpoints Verification

#### Check Phase 1 Endpoints (Should still work)
```bash
# Get all endpoints from Phase 1
curl -s http://localhost:3001/api/analytics/dashboard/test-blog-id \
  -H "Authorization: Bearer YOUR_TOKEN" | jq .
```

#### Check Phase 2 Endpoints

**3A. Blog Detail Endpoint**
```bash
curl -s http://localhost:3001/api/analytics/blog/test-blog-id/detail \
  -H "Authorization: Bearer YOUR_TOKEN" | jq . | head -50
```

Expected fields:
```json
{
  "blog": { "_id": "...", "title": "..." },
  "dateRange": { "start": "...", "end": "..." },
  "summary": {
    "totalViews": 0,
    "totalVisitors": 0,
    "avgBounceRate": 0,
    "totalSessions": 0
  },
  "daily": [],
  "topPages": [],
  "deviceBreakdown": [],
  "trafficSources": []
}
```

**3B. Goals Endpoint**
```bash
curl -s http://localhost:3001/api/analytics/goals/test-blog-id \
  -H "Authorization: Bearer YOUR_TOKEN" | jq .
```

Expected:
```json
{
  "goals": []
}
```

**3C. Alerts Endpoint**
```bash
curl -s http://localhost:3001/api/analytics/alerts/test-blog-id \
  -H "Authorization: Bearer YOUR_TOKEN" | jq .
```

Expected:
```json
{
  "alerts": []
}
```

**3D. Create Goal**
```bash
curl -X POST http://localhost:3001/api/analytics/goals/test-blog-id \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Goal",
    "type": "pageview",
    "config": {},
    "value": 100
  }' | jq .
```

Expected:
```json
{
  "success": true,
  "goal": {
    "goalId": "goal-...",
    "name": "Test Goal",
    "type": "pageview",
    ...
  }
}
```

**3E. Export Endpoint**
```bash
curl -s "http://localhost:3001/api/analytics/export/test-blog-id?format=csv" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: CSV format with headers
```
date,pageViews,uniqueVisitors,bounceRate,engagementScore
```

**3F. Compare Blogs Endpoint**
```bash
curl -X POST http://localhost:3001/api/analytics/compare \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "blogIds": ["blog-id-1", "blog-id-2"],
    "startDate": "2024-06-17",
    "endDate": "2024-07-17"
  }' | jq .
```

Expected:
```json
{
  "success": true,
  "comparisonId": "cmp-...",
  "data": { "comparisonData": [...] }
}
```

**3G. Google Analytics Auth URL**
```bash
curl -s http://localhost:3001/api/analytics/google/auth-url \
  -H "Authorization: Bearer YOUR_TOKEN" | jq .
```

Expected:
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

✅ **Pass if:** All endpoints return proper responses (200 status, valid JSON)

---

### 4️⃣ Frontend Pages Verification

#### 4A. Main Analytics Page
```
URL: http://localhost:3000/dashboard/analytics
```

**Check for:**
- ✅ Blog selector dropdown (if user has multiple blogs)
- ✅ Date range selector with options: "Last 7 Days", "Last 30 Days", "Last 90 Days", "Last Year"
- ✅ 4 metric cards:
  - 👁️ Total Views
  - 👥 Total Visitors
  - 💬 Avg Engagement
  - 🚫 Bounce Rate
- ✅ "View Detailed →" button
- ✅ Views trend chart (bar chart)
- ✅ Top Pages section
- ✅ Session Analysis section
- ✅ Performance section with FCP, LCP metrics

**Screenshot markers:**
- Page loads without errors
- All data displays
- Styling looks clean (white backgrounds, gray text, blue accents)

#### 4B. Blog Detail Analytics Page
```
URL: http://localhost:3000/dashboard/analytics/{blogId}
```

Replace `{blogId}` with an actual blog ID from your database.

**Check for:**
- ✅ Date range picker component
- ✅ Export button (green, 📥 icon)
- ✅ Summary metrics (Views, Visitors, Bounce Rate, Sessions)
- ✅ Tab navigation:
  - 📈 Overview (default)
  - ⚡ Performance
  - 💬 Engagement
  - 🌍 Geography
  - 🔗 Referrers
  - 📊 Growth
- ✅ Views trend chart on Overview tab
- ✅ Device breakdown bar chart
- ✅ Traffic source pie chart
- ✅ Top pages table

**Test interactions:**
- Click on different date presets → Data updates
- Click "Export Data" button → Modal opens
- Click on tabs → Content changes
- Scroll through table → Pagination works

#### 4C. Integrations Page
```
URL: http://localhost:3000/dashboard/analytics/integrations
```

**Check for:**
- ✅ Blog selector (if multiple blogs)
- ✅ Google Analytics section with:
  - 🔗 Heading
  - Description text
  - "🔐 Connect Google Analytics" button
- ✅ Google Search Console section with:
  - 🔍 Heading
  - Website URL input field
  - "🔐 Connect Search Console" button
- ✅ Integration guide section (blue background)
- ✅ Benefits section (green background)

---

### 5️⃣ Component Verification

#### Check Each Component Renders

**5A. Chart Components**
```bash
# Check if files exist and have no syntax errors
node -c /home/user/amit/frontend/components/analytics/BarChart.jsx
node -c /home/user/amit/frontend/components/analytics/PieChart.jsx
node -c /home/user/amit/frontend/components/analytics/TrendChart.jsx
```

**5B. Form Components**
```bash
# Check DateRangePicker
grep -l "DateRangePicker" /home/user/amit/frontend/components/analytics/*.jsx

# Check ExportModal
grep -l "ExportModal" /home/user/amit/frontend/components/analytics/*.jsx

# Check SegmentFilter
grep -l "SegmentFilter" /home/user/amit/frontend/components/analytics/*.jsx
```

**Expected:** All components mentioned in multiple files

---

### 6️⃣ Export Functionality Test

**Manual Test:**
1. Go to http://localhost:3000/dashboard/analytics/{blogId}
2. Click "📥 Export Data" button
3. Modal should open with options:
   - Format selector (CSV, JSON, PDF)
   - Checkboxes for metrics
   - Cancel and Export buttons

**Test Export:**
- Select CSV format
- Check "views" checkbox
- Click "✓ Export"
- Wait for download
- Check file was downloaded to Downloads folder

✅ **Pass if:** File downloads successfully with CSV content

---

### 7️⃣ Data Flow Testing

**Create a Test Goal:**
```bash
BLOG_ID="your-actual-blog-id"
TOKEN="your-jwt-token"

curl -X POST http://localhost:3001/api/analytics/goals/$BLOG_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Newsletter Signup",
    "type": "form_submit",
    "config": {"elementSelector": ".newsletter-form"},
    "value": 50,
    "description": "Track newsletter signups"
  }' | jq .
```

**Verify Goal Creation:**
```bash
curl -s http://localhost:3001/api/analytics/goals/$BLOG_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.goals | length'
```

Expected: `1` (or higher if you created more goals)

**Create a Test Alert:**
```bash
curl -X POST http://localhost:3001/api/analytics/alerts/$BLOG_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High Bounce Rate",
    "metric": "bounceRate",
    "condition": "exceeds",
    "threshold": 60,
    "recipients": ["admin@example.com"]
  }' | jq .
```

**Verify Alert Creation:**
```bash
curl -s http://localhost:3001/api/analytics/alerts/$BLOG_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.alerts | length'
```

Expected: `1` (or higher)

---

### 8️⃣ Services Verification

**Check if services loaded:**
```bash
# Check if Google Analytics service exists
test -f /home/user/amit/backend/src/services/googleAnalyticsService.js && echo "✅ GA Service loaded" || echo "❌ GA Service missing"

# Check if Search Console service exists
test -f /home/user/amit/backend/src/services/searchConsoleService.js && echo "✅ SC Service loaded" || echo "❌ SC Service missing"
```

**Check backend logs for errors:**
```bash
# Should show no "Analytics route error" messages
# Should show successful model loading
ps aux | grep "node.*server.js" | grep -v grep
```

---

### 9️⃣ Database Models Verification

**Check models import correctly:**
```bash
# Test importing all models
node -e "
const Analytics = require('./backend/src/models/Analytics');
const AnalyticsEvent = require('./backend/src/models/AnalyticsEvent');
const AnalyticsSession = require('./backend/src/models/AnalyticsSession');
const AnalyticsGoal = require('./backend/src/models/AnalyticsGoal');
const AnalyticsAlert = require('./backend/src/models/AnalyticsAlert');
const AnalyticsReport = require('./backend/src/models/AnalyticsReport');
const AnalyticsSegment = require('./backend/src/models/AnalyticsSegment');
const AnalyticsComparison = require('./backend/src/models/AnalyticsComparison');
const GoogleAnalyticsConfig = require('./backend/src/models/GoogleAnalyticsConfig');
const GoogleAnalyticsData = require('./backend/src/models/GoogleAnalyticsData');
const SearchConsoleData = require('./backend/src/models/SearchConsoleData');
console.log('✅ All 11 models loaded successfully');
"
```

---

### 🔟 Full Integration Test

**Complete User Flow:**

1. **Login**
   - Go to http://localhost:3000/login
   - Enter credentials
   - Should redirect to dashboard

2. **Navigate to Analytics**
   - Go to http://localhost:3000/dashboard/analytics
   - Should see blog selector and date range

3. **View Blog Analytics**
   - Select a blog
   - Choose "Last 7 Days"
   - Should see metrics update

4. **View Details**
   - Click "View Detailed →"
   - Should go to http://localhost:3000/dashboard/analytics/{blogId}
   - Should see Overview tab content

5. **Test Tabs**
   - Click ⚡ Performance tab → Should load
   - Click 💬 Engagement tab → Should load
   - Click 🌍 Geography tab → Should load
   - Click 🔗 Referrers tab → Should load
   - Click 📊 Growth tab → Should load

6. **Test Export**
   - Click 📥 Export Data
   - Select CSV format
   - Click Export
   - File should download

7. **Test Integrations**
   - Go to http://localhost:3000/dashboard/analytics/integrations
   - Should see Google Analytics section
   - Should see Search Console section
   - Should see connection buttons

✅ **Pass if:** All steps complete without errors

---

## 📋 Troubleshooting

### Issue: "Cannot find module" errors
**Solution:**
```bash
cd backend
npm install --legacy-peer-deps

cd ../frontend
npm install --legacy-peer-deps
```

### Issue: Port 3001 already in use
**Solution:**
```bash
# Kill process on port 3001
lsof -i :3001
kill -9 <PID>

# Or use different port
PORT=3002 npm start
```

### Issue: Frontend can't reach backend
**Solution:**
Check `.env` file has correct API URL:
```bash
echo $NEXT_PUBLIC_API_URL
# Should output: http://localhost:3001
```

### Issue: Models not loading in backend
**Solution:**
Check server.js has both Phase 1 and Phase 2 routes:
```bash
grep -n "analyticsPhase" /home/user/amit/backend/src/server.js
```

Should show both lines registered.

### Issue: Chart components not rendering
**Solution:**
1. Clear browser cache: Ctrl+Shift+Delete
2. Hard refresh: Ctrl+F5
3. Check console for JavaScript errors: F12 → Console

---

## ✅ Final Checklist

Use this to verify all Phase 2 features:

```
BACKEND:
☐ npm start works without errors
☐ /api/health returns OK status
☐ All 11 models load (check logs)
☐ Phase 1 routes working (12 endpoints)
☐ Phase 2 routes working (20+ endpoints)
☐ Goal creation works
☐ Alert creation works
☐ Blog comparison works
☐ Export CSV works
☐ Google Analytics routes exist
☐ Search Console routes exist

FRONTEND:
☐ npm run dev starts without errors
☐ Main analytics page loads (http://localhost:3000/dashboard/analytics)
☐ Blog detail page loads (http://localhost:3000/dashboard/analytics/{blogId})
☐ Date range picker works
☐ All 6 tabs render on detail page
☐ Chart components render (TrendChart, BarChart, PieChart)
☐ Export modal opens and closes
☐ Integrations page loads
☐ Google Analytics connect button visible
☐ Search Console connect button visible
☐ Data tables paginate correctly
☐ Filters apply correctly

INTEGRATION:
☐ Full user flow works (login → analytics → details → export)
☐ No console errors in browser
☐ No 404 errors in network tab
☐ Response times < 1 second
☐ All API calls return valid JSON

OVERALL:
☐ Both services running
☐ No critical errors
☐ All features accessible
☐ Phase 2 complete and ready
```

---

## 🎉 Success Criteria

**Phase 2 is verified complete when:**

✅ All 11 backend models exist and load
✅ 30+ API endpoints respond correctly
✅ 8 frontend pages load without errors
✅ 15+ components render properly
✅ Google Analytics integration UI works
✅ Search Console integration UI works
✅ Export functionality works
✅ Chart visualizations render
✅ Data flows from API to UI correctly
✅ No console errors or warnings

---

## Next Steps

Once Phase 2 is verified:
1. **Test with real data:** Create actual blogs and test analytics
2. **Connect Google Analytics:** Use the integration page to connect real GA account
3. **Connect Search Console:** Set up real website URL
4. **Generate test data:** Create goals and alerts
5. **Create scheduled reports:** Test report generation
6. **Compare blogs:** Test multi-blog comparison feature

