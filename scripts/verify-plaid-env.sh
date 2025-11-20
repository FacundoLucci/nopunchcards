#!/bin/bash
# Plaid Environment Verification Script
# Ensures dev server runs in sandbox mode
# Last Updated: 2025-11-20

set -e

echo "🔍 Verifying Plaid Environment Configuration..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if convex CLI is available
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Error: npx not found. Please install Node.js and npm.${NC}"
    exit 1
fi

# Function to check environment variable
check_env_var() {
    local var_name=$1
    local expected_value=$2
    local is_required=$3
    
    echo -n "Checking $var_name... "
    
    # Try to get the environment variable
    local value
    value=$(npx convex env get "$var_name" 2>/dev/null || echo "")
    
    if [ -z "$value" ]; then
        if [ "$is_required" = "true" ]; then
            echo -e "${RED}❌ NOT SET${NC}"
            return 1
        else
            echo -e "${YELLOW}⚠️  NOT SET (optional)${NC}"
            return 0
        fi
    fi
    
    # Check if value matches expected (if expected value provided)
    if [ -n "$expected_value" ]; then
        if [ "$value" = "$expected_value" ]; then
            echo -e "${GREEN}✅ $value${NC}"
            return 0
        else
            echo -e "${RED}❌ $value (expected: $expected_value)${NC}"
            return 1
        fi
    else
        echo -e "${GREEN}✅ SET${NC}"
        return 0
    fi
}

# Main verification
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Plaid Configuration Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

all_checks_passed=true

# Check PLAID_ENV (must be sandbox for dev)
if ! check_env_var "PLAID_ENV" "sandbox" "true"; then
    all_checks_passed=false
    echo ""
    echo -e "${YELLOW}💡 To fix: npx convex env set PLAID_ENV \"sandbox\"${NC}"
fi

# Check PLAID_CLIENT_ID
echo ""
if ! check_env_var "PLAID_CLIENT_ID" "" "true"; then
    all_checks_passed=false
    echo ""
    echo -e "${YELLOW}💡 To fix: npx convex env set PLAID_CLIENT_ID \"your-client-id\"${NC}"
fi

# Check PLAID_SECRET
echo ""
if ! check_env_var "PLAID_SECRET" "" "true"; then
    all_checks_passed=false
    echo ""
    echo -e "${YELLOW}💡 To fix: npx convex env set PLAID_SECRET \"your-secret\"${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$all_checks_passed" = true ]; then
    echo -e "${GREEN}✅ All checks passed! Plaid is configured for sandbox mode.${NC}"
    echo ""
    echo "📝 Sandbox Test Credentials:"
    echo "   Username: user_good"
    echo "   Password: pass_good"
    echo "   2FA Code: 1234"
    echo ""
    echo "🚀 You can now run: pnpm dev"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please fix the configuration above.${NC}"
    echo ""
    echo "📚 For more information, see: PLAID_SANDBOX_SETUP.md"
    exit 1
fi
