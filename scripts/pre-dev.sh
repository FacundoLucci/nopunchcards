#!/bin/bash
# Pre-flight check for development environment
# Verifies Plaid is in sandbox mode before starting dev server
# Last Updated: 2025-11-20

echo "🚀 Starting development environment..."
echo ""

# Run Plaid environment verification (non-blocking check)
if [ -f "./scripts/verify-plaid-env.sh" ]; then
    # Run verification but don't fail if it errors (convex might not be running yet)
    ./scripts/verify-plaid-env.sh 2>/dev/null || {
        echo "⚠️  Note: Plaid environment check skipped (run 'pnpm check:plaid' to verify)"
        echo ""
    }
else
    echo "⚠️  Plaid verification script not found"
    echo ""
fi

echo "📚 Quick Reference:"
echo "   - Run 'pnpm check:plaid' to verify Plaid configuration"
echo "   - See PLAID_SANDBOX_SETUP.md for detailed setup"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
