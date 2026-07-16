# A/B Testing Documentation

## Overview

The A/B Testing system enables content creators to test different variations of blog elements (headlines, content, images, CTAs, meta descriptions) to optimize performance. The system provides statistical analysis to determine winners with confidence levels.

## Features

### Test Creation
- Create tests for multiple element types
- Add unlimited variants (Control + N variations)
- Configure test duration (1-365 days)
- Set confidence level (90%, 95%, 99%)
- Auto-select winners based on statistical significance
- Custom field tracking

### Test Management
- Draft, run, pause, complete, or cancel tests
- Monitor active tests across all blogs
- Track test progress in real-time
- Automatic winner selection option
- Manual test completion

### Statistical Analysis
- Z-score calculation for statistical significance
- P-value computation
- Confidence interval calculation
- Automatic winner determination
- Improvement percentage calculation
- Sample size validation

### Metrics Tracking
- Page views per variant
- Unique visitors
- Click-through rates
- Conversion rates
- Social shares
- Comments and engagement
- Average time on page
- Scroll depth
- Bounce rates

### Results Visualization
- Variant comparison charts
- Metric selection interface
- Daily trend tracking
- Performance leaderboards
- Winner announcements
- Statistical significance display

## Database Models

### ABTest Collection

```javascript
{
  blogId: ObjectId,
  name: String,
  description: String,
  testType: String (headline|content|image|cta|meta-description),
  status: String (draft|running|paused|completed|cancelled),
  testField: String,
  variants: [
    {
      _id: ObjectId,
      name: String,
      value: String,
      label: String (A, B, C...),
      isControl: Boolean,
      startDate: Date,
      endDate: Date
    }
  ],
  configuration: {
    splitPercentage: Number (1-99),
    minSampleSize: Number,
    confidenceLevel: Number (0.90, 0.95, 0.99),
    duration: Number (days),
    autoSelect: Boolean,
    autoSelectThreshold: Number
  },
  results: {
    winner: {
      variantId: ObjectId,
      variantName: String,
      improvement: Number (%),
      significanceLevel: Number,
      selectedAt: Date
    },
    startedAt: Date,
    completedAt: Date,
    status: String (not-started|running|analysis-pending|completed)
  },
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### ABTestResult Collection

```javascript
{
  testId: ObjectId,
  variantId: ObjectId,
  variantName: String,
  metrics: {
    views: Number,
    uniqueVisitors: Number,
    clicks: Number,
    conversions: Number,
    shares: Number,
    comments: Number,
    avgTimeOnPage: Number,
    bounceRate: Number,
    scrollDepth: Number
  },
  calculations: {
    conversionRate: Number (%),
    clickThroughRate: Number (%),
    bounceRate: Number (%),
    avgSessionDuration: Number
  },
  dailyMetrics: [
    {
      date: Date,
      views: Number,
      clicks: Number,
      conversions: Number,
      shares: Number
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `testId + variantId` - Fast result retrieval
- `testId` - Test performance queries

## API Endpoints

### Test Management

**Create Test**
```
POST /api/ab-testing
Authorization: Bearer {token}

Body:
{
  "blogId": "...",
  "name": "Headline Test",
  "description": "Testing two different headlines",
  "testType": "headline",
  "testField": "title",
  "variants": [
    { "name": "Control", "value": "Original Title", "isControl": true },
    { "name": "Variant A", "value": "Alternative Title", "isControl": false }
  ],
  "configuration": {
    "splitPercentage": 50,
    "confidenceLevel": 0.95,
    "duration": 7,
    "autoSelect": true
  }
}

Response: Test object with ID
```

**Get Tests for Blog**
```
GET /api/ab-testing/blog/{blogId}?status=running
Authorization: Bearer {token}

Response: Array of test objects
```

**Get Active Tests**
```
GET /api/ab-testing/blog/{blogId}/active
Authorization: Bearer {token}

Response: Array of running/paused tests
```

**Get Test Details**
```
GET /api/ab-testing/{testId}
Authorization: Bearer {token}

Response:
{
  "test": { ... },
  "results": [
    {
      "variantId": "...",
      "variantName": "Control",
      "metrics": { ... },
      "calculations": { ... },
      "dailyMetrics": [ ... ]
    }
  ]
}
```

### Test Lifecycle

**Start Test**
```
POST /api/ab-testing/{testId}/start
Authorization: Bearer {token}

Response: Updated test object
```

**Stop Test (Pause)**
```
POST /api/ab-testing/{testId}/stop
Authorization: Bearer {token}

Response: Updated test object
```

**Complete Test**
```
POST /api/ab-testing/{testId}/complete
Authorization: Bearer {token}

Body:
{
  "autoSelect": true
}

Response: Test with winner determination
```

**Cancel Test**
```
POST /api/ab-testing/{testId}/cancel
Authorization: Bearer {token}

Response: Cancelled test object
```

### Configuration

**Update Configuration**
```
PUT /api/ab-testing/{testId}/configuration
Authorization: Bearer {token}

Body:
{
  "configuration": {
    "duration": 14,
    "confidenceLevel": 0.99
  }
}

Response: Updated test object
```

### Event Tracking

**Record Event**
```
POST /api/ab-testing/{testId}/event

Body:
{
  "variantId": "...",
  "eventType": "view|click|conversion|share|comment",
  "data": {}
}

Response: { "success": true }
```

### Analysis

**Analyze Results**
```
POST /api/ab-testing/{testId}/analyze
Authorization: Bearer {token}

Response:
{
  "winner": {
    "variantId": "...",
    "variantName": "Control",
    "improvement": 12.5,
    "significanceLevel": 0.95,
    "selectedAt": "2024-07-16T..."
  }
}
```

**Get Variant Assignment**
```
GET /api/ab-testing/{testId}/assignment/{userId}
Authorization: Bearer {token}

Response:
{
  "assignment": "variant-a"
}
```

## Frontend Pages

### A/B Testing Dashboard (`/dashboard/abtesting`)

Features:
- Blog selector dropdown
- Test status filters (all, draft, running, completed)
- Create test button
- Test cards showing:
  - Test name and status badge
  - Test type and duration
  - Variant previews
  - Test controls (start, pause, complete)
  - Performance metrics (winner, improvement)

### Test Results Page (`/dashboard/abtesting/[testId]`)

Features:
- Test details header
- Winner announcement (if completed)
- Metric selection (conversion rate, CTR, bounce rate, session duration)
- Comparison chart (BarChart component)
- Variant details with all metrics
- Engagement metrics (shares, comments, time on page, scroll depth)

## Statistical Methods

### Z-Score Calculation
```
z = (p1 - p2) / SE

Where:
p1 = conversion rate of variant 1
p2 = conversion rate of variant 2
SE = √[P(1-P)(1/n1 + 1/n2)]
P = pooled conversion rate
```

### P-Value Calculation
Uses approximation formula for normal distribution to calculate two-tailed p-value.

### Significance Determination
- H0 (null hypothesis): No difference between variants
- H1 (alternative hypothesis): Significant difference exists
- P-value < 0.05 = Statistically significant (95% confidence)
- P-value < 0.10 = Marginally significant (90% confidence)

### Winner Selection
- Highest conversion/CTR wins
- Requires p-value < (1 - confidence level)
- Automatic or manual selection based on config
- Shows improvement percentage

## Test Types

### Headline Testing
Test different titles to improve click-through rate and engagement.
- Field: title
- Variants: 2-5 different headlines
- Key Metric: CTR, shares

### Content Testing
Test different content versions to improve time on page and engagement.
- Field: content
- Variants: 2-3 different content versions
- Key Metric: Time on page, scroll depth, conversions

### Featured Image Testing
Test different images to optimize CTR and social sharing.
- Field: featuredImage
- Variants: 2-3 different images
- Key Metric: Shares, clicks, engagement

### CTA Testing
Test different call-to-action text or placement.
- Field: cta
- Variants: 2-3 different CTAs
- Key Metric: Conversions, clicks

### Meta Description Testing
Test different meta descriptions for SEO and CTR.
- Field: metaDescription
- Variants: 2-3 different descriptions
- Key Metric: CTR, organic traffic

## Usage Examples

### Create and Run a Headline Test

```javascript
import abTestingAPI from '@/lib/abtesting-api';

// Create test
const test = await abTestingAPI.createTest({
  blogId: 'blog-id-123',
  name: 'Headline Test - July 2024',
  description: 'Testing two different headline approaches',
  testType: 'headline',
  testField: 'title',
  variants: [
    { name: 'Control', value: 'How to Write Better Blog Posts', isControl: true },
    { name: 'Variant A', value: '10 Tips for Writing Viral Blog Posts', isControl: false }
  ],
  configuration: {
    duration: 7,
    confidenceLevel: 0.95,
    autoSelect: true
  }
});

// Start test
const running = await abTestingAPI.startTest(test._id);

// Track events when users interact
await abTestingAPI.recordEvent(test._id, variantId, 'view');
await abTestingAPI.recordEvent(test._id, variantId, 'click');
await abTestingAPI.recordEvent(test._id, variantId, 'conversion');

// Complete test and get results
const completed = await abTestingAPI.completeTest(test._id, true);
const analysis = await abTestingAPI.analyzeResults(test._id);

console.log(`Winner: ${analysis.winner.variantName}`);
console.log(`Improvement: ${analysis.winner.improvement}%`);
```

### Assign Variant to User

```javascript
// Get consistent variant assignment
const assignment = await abTestingAPI.getVariantAssignment(testId, userId);

if (assignment.assignment === 'variant-a') {
  // Show Variant A
} else {
  // Show Variant B (Control)
}
```

### Track Page View Event

```javascript
// Frontend - record page view for variant
await abTestingAPI.trackEvent(testId, variantId, 'view');

// Can be called without auth header and fails silently
```

## Best Practices

### Test Planning
1. **Form hypothesis** - What do you expect will improve?
2. **Choose primary metric** - Focus on one key metric (conversions, CTR, etc.)
3. **Set sample size** - Ensure adequate traffic to reach significance
4. **Duration** - 1-2 weeks for blogs with consistent traffic
5. **Variants** - Keep to 2-3 variants per test (avoid dilution)

### Statistical Best Practices
1. **Confidence Level** - Start with 95% confidence
2. **Sample Size** - Minimum 100 samples per variant recommended
3. **Test Duration** - Run for at least 1 full week to capture daily variations
4. **Single Hypothesis** - Test one element at a time
5. **Pre-determine Duration** - Avoid peeking at results

### Implementation Best Practices
1. **Consistent Assignment** - Use user ID for consistent variant assignment
2. **Event Tracking** - Ensure accurate event recording
3. **Exclusivity** - Don't run multiple tests on same element simultaneously
4. **Documentation** - Record hypothesis and results for learning
5. **Iteration** - Apply winners to future content

## Performance Considerations

- Tests are stored at blog + date level (not per-visit)
- Aggregation pipeline optimized for analysis
- Real-time event recording with atomic updates
- Minimal computation overhead for assignment logic

## Limitations

- Two-sample testing (supports 2+ variants, analysis focused on best vs control)
- Historical data immutable (test results cannot be edited)
- Statistical calculations based on conversion metrics
- Assignment consistency depends on user ID availability

## Future Enhancements

- Multi-variate testing (MVT)
- Bayesian statistical approach
- Automated test creation recommendations
- Integration with external analytics platforms
- Segment-based analysis (by device, geography, etc.)
- Sequential testing (peek early with adjusted thresholds)
- Continuous testing framework
- Revenue/ROI attribution
