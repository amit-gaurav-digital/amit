# Analytics Dashboard Documentation

## Overview

The Analytics Dashboard provides comprehensive tracking of blog performance metrics including page views, user engagement, traffic sources, geographic distribution, and growth trends.

## Features

### Dashboard Views

#### Global Analytics Dashboard
- Summary metrics across all published blogs
- Traffic source breakdown
- Device type distribution
- Top performing blogs ranking
- Key engagement metrics

#### Blog-Specific Analytics
- Detailed performance metrics for individual blogs
- Daily trend visualization
- Geographic data and top countries
- Referrer analysis
- Growth comparison (current vs previous period)
- CSV export capability

### Tracked Metrics

**Basic Metrics:**
- Page Views - Total number of page visits
- Unique Visitors - Number of distinct users
- Bounce Rate - Percentage of single-page sessions
- Average Time on Page - Session duration in seconds
- Scroll Depth - How far users scroll (percentage)

**Engagement Metrics:**
- Click Throughs - Internal link clicks
- Social Shares - Number of social media shares
- Comments - User comments on blogs
- Likes - User likes/reactions

**Traffic Analysis:**
- Organic search traffic
- Direct visits
- Referral traffic
- Social media referrals
- Email campaign traffic
- Paid advertisement traffic

**Device Breakdown:**
- Desktop traffic
- Mobile traffic
- Tablet traffic

**Geographic Data:**
- Country-by-country visitor distribution
- Visitor count and view distribution per country
- Top 15 countries tracked

**Referrer Analysis:**
- Top referrer sources
- Click-through rates per referrer
- Traffic quality by source

**Search Performance:**
- Search terms driving traffic
- Search impressions
- Search clicks
- Average search result position
- Click-through rate (CTR) per term

## Database Model

### Analytics Collection

```javascript
{
  blogId: ObjectId,
  date: Date,
  metrics: {
    pageViews: Number,
    uniqueVisitors: Number,
    bounceRate: Number (0-100),
    avgTimeOnPage: Number (seconds),
    clickThroughs: Number,
    socialShares: Number,
    comments: Number,
    likes: Number,
    scrollDepth: Number (0-100)
  },
  trafficSources: {
    organic: Number,
    direct: Number,
    referral: Number,
    social: Number,
    email: Number,
    paid: Number
  },
  deviceBreakdown: {
    desktop: Number,
    mobile: Number,
    tablet: Number
  },
  geography: [
    { country: String, views: Number, visitors: Number }
  ],
  referrers: [
    { source: String, views: Number, clickThroughs: Number }
  ],
  searchTerms: [
    { term: String, impressions: Number, clicks: Number, avgPosition: Number }
  ]
}
```

**Indexes:**
- `blogId + date` - Fast metric retrieval for specific blogs
- `date` - Fast time-based queries

**TTL:** None (data is kept indefinitely for historical analysis)

## API Endpoints

### Track Events
**`POST /api/analytics/page-view/:blogId`**

Record a page view event.

Request body:
```json
{
  "source": "organic",
  "device": "desktop",
  "country": "US",
  "referrer": "google.com"
}
```

### Dashboard Summary
**`GET /api/analytics/dashboard?days=30`**

Get aggregated metrics for all blogs.

Response:
```json
{
  "period": { "days": 30, "startDate": "2024-06-17" },
  "summary": {
    "totalViews": 15420,
    "totalVisitors": 8234,
    "avgBounceRate": 42.5,
    "totalShares": 342,
    "totalComments": 128,
    "avgTimeOnPage": 245
  },
  "trafficSources": {
    "organic": 7200,
    "direct": 3400,
    "referral": 2800,
    "social": 1500,
    "email": 420,
    "paid": 100
  },
  "devices": {
    "desktop": 9250,
    "mobile": 5420,
    "tablet": 750
  },
  "totalPublishedBlogs": 45
}
```

### Blog-Specific Analytics
**`GET /api/analytics/blog/:blogId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`**

Get detailed analytics for a specific blog.

Response:
```json
{
  "blog": {
    "id": "...",
    "title": "Blog Title",
    "slug": "blog-slug",
    "status": "published",
    "publishedAt": "2024-06-01T00:00:00Z"
  },
  "period": { "startDate": "2024-06-17", "endDate": "2024-07-16" },
  "aggregated": {
    "totalViews": 2150,
    "totalVisitors": 1342,
    "avgBounceRate": 35.2,
    "avgTimeOnPage": 312,
    "totalClicks": 420,
    "totalShares": 85,
    "totalComments": 23,
    "totalLikes": 156,
    "avgScrollDepth": 68.5
  },
  "trend": [
    {
      "date": "2024-06-17",
      "pageViews": 45,
      "uniqueVisitors": 32,
      "bounceRate": 38.5,
      "avgTimeOnPage": 298,
      "clickThroughs": 12
    }
  ],
  "topReferrers": [...]
}
```

### Top Performing Blogs
**`GET /api/analytics/top-performing?limit=10&days=30`**

Get the top N performing blogs.

Response:
```json
[
  {
    "blogId": "...",
    "title": "Best Blog Post",
    "slug": "best-blog-post",
    "totalViews": 5420,
    "totalVisitors": 3200,
    "avgEngagement": 450,
    "totalShares": 340,
    "engagementRate": "8.31"
  }
]
```

### Top Referrers
**`GET /api/analytics/blog/:blogId/referrers?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`**

Get top traffic referrers for a blog.

Response:
```json
[
  {
    "source": "google.com",
    "views": 450,
    "clickThroughs": 120,
    "conversionRate": "26.67"
  }
]
```

### Geographic Data
**`GET /api/analytics/blog/:blogId/geography?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`**

Get visitor distribution by country.

Response:
```json
[
  {
    "_id": "US",
    "totalViews": 850,
    "totalVisitors": 520
  },
  {
    "_id": "GB",
    "totalViews": 420,
    "totalVisitors": 280
  }
]
```

### Search Terms Performance
**`GET /api/analytics/blog/:blogId/search-terms?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`**

Get search terms driving traffic to the blog.

Response:
```json
[
  {
    "term": "how to blog",
    "impressions": 1200,
    "clicks": 280,
    "avgPosition": "3.5",
    "ctr": "23.33"
  }
]
```

### Growth Metrics
**`GET /api/analytics/blog/:blogId/growth?days=30`**

Compare current period with previous period.

Response:
```json
{
  "views": {
    "current": 2150,
    "previous": 1850,
    "growth": "16.22"
  },
  "visitors": {
    "current": 1342,
    "previous": 1120,
    "growth": "19.82"
  },
  "engagement": {
    "current": 420,
    "previous": 380,
    "growth": "10.53"
  }
}
```

### Compare Blogs
**`POST /api/analytics/compare`**

Compare analytics across multiple blogs.

Request body:
```json
{
  "blogIds": ["id1", "id2", "id3"],
  "startDate": "2024-06-17",
  "endDate": "2024-07-16"
}
```

### Export Analytics
**`GET /api/analytics/export/:blogId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`**

Export analytics as CSV file.

Response: CSV file download

## Frontend Components

### MetricsCard
Displays a single metric with value, unit, and optional growth indicator.

```jsx
<MetricsCard
  title="Total Page Views"
  value={15420}
  unit=""
  change={12.5}
  icon={Eye}
  color="blue"
  loading={false}
/>
```

**Props:**
- `title` - Metric label
- `value` - Numeric value
- `unit` - Optional unit of measurement
- `change` - Optional percentage change
- `icon` - Lucide icon component
- `color` - bg-color scheme (blue, green, purple, orange, red)
- `loading` - Show loading state

### LineChart
Visualizes metrics over time with trend line and gradient fill.

```jsx
<LineChart
  title="Page Views Trend"
  data={trendData}
  dataKey="pageViews"
  color="#3b82f6"
  height={300}
/>
```

**Props:**
- `title` - Chart title
- `data` - Array of data points with `date` field
- `dataKey` - Field name to chart
- `color` - Hex color for line
- `height` - Chart height in pixels

### BarChart
Horizontal bar chart for comparing category values.

```jsx
<BarChart
  title="Traffic Sources"
  data={{ organic: 7200, direct: 3400, social: 1500 }}
  colors={{ organic: '#10b981', direct: '#3b82f6', social: '#ec4899' }}
/>
```

**Props:**
- `title` - Chart title
- `data` - Object mapping category names to values
- `colors` - Optional color mapping per category
- `height` - Chart height in pixels

## Frontend Pages

### Analytics Dashboard (`/dashboard/analytics`)
Global view of all blog analytics.

Features:
- 30/7/90/365 day presets
- Summary metrics (views, visitors, shares, comments)
- Traffic source breakdown
- Device breakdown
- Top performing blogs table
- Bounce rate and time on page metrics

### Blog Analytics Detail (`/dashboard/analytics/[blogId]`)
Detailed analytics for a specific blog.

Features:
- Date range picker
- Growth comparison vs previous period
- Page views trend
- Unique visitors trend
- Referrer analysis
- Geographic distribution
- Engagement metrics
- Export to CSV
- Detailed metrics table

## Usage Examples

### Track Page View
```javascript
import analyticsAPI from '@/lib/analytics-api';

// Record page view when blog is accessed
analyticsAPI.recordPageView(
  blogId,
  'organic',  // source: organic|direct|referral|social|email|paid
  'desktop',  // device: desktop|mobile|tablet
  'US'        // country code
);
```

### Get Dashboard Summary
```javascript
const summary = await analyticsAPI.getDashboardSummary(30);
console.log(summary.summary.totalViews);
console.log(summary.trafficSources);
```

### Get Blog Analytics
```javascript
const analytics = await analyticsAPI.getBlogAnalytics(
  blogId,
  '2024-06-17',
  '2024-07-16'
);

console.log(analytics.aggregated.totalViews);
console.log(analytics.trend); // Daily data
console.log(analytics.topReferrers);
```

### Compare Blogs
```javascript
const comparison = await analyticsAPI.compareBlogs(
  ['blogId1', 'blogId2', 'blogId3'],
  '2024-06-17',
  '2024-07-16'
);
```

### Export Analytics
```javascript
await analyticsAPI.exportAnalytics(
  blogId,
  '2024-06-17',
  '2024-07-16'
);
// Triggers CSV download
```

## Metrics Definitions

**Page Views:** Total number of times a blog was visited. Same user visiting multiple times counts as multiple views.

**Unique Visitors:** Number of distinct users who visited the blog, regardless of visit count.

**Bounce Rate:** Percentage of sessions where users left without interacting or viewing another page.

**Time on Page:** Average time users spent on the blog before navigating away, in seconds.

**Scroll Depth:** Percentage of the blog content users scrolled through (0-100%).

**Click Throughs:** Clicks on internal links from the blog post.

**Social Shares:** Number of times the blog was shared on social media platforms.

**Engagement Rate:** Calculated as (total clicks / total views) × 100. Shows how actively users interact with content.

**Traffic Sources:**
- **Organic:** Users arriving from search engines
- **Direct:** Users accessing blog directly via URL
- **Referral:** Users arriving from other websites' links
- **Social:** Users arriving from social media platforms
- **Email:** Users arriving from email campaigns
- **Paid:** Users arriving from paid advertisements

## Performance Considerations

- Metrics are stored per blog per day (not per individual visit)
- Aggregation queries use MongoDB's aggregation pipeline for efficiency
- Top 15 countries and top 20 search terms are tracked
- Daily data is retained indefinitely for historical analysis
- Indexes optimized for date-based and blog-based queries

## Future Enhancements

- Real-time analytics dashboard
- AI-powered insights and recommendations
- Anomaly detection for unusual traffic patterns
- Cohort analysis for user behavior
- Custom event tracking
- A/B testing framework
- Goal conversion tracking
- Revenue attribution tracking
- Competitive comparison (with permission)
- Predictive analytics and forecasting
