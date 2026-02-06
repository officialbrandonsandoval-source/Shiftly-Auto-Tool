#!/bin/bash
# Test Auth Endpoints

BASE_URL="http://localhost:3001"

echo "========================================="
echo "Testing Auth Endpoints"
echo "========================================="
echo ""

# Test 1: Signup
echo "1️⃣ Testing Signup..."
SIGNUP_RESPONSE=$(curl -s -X POST $BASE_URL/auth/v2/signup/dealership \
  -H "Content-Type: application/json" \
  -d '{
    "dealershipName": "Brandon Test Dealership",
    "email": "brandon@test.com",
    "password": "Password123!",
    "name": "Brandon Admin"
  }')

echo "Response: $SIGNUP_RESPONSE"
echo ""

# Extract tokens from signup response
ACCESS_TOKEN=$(echo $SIGNUP_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
API_KEY=$(echo $SIGNUP_RESPONSE | grep -o '"apiKey":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Signup failed - no access token received"
  exit 1
fi

echo "✅ Signup successful!"
echo "   Access Token: ${ACCESS_TOKEN:0:20}..."
echo "   API Key: ${API_KEY:0:20}..."
echo ""

# Test 2: Login
echo "2️⃣ Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/v2/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "brandon@test.com",
    "password": "Password123!"
  }')

echo "Response: $LOGIN_RESPONSE"
echo ""

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
  echo "✅ Login successful!"
else
  echo "❌ Login failed"
fi

echo ""
echo "========================================="
echo "Auth Test Complete!"
echo "========================================="
