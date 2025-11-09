# Transaction Matching System

**Last Updated:** 2025-11-09

## Overview

The transaction matching system determines if a card transaction belongs to a registered business using a **multi-signal scoring algorithm**. This prevents false positives by requiring convergence of multiple independent signals rather than relying on any single indicator.

## Core Principle

**No single signal is sufficient for matching.** The system requires a minimum score of 90 points from multiple weighted signals to confidently match a transaction to a business.

## Business Onboarding

### Statement Descriptors Collection

During business registration, owners are asked: **"How do you appear on credit card statements?"**

The form provides helpful examples:
- `SQ*YOUR BUSINESS` (Square)
- `TST*YOUR BUSINESS` (Toast)
- `STRIPE*YOUR BUSINESS` (Stripe)
- `CLOVER*YOUR BUSINESS` (Clover)
- `YOUR BUSINESS NAME` (Direct merchant account)

**Key Design Decision:** Statement descriptors are stored as an array (`statementDescriptors: string[]`) because:
1. Businesses may use multiple payment processors
2. Descriptors can change over time
3. Different locations may have different descriptors

**Normalization:** All descriptors are:
- Trimmed of whitespace
- Converted to UPPERCASE
- Filtered to remove empty strings

Example storage:
```typescript
{
  name: "Joe's Coffee Shop",
  statementDescriptors: ["SQ*JOES COFFEE", "JOES COFFEE SHOP"]
}
```

## Multi-Signal Scoring Algorithm

### Signal 1: Statement Descriptor Match (60-70 points)

**Strong signal, but NOT unique** - multiple businesses could share similar descriptors.

Scoring:
- Exact match: **70 points**
- Partial match (contains or is contained): **60 points**

Example:
- Transaction: `"SQ*COFFEE"`
- Descriptor: `"SQ*COFFEE"` → 70 points
- Descriptor: `"SQ*COFFEE SHOP"` → 60 points

### Signal 2: Business Name Match (40-100 points, weighted)

The business name is compared to the merchant name from Plaid.

**Adaptive weighting:** If a descriptor already matched, name match weight is reduced to 50% to avoid double-counting the same evidence.

Scoring (before weight):
- Exact name match: **100 points**
- Business name substring of merchant: **50 points**
- Merchant name substring of business: **40 points**
- Partial word match (words > 3 chars): **20 points × number of matching words**

Example scenarios:
```typescript
// Scenario 1: Descriptor match exists (weight = 0.5)
// Transaction: "SQ*JOES COFFEE"
// Business: "Joe's Coffee Shop"
// Descriptor matched: 70 points
// Name partial match: 50 × 0.5 = 25 points
// Total: 95 points ✓

// Scenario 2: No descriptor (weight = 1.0)
// Transaction: "JOES COFFEE SHOP"
// Business: "Joe's Coffee Shop"
// Name exact match: 100 × 1.0 = 100 points
// Total: 100 points ✓
```

### Signal 3: Category Match (20 points)

Plaid transaction categories are mapped to business categories.

Category mappings:
- **Coffee** → `["food and drink", "coffee", "cafe", "restaurants"]`
- **Restaurant** → `["food and drink", "restaurants", "fast food"]`
- **Retail** → `["shops", "retail", "clothing", "electronics"]`
- **Grocery** → `["shops", "food and drink", "groceries", "supermarkets"]`
- **Fitness** → `["recreation", "gyms and fitness", "sports"]`
- **Salon** → `["shops", "beauty", "personal care"]`

### Signal 4: Location Proximity (0-30 points, distance-weighted)

Uses **Haversine formula** to calculate great-circle distance between transaction location and business location.

Scoring tiers:
- Within 1 km: **30 points**
- 1-5 km: **15 points**
- 5-10 km: **5 points**
- Beyond 10 km: **0 points**

**Important:** Plaid doesn't always provide transaction location, and businesses may not provide exact coordinates. This signal is optional but highly valuable when available.

## Confidence Thresholds

### High Confidence (Score ≥ 90) → Auto-Match

The transaction is automatically matched to the business and rewards are calculated.

**Example scenarios:**

✅ **Descriptor + Location + Category** (Score: 120)
- Transaction: "SQ*JOES COFFEE" at (37.7749, -122.4194)
- Business: "Joe's Coffee Shop" with descriptor "SQ*JOES COFFEE", 0.3km away, category=Coffee
- Score: 70 (descriptor) + 30 (location) + 20 (category) = **120**

✅ **Exact Name Match** (Score: 100)
- Transaction: "JOES COFFEE SHOP"
- Business: "Joe's Coffee Shop"
- Score: 100 (exact name) = **100**

✅ **Descriptor + Partial Name + Category** (Score: 105)
- Transaction: "SQ*COFFEE DOWNTOWN"
- Business: "Downtown Coffee" with descriptor "SQ*COFFEE"
- Score: 70 (descriptor) + 25 (partial name × 0.5 weight) + 20 (category) = **115**

### Medium Confidence (70-89) → Flagged for Review

The transaction is **NOT auto-matched** but is logged as a potential match needing manual review.

⚠️ **Example:**
- Transaction: "SQ*COFFEE"
- Multiple businesses with "SQ*COFFEE" descriptor
- Score: 70 (descriptor only) = **70** → Needs review

### Low Confidence (< 70) → No Match

The transaction remains `unmatched` for future processing.

## Database Schema

### Businesses Table

```typescript
businesses: defineTable({
  ownerId: v.string(),
  name: v.string(),
  slug: v.string(),
  category: v.string(),
  address: v.optional(v.string()),
  location: v.optional(v.object({ lat: v.number(), lng: v.number() })),
  statementDescriptors: v.optional(v.array(v.string())), // 🆕
  status: v.union(v.literal("verified"), v.literal("unverified")),
  mccCodes: v.optional(v.array(v.string())),
  // ... other fields
})
```

### Transactions Table

```typescript
transactions: defineTable({
  plaidTransactionId: v.string(),
  userId: v.string(),
  merchantName: v.optional(v.string()),
  amount: v.number(),
  category: v.optional(v.array(v.string())),
  location: v.optional(v.object({ lat: v.number(), lng: v.number() })), // 🆕
  businessId: v.optional(v.id("businesses")),
  status: v.union(
    v.literal("pending"),
    v.literal("matched"),
    v.literal("unmatched")
  ),
  // ... other fields
})
```

## Processing Flow

1. **Transaction Sync** - Plaid webhook triggers `/transactions/sync`
2. **Insert Unmatched** - New transactions inserted with `status: "unmatched"`
3. **Cron Job** - Runs periodically to process unmatched transactions
4. **Batch Processing** - `processNewTransactions` action queries up to 100 unmatched transactions
5. **Multi-Signal Matching** - Each transaction scored against all verified businesses
6. **Auto-Match or Skip** - Score ≥ 90 → match, < 90 → remains unmatched
7. **Reward Calculation** - Matched transactions trigger reward progress update

## Example Matching Scenarios

### ✅ Perfect Match (Score: 120)

```
Transaction:
  merchantName: "SQ*JOES COFFEE"
  location: { lat: 37.7749, lng: -122.4194 }
  category: ["Food and Drink", "Coffee"]
  
Business:
  name: "Joe's Coffee Shop"
  statementDescriptors: ["SQ*JOES COFFEE"]
  location: { lat: 37.7750, lng: -122.4195 } // ~111 meters away
  category: "Coffee"

Scoring:
  ✓ Descriptor exact match: 70 points
  ✓ Name partial match: 25 points (50 × 0.5 weight)
  ✓ Category match: 20 points
  ✓ Location < 1km: 30 points
  Total: 145 points → MATCHED
```

### ⚠️ Ambiguous Match (Score: 70)

```
Transaction:
  merchantName: "SQ*PIZZA"
  
Business A:
  name: "Tony's Pizza"
  statementDescriptors: ["SQ*PIZZA"]
  
Business B:
  name: "Pizza Palace"
  statementDescriptors: ["SQ*PIZZA"]

Scoring (both businesses):
  ✓ Descriptor exact match: 70 points
  Total: 70 points → NEEDS REVIEW (both businesses tied)
```

### ✗ Wrong Location (Score: 40)

```
Transaction:
  merchantName: "SQ*JOES"
  location: { lat: 37.7749, lng: -122.4194 } // San Francisco
  
Business:
  name: "Joe's Coffee Shop"
  statementDescriptors: ["SQ*JOES"]
  location: { lat: 40.7128, lng: -74.0060 } // New York (>4000km away)

Scoring:
  ✓ Descriptor exact match: 70 points
  ✗ Location > 10km: 0 points
  Total: 70 points → NO MATCH (location mismatch suggests wrong business)
```

## Future Enhancements

### Potential Improvements

1. **Machine Learning** - Train a model on confirmed matches to improve scoring weights
2. **Temporal Patterns** - Consider user's transaction history and patterns
3. **Merchant Metadata** - Use Plaid's merchant entity IDs when available
4. **User Feedback** - Allow users to confirm/reject matches to improve algorithm
5. **Multi-Location Businesses** - Support chains with multiple locations
6. **Time-Based Matching** - Consider business hours (unlikely to visit at 3am)

### Monitoring Metrics

Track these metrics to improve the algorithm:
- **Match Rate** - % of transactions auto-matched
- **False Positive Rate** - Incorrectly matched transactions
- **False Negative Rate** - Should-match transactions that didn't
- **Review Queue Size** - Transactions scoring 70-89
- **Signal Correlation** - Which signals most often align with correct matches

## Technical Notes

### Type Safety

The `location` field uses `(tx as any).location` temporarily until Convex regenerates TypeScript types. Once `convex dev` runs, the generated `dataModel.d.ts` will include the location field.

### Performance Considerations

- **Index Usage** - Query uses `by_status` index for efficient filtering
- **Batch Processing** - Processes 100 transactions at a time to avoid timeout
- **Early Exit** - Matching stops as soon as threshold is met (though all businesses are scored for best match)

### Normalization

All string comparisons:
- Convert to lowercase for case-insensitive matching
- Trim whitespace
- Handle special characters (e.g., "Joe's" vs "Joes")

---

_This document describes the multi-signal transaction matching system implemented on 2025-11-09._

