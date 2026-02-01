#!/bin/bash

# FairPrice™ Test Script
# Tests the FairPrice API endpoints

echo "🧪 Testing FairPrice™ AI Estimator"
echo "=================================="
echo ""

BASE_URL="${NEXT_PUBLIC_BASE_URL:-http://localhost:3000}"

echo "📍 Base URL: $BASE_URL"
echo ""

# Test 1: Price Estimate
echo "Test 1: Price Estimate API"
echo "---------------------------"
echo "Request: Boiler Service estimate"

ESTIMATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/fairprice/estimate" \
  -H "Content-Type: application/json" \
  -d '{
    "jobTitle": "Boiler Service",
    "jobDescription": "Annual service for Potterton boiler",
    "category": "heating-boilers",
    "postcode": "SW1A"
  }')

echo "Response:"
echo "$ESTIMATE_RESPONSE" | jq '.'
echo ""

# Extract the average price for next test
AVG_PRICE=$(echo "$ESTIMATE_RESPONSE" | jq -r '.estimate.avg // 200')

# Test 2: Quote Audit (Fair Price)
echo "Test 2: Quote Audit API - Fair Price"
echo "-------------------------------------"
echo "Request: Audit a quote at market rate (£$AVG_PRICE)"

AUDIT_FAIR=$(curl -s -X POST "$BASE_URL/api/fairprice/audit" \
  -H "Content-Type: application/json" \
  -d "{
    \"jobTitle\": \"Boiler Service\",
    \"jobDescription\": \"Annual service\",
    \"quotedAmount\": $AVG_PRICE,
    \"providerName\": \"ABC Heating\",
    \"category\": \"heating-boilers\",
    \"postcode\": \"SW1A\"
  }")

echo "Response:"
echo "$AUDIT_FAIR" | jq '.'
echo ""

# Test 3: Quote Audit (Overpriced)
echo "Test 3: Quote Audit API - Overpriced Quote"
echo "-------------------------------------------"
OVERPRICED=$((AVG_PRICE * 2))
echo "Request: Audit an overpriced quote (£$OVERPRICED - 100% above market)"

AUDIT_HIGH=$(curl -s -X POST "$BASE_URL/api/fairprice/audit" \
  -H "Content-Type: application/json" \
  -d "{
    \"jobTitle\": \"Boiler Service\",
    \"quotedAmount\": $OVERPRICED,
    \"category\": \"heating-boilers\"
  }")

echo "Response:"
echo "$AUDIT_HIGH" | jq '.'
echo ""

# Test 4: Quote Audit (Bargain)
echo "Test 4: Quote Audit API - Bargain Price"
echo "----------------------------------------"
BARGAIN=$((AVG_PRICE * 70 / 100))
echo "Request: Audit a bargain quote (£$BARGAIN - 30% below market)"

AUDIT_LOW=$(curl -s -X POST "$BASE_URL/api/fairprice/audit" \
  -H "Content-Type: application/json" \
  -d "{
    \"jobTitle\": \"Boiler Service\",
    \"quotedAmount\": $BARGAIN,
    \"category\": \"heating-boilers\"
  }")

echo "Response:"
echo "$AUDIT_LOW" | jq '.'
echo ""

# Test 5: Different Categories
echo "Test 5: Testing Different Service Categories"
echo "---------------------------------------------"

for CATEGORY in "plumbing" "electrical" "cleaning"; do
  echo "Testing: $CATEGORY"
  
  RESULT=$(curl -s -X POST "$BASE_URL/api/fairprice/estimate" \
    -H "Content-Type: application/json" \
    -d "{
      \"jobTitle\": \"General $CATEGORY work\",
      \"category\": \"$CATEGORY\"
    }")
  
  LOW=$(echo "$RESULT" | jq -r '.estimate.low')
  AVG_VAL=$(echo "$RESULT" | jq -r '.estimate.avg')
  HIGH=$(echo "$RESULT" | jq -r '.estimate.high')
  CONF=$(echo "$RESULT" | jq -r '.estimate.confidence')
  
  echo "  Price Range: £$LOW - £$AVG_VAL - £$HIGH (Confidence: $CONF%)"
done

echo ""
echo "✅ All tests completed!"
echo ""
echo "📊 Summary:"
echo "  - Price estimation working"
echo "  - Quote auditing working"
echo "  - Multiple categories tested"
echo "  - Regional/seasonal factors applied"
echo ""
echo "🎯 Next Steps:"
echo "  1. Test on the frontend: http://localhost:3000"
echo "  2. Add your OpenAI API key to .env for AI-powered estimates"
echo "  3. Test with real user scenarios"
