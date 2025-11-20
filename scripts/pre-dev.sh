#!/bin/bash
# Pre-flight check for development environment
# Verifies Plaid is in sandbox mode before starting dev server
# Last Updated: 2025-11-20

echo "🚀 Starting development environment..."
echo ""

# Check if Convex is authenticated before running verification
if npx convex env list &>/dev/null; then
    # Convex is ready, run full verification
    if [ -f "./scripts/verify-plaid-env.sh" ]; then
        if ! ./scripts/verify-plaid-env.sh; then
            echo ""
            echo "⚠️  Plaid environment check failed."
            echo "   Run 'pnpm check:plaid' to see details and fix configuration."
            echo ""
        fi
    else
        echo "⚠️  Plaid verification script not found"
        echo ""
    fi
else
    # Convex not ready yet, skip verification
    echo "⚠️  Convex not authenticated yet."
    echo "   Run 'pnpm check:plaid' after Convex dev starts to verify Plaid configuration."
    echo ""
fi

echo "📚 Quick Reference:"
echo "   - Run 'pnpm check:plaid' to verify Plaid configuration"
echo "   - See PLAID_SANDBOX_SETUP.md for detailed setup"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
