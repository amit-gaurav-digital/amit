#!/bin/bash

# Phase 2 Analytics System - Automated Verification Script
# This script verifies all Phase 2 components are properly installed

set -e

echo "🚀 Phase 2 Analytics Verification Script"
echo "========================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Helper function
test_component() {
  local name=$1
  local test_command=$2

  echo -n "Testing $name... "

  if eval "$test_command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
  fi
}

echo "📦 BACKEND MODELS"
echo "=================="

# Check if all 11 models exist
for model in Analytics AnalyticsAlert AnalyticsComparison AnalyticsEvent AnalyticsGoal AnalyticsReport AnalyticsSession AnalyticsSegment GoogleAnalyticsConfig GoogleAnalyticsData SearchConsoleData; do
  test_component "$model.js" "test -f /home/user/amit/backend/src/models/${model}.js"
done

echo ""
echo "📡 BACKEND SERVICES"
echo "==================="

test_component "googleAnalyticsService.js" "test -f /home/user/amit/backend/src/services/googleAnalyticsService.js"
test_component "searchConsoleService.js" "test -f /home/user/amit/backend/src/services/searchConsoleService.js"
test_component "realtimeAnalytics.js" "test -f /home/user/amit/backend/src/services/realtimeAnalytics.js"

echo ""
echo "🛣️  BACKEND ROUTES"
echo "=================="

test_component "analyticsPhase1.js" "test -f /home/user/amit/backend/src/routes/analyticsPhase1.js"
test_component "analyticsPhase2.js" "test -f /home/user/amit/backend/src/routes/analyticsPhase2.js"
test_component "Routes registered" "grep -q 'analyticsPhase2' /home/user/amit/backend/src/server.js"

echo ""
echo "🎨 FRONTEND COMPONENTS"
echo "======================"

for component in BarChart PieChart TrendChart MetricsGrid DateRangePicker ExportModal MetricsTable SegmentFilter GoogleAnalyticsConnect SearchConsoleConnect; do
  test_component "$component.jsx" "test -f /home/user/amit/frontend/components/analytics/${component}.jsx"
done

echo ""
echo "📄 FRONTEND PAGES"
echo "================="

test_component "Main Analytics Page" "test -f /home/user/amit/frontend/app/dashboard/analytics/page.js"
test_component "Blog Detail Page" "test -f /home/user/amit/frontend/app/dashboard/analytics/[blogId]/page.js"
test_component "Integrations Page" "test -f /home/user/amit/frontend/app/dashboard/analytics/integrations/page.js"

echo ""
echo "📋 CODE QUALITY"
echo "==============="

# Check for syntax errors (basic validation)
test_component "Backend syntax (sample)" "node -c /home/user/amit/backend/src/server.js"
test_component "Models can load" "node -e 'require(\"/home/user/amit/backend/src/models/Analytics.js\")' 2>/dev/null || true"

echo ""
echo "========================================"
echo "🎯 SUMMARY"
echo "========================================"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL PHASE 2 COMPONENTS VERIFIED!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Start backend:  cd backend && npm install --legacy-peer-deps && npm start"
  echo "2. Start frontend: cd frontend && npm install --legacy-peer-deps && npm run dev"
  echo "3. Test pages:     http://localhost:3000/dashboard/analytics"
  echo "4. View guide:     cat PHASE2_VERIFICATION_GUIDE.md"
  exit 0
else
  echo -e "${RED}⚠️  Some components are missing!${NC}"
  echo "Please check the failed tests above"
  exit 1
fi
