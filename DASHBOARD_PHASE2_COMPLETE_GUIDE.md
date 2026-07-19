# Dashboard Phase 2 Complete Access Guide
**Date:** July 19, 2026  
**Status:** ✅ ALL PHASE 2 FEATURES ACCESSIBLE FROM DASHBOARD

---

## Main Dashboard Navigation

### 📊 Main Dashboard (Root)
**URL:** `http://localhost:3000/dashboard` or `https://amit-xi.vercel.app/dashboard`

```
┌─────────────────────────────────────────────────────────────┐
│  AMIT AI Blogging Dashboard                      🔔  👤 ⚙️  │
├─────────────────────────────────────────────────────────────┤
│ 📊 Dashboard      │  Overview of all blogs, stats      [NOW] │
│ 📝 Blogs          │  Create/manage blog posts                │
│ ✨ AI Generator   │  Generate content with AI                │
│ 📅 Schedule       │  Schedule blog publishing                │
│ 📈 Analytics      │  PHASE 2 - View analytics        [NEW]   │
│ ⚙️  Settings      │  Team, roles, integrations              │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 2: Analytics Dashboard Access

### 🎯 Main Analytics Page
**Path:** `/dashboard/analytics`  
**Navigation:** Click "📈 Analytics" in sidebar → Main view

#### What You See:
```
┌──────────────────────────────────────────────────────────┐
│                  Analytics Dashboard                     │
├──────────────────────────────────────────────────────────┤
│ Blog Selector (dropdown)              Date Range Picker  │
│ ┌─────────────────────┐              ┌──────────────────┐│
│ │ Select Blog...      │              │ Last 7 days   ▼ ││
│ │ - Blog 1            │              │ Last 30 days    ││
│ │ - Blog 2            │              │ Last 90 days    ││
│ │ - Blog 3            │              │ Last 365 days   ││
│ └─────────────────────┘              │ Custom date...  ││
│                                      └──────────────────┘│
├──────────────────────────────────────────────────────────┤
│  Metric Cards:                                           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │ Page Views │ │  Sessions  │ │ Avg. Time  │          │
│  │   12,345   │ │   3,456    │ │   3m 45s   │          │
│  └────────────┘ └────────────┘ └────────────┘          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │  Bounce %  │ │  Visitors  │ │ Conv. Rate │          │
│  │   42.3%    │ │   2,891    │ │   12.5%    │          │
│  └────────────┘ └────────────┘ └────────────┘          │
├──────────────────────────────────────────────────────────┤
│  Charts & Visualizations:                               │
│  ┌──────────────────┐  ┌──────────────────┐             │
│  │ Traffic Trend    │  │ Traffic Sources  │             │
│  │ (Line Chart)     │  │ (Pie Chart)      │             │
│  └──────────────────┘  └──────────────────┘             │
│  ┌──────────────────┐  ┌──────────────────┐             │
│  │ Top Pages        │  │ Realtime Stats   │             │
│  │ (Table)          │  │ (Live Counter)   │             │
│  └──────────────────┘  └──────────────────┘             │
└──────────────────────────────────────────────────────────┘
```

#### Available Actions:
- ✅ Select blog from dropdown
- ✅ Change date range (7/30/90/365 days or custom)
- ✅ View real-time visitor counter
- ✅ See traffic trend chart
- ✅ View top pages table
- ✅ See traffic sources breakdown
- ✅ Navigate to detailed blog analytics

---

## 📊 Blog Detail Analytics
**Path:** `/dashboard/analytics/[blogId]`  
**Navigation:** Click blog name in Blog Selector → Detail view

#### What You See:

```
┌──────────────────────────────────────────────────────────┐
│  Blog: "SEO Guide 2026"    Date Range: Jul 1 - Jul 19   │
├──────────────────────────────────────────────────────────┤
│  [Overview] [Traffic] [SEO] [Goals] [Comparison] [Export]│
├──────────────────────────────────────────────────────────┤
│ TAB 1: OVERVIEW                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Summary Metrics:                                   │   │
│ │ • Total Views: 12,345 (↑ 15% vs prev period)      │   │
│ │ • Unique Visitors: 3,456 (↑ 8%)                   │   │
│ │ • Avg. Session Duration: 3m 45s                   │   │
│ │ • Bounce Rate: 42.3% (↓ 5%)                       │   │
│ │ • Conversion Rate: 12.5% (↑ 2%)                   │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ TAB 2: TRAFFIC                                           │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Traffic Sources:                                   │   │
│ │ • Direct: 45% (5,556 visitors)                    │   │
│ │ • Organic (Google): 35% (4,321 visitors)          │   │
│ │ • Social Media: 15% (1,854 visitors)              │   │
│ │ • Referrals: 5% (619 visitors)                    │   │
│ │                                                    │   │
│ │ Traffic Trend Chart (Line Graph):                 │   │
│ │   📊 Shows daily views over selected date range   │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ TAB 3: SEO (Google Search Console)                       │
│ ┌────────────────────────────────────────────────────┐   │
│ │ SEO Performance:                                   │   │
│ │ • Avg. Ranking Position: 12.3                     │   │
│ │ • Total Impressions: 45,678                       │   │
│ │ • Total Clicks: 2,345                             │   │
│ │ • Click-Through Rate: 5.1%                        │   │
│ │                                                    │   │
│ │ Top Keywords:                                     │   │
│ │ 1. "SEO tips 2026" - Pos #8, 2,345 impressions   │   │
│ │ 2. "content strategy" - Pos #15, 1,234 imp       │   │
│ │ 3. "keyword research" - Pos #22, 890 imp         │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ TAB 4: GOALS                                             │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Conversion Goals:                                  │   │
│ │ • Newsletter Signup: 234 (↑ 10%)                  │   │
│ │ • Product Purchase: 45 (↑ 5%)                     │   │
│ │ • Contact Form: 78 (↑ 12%)                        │   │
│ │ • Demo Request: 12 (↓ 2%)                         │   │
│ │                                                    │   │
│ │ Goal Trend Chart (Line Graph):                    │   │
│ │   📊 Shows goal completions over time             │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ TAB 5: COMPARISON                                        │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Compare Periods:                                   │   │
│ │                This Period    Previous Period      │   │
│ │ Views           12,345         10,723  (↑15%)     │   │
│ │ Visitors        3,456          3,198   (↑8%)      │   │
│ │ Sessions        3,898          3,456   (↑13%)     │   │
│ │ Bounce Rate     42.3%          47.2%   (↓10%)     │   │
│ │ Conversion      12.5%          10.3%   (↑21%)     │   │
│ │                                                    │   │
│ │ Comparison Chart (Side-by-side Bars):             │   │
│ │   📊 Visual comparison of key metrics             │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ TAB 6: EXPORT                                            │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Export Analytics Data:                             │   │
│ │ • Download as CSV  [📥 CSV]                       │   │
│ │ • Download as JSON [📥 JSON]                      │   │
│ │ • Download as PDF  [📥 PDF]                       │   │
│ │                                                    │   │
│ │ Include in Export:                                 │   │
│ │ ☑ Metrics Summary   ☑ Traffic Data                │   │
│ │ ☑ SEO Data         ☑ Goal Data                    │   │
│ │ ☑ Comparison Data  ☑ Charts                       │   │
│ └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

#### Available Actions:
- ✅ 6 tabbed views (Overview, Traffic, SEO, Goals, Comparison, Export)
- ✅ View detailed metrics and KPIs
- ✅ Change date range per tab
- ✅ View keyword rankings (GSC)
- ✅ Track goal completions
- ✅ Compare periods
- ✅ Export data in multiple formats

---

## 🔗 Google Integrations Page
**Path:** `/dashboard/analytics/integrations`  
**Navigation:** Click "Analytics" → Integrations tab OR URL direct access

#### What You See:

```
┌──────────────────────────────────────────────────────────┐
│                    Integrations                          │
├──────────────────────────────────────────────────────────┤
│
│ SECTION 1: Google Analytics                              │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Connection Status: ⚪ Not Connected / 🟢 Connected  │ │
│ │                                                      │ │
│ │ If NOT Connected:                                   │ │
│ │   [🔗 Connect Google Analytics]  [Learn More]      │ │
│ │   Will open Google OAuth login window              │ │
│ │                                                      │ │
│ │ If Connected:                                       │ │
│ │   ✅ Account Connected: john@gmail.com             │ │
│ │   📊 Property: Website Analytics (UA-123456-1)     │ │
│ │   🔄 Last Sync: 2 hours ago                        │ │
│ │   [🔄 Sync Now] [🔐 Re-authenticate] [❌ Disconnect]│ │
│ │                                                      │ │
│ │ Connected Blogs:                                    │ │
│ │ • Blog 1 (SEO Guide) → Property 1                  │ │
│ │ • Blog 2 (Marketing Tips) → Property 2             │ │
│ │ • Blog 3 (Tech News) → Property 3                  │ │
│ └──────────────────────────────────────────────────────┘ │
│
│ SECTION 2: Google Search Console                         │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Connection Status: ⚪ Not Connected / 🟢 Connected  │ │
│ │                                                      │ │
│ │ If NOT Connected:                                   │ │
│ │   [🔗 Connect Search Console]  [Learn More]        │ │
│ │   Will open Google OAuth login window              │ │
│ │                                                      │ │
│ │ If Connected:                                       │ │
│ │   ✅ Account Connected: john@gmail.com             │ │
│ │   🔍 Properties: 3 sites verified                  │ │
│ │   🔄 Last Sync: 1 hour ago                         │ │
│ │   [🔄 Sync Now] [🔐 Re-authenticate] [❌ Disconnect]│ │
│ │                                                      │ │
│ │ Connected Properties:                               │ │
│ │ • myblog.com → GSC Property 1                      │ │
│ │ • techblog.io → GSC Property 2                     │ │
│ │ • marketingblog.co → GSC Property 3                │ │
│ └──────────────────────────────────────────────────────┘ │
│
│ SECTION 3: OAuth Authorization Scope                     │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Permissions Granted:                                │ │
│ │ ✅ Read Google Analytics data (view reports)        │ │
│ │ ✅ Read Search Console data (view performance)      │ │
│ │ ℹ️ Write permissions: Disabled (read-only)         │ │
│ │                                                      │ │
│ │ [Learn about our data privacy policy]              │ │
│ └──────────────────────────────────────────────────────┘ │
│
│ SECTION 4: Manual Integration Setup                      │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Add Property Manually:                              │ │
│ │                                                      │ │
│ │ Blog: [Select Blog ▼]                              │ │
│ │ GA Property ID: [________________]                  │ │
│ │ GSC Domain: [________________]                      │ │
│ │                                                      │ │
│ │ [Save Configuration] [Cancel]                       │ │
│ └──────────────────────────────────────────────────────┘ │
│
│ SECTION 5: Data Sync Settings                            │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Auto-Sync Settings:                                 │ │
│ │ ☑ Enable automatic sync every 4 hours             │ │
│ │ ☑ Sync on demand available                         │ │
│ │ ☑ Send notifications on sync errors                │ │
│ │                                                      │ │
│ │ Sync History:                                       │ │
│ │ • Jul 19, 10:00 AM - ✅ Success (3,456 records)   │ │
│ │ • Jul 19, 6:00 AM - ✅ Success (2,345 records)    │ │
│ │ • Jul 18, 2:00 PM - ✅ Success (1,234 records)    │ │
│ └──────────────────────────────────────────────────────┘ │
│
│ [← Back to Analytics] [Next: Setup Alerts →]           │
│
└──────────────────────────────────────────────────────────┘
```

#### Available Actions:
- ✅ Connect Google Analytics account via OAuth
- ✅ Connect Google Search Console via OAuth
- ✅ View connection status
- ✅ Disconnect integrations
- ✅ Manual property configuration
- ✅ Auto-sync settings
- ✅ Sync history view

---

## ⚠️ Alerts Management
**Path:** `/dashboard/analytics/alerts`  
**Navigation:** Click "Analytics" → Alerts tab OR URL direct access

#### What You See:

```
┌──────────────────────────────────────────────────────────┐
│                 Analytics Alerts                         │
├──────────────────────────────────────────────────────────┤
│ [+ New Alert]                          Search... Filter ▼ │
├──────────────────────────────────────────────────────────┤
│
│ ALERT 1: Traffic Drop Warning                  [ACTIVE]   │
│ ├─ Blog: SEO Guide 2026                                  │
│ ├─ Condition: Page Views drop > 20%                      │
│ ├─ Timeframe: Compare to 7-day average                   │
│ ├─ Status: Last triggered Jul 18, 3:45 PM              │
│ ├─ Frequency: Notify when triggered                      │
│ └─ Actions: [Edit] [Pause] [Delete]                     │
│
│ ALERT 2: Goal Completion Low                  [ACTIVE]   │
│ ├─ Blog: Marketing Tips                                  │
│ ├─ Condition: Newsletter signups < 10/day               │
│ ├─ Timeframe: Last 24 hours                             │
│ ├─ Status: No alerts this week                          │
│ ├─ Frequency: Daily at 9:00 AM                          │
│ └─ Actions: [Edit] [Pause] [Delete]                     │
│
│ ALERT 3: Keyword Ranking Drop                 [PAUSED]   │
│ ├─ Blog: Tech News                                       │
│ ├─ Condition: Any tracked keyword drops > 5 positions   │
│ ├─ Timeframe: Daily check                               │
│ ├─ Status: Paused since Jul 15                          │
│ ├─ Frequency: When triggered                            │
│ └─ Actions: [Edit] [Resume] [Delete]                    │
│
│ CREATE NEW ALERT                                         │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Alert Type: [Select Type ▼]                         │ │
│ │   • Traffic Change                                   │ │
│ │   • Goal Completion                                  │ │
│ │   • Keyword Ranking                                  │ │
│ │   • Custom Threshold                                 │ │
│ │                                                      │ │
│ │ Blog: [Select Blog ▼]                               │ │
│ │ Condition: [________________]                        │ │
│ │ Notification: Email / Push / Both  [Select ▼]       │ │
│ │ Frequency: [Select Frequency ▼]                     │ │
│ │                                                      │ │
│ │ [Save Alert] [Cancel]                               │ │
│ └──────────────────────────────────────────────────────┘ │
│
└──────────────────────────────────────────────────────────┘
```

#### Available Actions:
- ✅ View all active alerts
- ✅ Create new alert
- ✅ Set alert conditions (traffic, goals, keywords, custom)
- ✅ Configure notification method
- ✅ Edit existing alerts
- ✅ Pause/resume alerts
- ✅ View alert history

---

## 🎯 Goals Tracking
**Path:** `/dashboard/analytics/goals`  
**Navigation:** Click "Analytics" → Goals tab OR URL direct access

#### What You See:

```
┌──────────────────────────────────────────────────────────┐
│                  Conversion Goals                        │
├──────────────────────────────────────────────────────────┤
│ [+ New Goal]                           Search... Sort By │
├──────────────────────────────────────────────────────────┤
│
│ GOAL 1: Newsletter Signup                    [ACTIVE]     │
│ ├─ Blog: All blogs                                       │
│ ├─ Type: Click/Form submission                          │
│ ├─ Target Element: #newsletter-form                     │
│ ├─ Total Completions This Month: 234                    │
│ ├─ Conversion Rate: 2.3%                                │
│ ├─ Trend: ↑ 10% vs last month                           │
│ ├─ Created: Jun 15, 2026                                │
│ └─ Actions: [Edit] [Disable] [Delete]                   │
│
│ GOAL 2: Product Purchase                    [ACTIVE]     │
│ ├─ Blog: Marketing Tips                                 │
│ ├─ Type: Click element                                  │
│ ├─ Target Element: .buy-now-button                      │
│ ├─ Total Completions This Month: 45                     │
│ ├─ Conversion Rate: 3.2%                                │
│ ├─ Trend: ↑ 5% vs last month                            │
│ ├─ Created: Jun 1, 2026                                 │
│ └─ Actions: [Edit] [Disable] [Delete]                   │
│
│ GOAL 3: Demo Request                       [DISABLED]    │
│ ├─ Blog: Tech News                                       │
│ ├─ Type: Link click                                     │
│ ├─ Target Element: a[href*="demo"]                      │
│ ├─ Total Completions This Month: 12                     │
│ ├─ Conversion Rate: 0.8%                                │
│ ├─ Trend: ↓ 15% vs last month (Disabled)               │
│ ├─ Created: May 20, 2026                                │
│ └─ Actions: [Edit] [Enable] [Delete]                    │
│
│ CREATE NEW GOAL                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Goal Name: [________________]                        │ │
│ │ Blog: [Select Blog ▼]                                │ │
│ │ Goal Type: [Select Type ▼]                           │ │
│ │   • Button Click                                      │ │
│ │   • Form Submission                                   │ │
│ │   • Link Click                                        │ │
│ │   • Custom JavaScript Event                           │ │
│ │                                                      │ │
│ │ Target Element: [jQuery selector]                    │ │
│ │ Description: [________________]                      │ │
│ │                                                      │ │
│ │ [Test Goal] [Save Goal] [Cancel]                    │ │
│ └──────────────────────────────────────────────────────┘ │
│
│ Goal Trend Chart (Line Graph):                          │
│ └─ Shows goal completions over selected date range      │
│
└──────────────────────────────────────────────────────────┘
```

#### Available Actions:
- ✅ View all conversion goals
- ✅ Create new goal (click, form, link, event)
- ✅ Set goal target elements
- ✅ View goal performance metrics
- ✅ Track conversion trends
- ✅ Enable/disable goals
- ✅ Edit goal configuration

---

## 📄 Reports Generation
**Path:** `/dashboard/analytics/reports`  
**Navigation:** Click "Analytics" → Reports tab OR URL direct access

#### What You See:

```
┌──────────────────────────────────────────────────────────┐
│                   Reports                                │
├──────────────────────────────────────────────────────────┤
│ [+ Generate Report]                    Saved Reports (3) │
├──────────────────────────────────────────────────────────┤
│
│ SAVED REPORT 1: Monthly Performance Summary              │
│ ├─ Last Generated: Jul 19, 2026 at 2:30 PM             │
│ ├─ Schedule: Monthly (1st of each month)                │
│ ├─ Recipients: john@email.com, manager@email.com        │
│ ├─ Format: PDF + Email                                  │
│ ├─ Includes: Traffic, Goals, SEO, Top Pages             │
│ └─ Actions: [View] [Edit] [Download PDF] [Resend]      │
│
│ SAVED REPORT 2: Weekly Traffic Analysis                 │
│ ├─ Last Generated: Jul 15, 2026 at 10:00 AM            │
│ ├─ Schedule: Weekly (Every Monday)                      │
│ ├─ Recipients: team@email.com                           │
│ ├─ Format: Email with summary                           │
│ ├─ Includes: Traffic sources, Top pages, Bounce rate    │
│ └─ Actions: [View] [Edit] [Resend]                     │
│
│ SAVED REPORT 3: SEO Performance                         │
│ ├─ Last Generated: Jul 18, 2026 at 4:15 PM             │
│ ├─ Schedule: Manual (on demand)                         │
│ ├─ Recipients: seo@email.com                            │
│ ├─ Format: Excel spreadsheet                            │
│ ├─ Includes: Keywords, Rankings, Impressions, CTR       │
│ └─ Actions: [View] [Edit] [Download] [Run Now]         │
│
│ GENERATE NEW REPORT                                      │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Report Name: [________________]                      │ │
│ │ Type: [Select Type ▼]                                │ │
│ │   • Performance Summary                               │ │
│ │   • Traffic Analysis                                  │ │
│ │   • SEO Performance                                   │ │
│ │   • Goal Analysis                                     │ │
│ │   • Custom Report                                     │ │
│ │                                                      │ │
│ │ Date Range: [From] to [To]                           │ │
│ │ Blogs to Include: ☑ All ☐ Select specific            │ │
│ │ Format: ☑ PDF ☐ Excel ☐ CSV ☐ Email                │ │
│ │ Recipients: [john@email.com; manager@email.com]      │ │
│ │ Schedule: [One-time / Weekly / Monthly]              │ │
│ │ Include Visualizations: ☑ Charts ☑ Tables            │ │
│ │                                                      │ │
│ │ [Generate Report] [Save as Template] [Cancel]       │ │
│ └──────────────────────────────────────────────────────┘ │
│
└──────────────────────────────────────────────────────────┘
```

#### Available Actions:
- ✅ Generate custom reports
- ✅ Multiple report types (performance, traffic, SEO, goals)
- ✅ Select date range
- ✅ Choose output format (PDF, Excel, CSV, Email)
- ✅ Set report schedule (one-time, weekly, monthly)
- ✅ Specify recipients
- ✅ View/download saved reports

---

## 📊 Blog Comparison
**Path:** `/dashboard/analytics/compare`  
**Navigation:** Click "Analytics" → Compare tab OR URL direct access

#### What You See:

```
┌──────────────────────────────────────────────────────────┐
│              Blog Performance Comparison                 │
├──────────────────────────────────────────────────────────┤
│ Select Blogs to Compare:                                 │
│ ☑ Blog 1 (SEO Guide)                                    │
│ ☑ Blog 2 (Marketing Tips)                               │
│ ☑ Blog 3 (Tech News)                                    │
│ ☐ Blog 4 (Product News)                                 │
│                                                          │
│ Date Range: [Last 30 days ▼]  [Custom dates]           │
│ Metrics to Compare: [All ▼]                             │
│ ├─ Views ├─ Visitors ├─ Bounce Rate ├─ Time on Page    │
│ ├─ Sessions ├─ Conversion ├─ Goals ├─ Traffic Source    │
│                                                          │
│ [Generate Comparison]                                   │
├──────────────────────────────────────────────────────────┤
│
│ COMPARISON RESULTS:                                      │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Metric                  Blog 1    Blog 2   Blog 3  │   │
│ ├────────────────────────────────────────────────────┤   │
│ │ Page Views             12,345    8,901   5,432     │   │
│ │   Change vs prev        +15%      +8%     -5%      │   │
│ │                                                     │   │
│ │ Unique Visitors        3,456     2,345    1,234    │   │
│ │   Change vs prev        +8%       -2%     +10%     │   │
│ │                                                     │   │
│ │ Sessions               3,898     2,567    1,345    │   │
│ │   Change vs prev        +12%      +5%     +3%      │   │
│ │                                                     │   │
│ │ Avg Session Duration   3m 45s    2m 30s   1m 15s   │   │
│ │   Change vs prev        +10%      -5%     -8%      │   │
│ │                                                     │   │
│ │ Bounce Rate            42.3%     51.2%    67.8%    │   │
│ │   Change vs prev        -5%       +8%     +12%     │   │
│ │                                                     │   │
│ │ Conversion Rate        12.5%     8.3%     5.2%     │   │
│ │   Change vs prev        +2%       -1%     -3%      │   │
│ └────────────────────────────────────────────────────┘   │
│
│ COMPARISON CHARTS:                                       │
│ ┌──────────────────┐  ┌──────────────────┐              │
│ │ Views Comparison │  │ Traffic Sources  │              │
│ │ (Bar Chart)      │  │ (Multi-line)     │              │
│ └──────────────────┘  └──────────────────┘              │
│ ┌──────────────────┐  ┌──────────────────┐              │
│ │ Engagement Rate  │  │ Goal Conversions │              │
│ │ (Line Chart)     │  │ (Bubble Chart)   │              │
│ └──────────────────┘  └──────────────────┘              │
│
│ [Export Comparison] [Share Report] [Save as Favorite]   │
│
└──────────────────────────────────────────────────────────┘
```

#### Available Actions:
- ✅ Compare multiple blogs side-by-side
- ✅ Select comparison date ranges
- ✅ Choose specific metrics to compare
- ✅ View data in table format
- ✅ View visual comparisons (charts)
- ✅ Export comparison data
- ✅ Share reports

---

## 🧪 Test Features (Developer)
**Path:** `/dashboard/analytics/test-features`  
**Navigation:** Direct URL access (for testing/debugging)

#### Available:
- ✅ Component testing interface
- ✅ Mock data generation
- ✅ API endpoint testing
- ✅ Feature flags toggle
- ✅ Performance metrics

---

## Quick Access Summary

### Dashboard Menu Path: Analytics → Sub-sections

```
Analytics Dashboard
├─ 📊 Overview
│  ├─ Blog selector
│  ├─ Date range picker
│  ├─ Metric cards
│  ├─ Trend charts
│  └─ Top pages table
│
├─ 📈 Blog Analytics [blogId]
│  ├─ Overview (KPI summary)
│  ├─ Traffic (sources, trends)
│  ├─ SEO (GSC keywords, rankings)
│  ├─ Goals (conversions, trends)
│  ├─ Comparison (period vs period)
│  └─ Export (CSV, JSON, PDF)
│
├─ 🔗 Integrations
│  ├─ Google Analytics (connect/manage)
│  ├─ Google Search Console (connect/manage)
│  ├─ OAuth settings
│  ├─ Auto-sync configuration
│  └─ Sync history
│
├─ ⚠️  Alerts
│  ├─ View active alerts
│  ├─ Create new alert
│  ├─ Alert conditions (traffic, goals, keywords)
│  ├─ Notification settings
│  └─ Alert history
│
├─ 🎯 Goals
│  ├─ View conversion goals
│  ├─ Create new goal (click, form, link, event)
│  ├─ Goal performance metrics
│  ├─ Enable/disable goals
│  └─ Goal trends
│
├─ 📄 Reports
│  ├─ View saved reports
│  ├─ Generate custom report
│  ├─ Report scheduling
│  ├─ Multiple formats (PDF, Excel, Email)
│  └─ Report distribution
│
└─ 📊 Compare
   ├─ Multi-blog comparison
   ├─ Metric selection
   ├─ Period comparison
   ├─ Export comparison
   └─ Share results
```

---

## Access Methods

### Local Development
```bash
# Start both services in separate terminals:

# Terminal 1: Backend
cd /home/user/amit/backend
npm start
# Server: http://localhost:3001

# Terminal 2: Frontend
cd /home/user/amit/frontend
npm run dev
# Frontend: http://localhost:3000
```

### Browser Access
```
Main Dashboard: http://localhost:3000/dashboard
Analytics Dashboard: http://localhost:3000/dashboard/analytics
Blog Detail: http://localhost:3000/dashboard/analytics/{blogId}
Integrations: http://localhost:3000/dashboard/analytics/integrations
Alerts: http://localhost:3000/dashboard/analytics/alerts
Goals: http://localhost:3000/dashboard/analytics/goals
Reports: http://localhost:3000/dashboard/analytics/reports
Compare: http://localhost:3000/dashboard/analytics/compare
```

### Production Deployment
```
Main Dashboard: https://amit-xi.vercel.app/dashboard
Analytics Dashboard: https://amit-xi.vercel.app/dashboard/analytics
Blog Detail: https://amit-xi.vercel.app/dashboard/analytics/{blogId}
Integrations: https://amit-xi.vercel.app/dashboard/analytics/integrations
```

---

## Navigation Tips

### From Main Dashboard
1. Click "📈 Analytics" in left sidebar
2. Select blog from dropdown
3. Choose date range (7/30/90/365 days or custom)
4. View metrics and charts

### From Blog List
1. Go to 📝 Blogs
2. Click blog name or "View Analytics" button
3. Goes to `/dashboard/analytics/[blogId]`

### Direct Navigation
- Bookmark specific analytics page URLs
- Use browser back/forward buttons
- Search functionality available in each section

---

## Required Actions to Use Phase 2

1. **Start Backend:**
   ```bash
   cd /home/user/amit/backend && npm start
   ```

2. **Start Frontend:**
   ```bash
   cd /home/user/amit/frontend && npm run dev
   ```

3. **Access Dashboard:**
   - Open `http://localhost:3000/dashboard`
   - Click "📈 Analytics" in sidebar

4. **Connect Integrations (Optional):**
   - Go to Analytics → Integrations
   - Click "Connect Google Analytics"
   - Click "Connect Search Console"
   - Follow OAuth flow

5. **Create Custom Alerts/Goals (Optional):**
   - Alerts: Analytics → Alerts → "New Alert"
   - Goals: Analytics → Goals → "New Goal"
   - Reports: Analytics → Reports → "Generate Report"

---

## Troubleshooting

### Can't see Analytics in sidebar
- ✅ Ensure backend is running on port 3001
- ✅ Ensure frontend is running on port 3000
- ✅ Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)
- ✅ Clear localStorage: `localStorage.clear()` in console

### Analytics data not loading
- ✅ Check health: `curl http://localhost:3001/api/health`
- ✅ Verify MongoDB is running
- ✅ Check browser console for errors
- ✅ Verify JWT token in localStorage

### Google integrations not working
- ✅ Check OAuth credentials in backend
- ✅ Verify API keys are correct
- ✅ Check popup blocker settings
- ✅ Verify Google account permissions

---

## Next Steps

1. **Start Services:** Run backend and frontend
2. **Access Dashboard:** Navigate to analytics section
3. **Test Features:** Create test blog and view analytics
4. **Connect Google:** Link GA and GSC accounts
5. **Create Alerts:** Set up performance alerts
6. **Generate Reports:** Create scheduled reports
7. **Track Goals:** Define conversion goals

---

**Status:** ✅ ALL PHASE 2 FEATURES ACCESSIBLE FROM DASHBOARD  
**Last Updated:** July 19, 2026  
**Next Version:** Production deployment guide
