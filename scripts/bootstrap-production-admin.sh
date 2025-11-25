#!/bin/bash

# Bootstrap Production Admin User
#
# This script creates the first admin user in production by calling
# the /api/admin/bootstrap endpoint.
#
# Usage:
#   ./scripts/bootstrap-production-admin.sh
#
# You will be prompted for:
#   - Production URL
#   - Bootstrap secret (from BOOTSTRAP_SECRET env var in Vercel)
#   - Admin email
#   - Admin password
#   - Admin name

set -e

echo "🔐 Bootstrap Production Admin User"
echo "=================================="
echo ""

# Get production URL
read -p "Production URL (e.g., https://your-app.vercel.app): " PROD_URL
PROD_URL=$(echo "$PROD_URL" | sed 's:/*$::')  # Remove trailing slash

# Get bootstrap secret
read -sp "Bootstrap Secret (from Vercel env BOOTSTRAP_SECRET): " BOOTSTRAP_SECRET
echo ""

# Get admin details
read -p "Admin Email: " ADMIN_EMAIL
read -sp "Admin Password (min 8 chars): " ADMIN_PASSWORD
echo ""
read -p "Admin Name: " ADMIN_NAME

echo ""
echo "Creating admin user..."
echo ""

# Call the bootstrap API
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${PROD_URL}/api/admin/bootstrap" \
  -H "Content-Type: application/json" \
  -d "{
    \"secret\": \"$BOOTSTRAP_SECRET\",
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"name\": \"$ADMIN_NAME\"
  }")

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# Extract response body (all but last line)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Success! Admin user created."
  echo ""
  echo "You can now log in at:"
  echo "${PROD_URL}/auth/signin"
  echo ""
  echo "Email: $ADMIN_EMAIL"
else
  echo "❌ Failed with HTTP $HTTP_CODE"
  exit 1
fi
