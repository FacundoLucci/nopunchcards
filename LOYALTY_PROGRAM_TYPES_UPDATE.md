# Loyalty Program Types Update

**Created:** 2025-11-12  
**Last Updated:** 2025-11-12  
**Netlify Build Issues:** Fixed 2025-11-12

## Overview

This document details the implementation of spend-based loyalty programs alongside the existing visit-based programs, including support for minimum spend requirements per visit.

## Changes Summary

### 1. Schema Updates (`/workspace/convex/schema.ts`)

#### Reward Programs Table
- **Updated `type` field**: Changed from `v.literal("visit")` to `v.union(v.literal("visit"), v.literal("spend"))`
- **Updated `rules` field**: Changed from simple object to union type supporting both program types:
  ```typescript
  // Visit-based rules
  {
    visits: number,
    reward: string,
    minimumSpendCents?: number  // Optional minimum spend per visit
  }
  
  // Spend-based rules
  {
    spendAmountCents: number,  // Total spend needed to earn reward
    reward: string
  }
  ```

#### Reward Progress Table
- **Added `currentSpendCents` field**: `v.optional(v.number())` - Tracks spending progress for spend-based programs
- **Updated comments**: Clarified that `currentVisits` is for visit-based programs

### 2. Backend Updates

#### Mutations (`/workspace/convex/rewardPrograms/mutations.ts`)
- **`create` mutation**: Updated to accept `type` and new `rules` structure
- **`update` mutation**: Updated to support modifying program type and rules
- **`listByBusiness` query**: Updated return type to match new rules schema

#### Consumer Queries (`/workspace/convex/consumer/queries.ts`)
- **`getActiveProgress` query**: Returns different structure based on program type
  - Visit-based: includes `currentVisits`, `totalVisits`, `minimumSpendCents`
  - Spend-based: includes `currentSpendCents`, `totalSpendCents`
- **`getNearbyRewards` query**: Updated to return program type and relevant fields
- **`getRecentTransactions` query**: Updated to show progress for both program types

#### Reward Calculation (`/workspace/convex/matching/calculateRewards.ts`)
Complete rewrite to handle both program types:
- **Visit-based logic**:
  - Checks minimum spend requirement before counting visit
  - Only increments visit count if transaction meets minimum spend
  - Awards reward when visit threshold is reached
- **Spend-based logic**:
  - Accumulates transaction amounts
  - Awards reward when spend threshold is reached
  - Tracks total spend across multiple transactions

### 3. Frontend Updates

#### Business Owner Forms

**Program Creation Form** (`/workspace/src/routes/_authenticated/business/programs/create.tsx`)
- Added program type selection step (visit vs spend)
- Dynamic form steps based on selected type:
  - **Visit-based**: Number of visits + optional minimum spend per visit
  - **Spend-based**: Total spend amount required
- Updated preview to show appropriate UI for each program type
- Proper currency handling (cents conversion)

**Program List** (`/workspace/src/routes/_authenticated/business/programs/index.tsx`)
- Displays program type badge
- Shows appropriate details based on program type:
  - Visit-based: "5 visits → reward (Min $X/visit if applicable)"
  - Spend-based: "Spend $X → reward"

#### Consumer-Facing Components

**Progress Card** (`/workspace/src/components/ProgressCard.tsx`)
- Complete rewrite with discriminated union props
- **Visit-based display**: 
  - Punch-hole style dots for visits
  - Shows minimum spend requirement if applicable
- **Spend-based display**:
  - Progress bar with gradient
  - Shows current spend vs. goal in dollars

**Consumer Home** (`/workspace/src/routes/_authenticated/consumer/home.tsx`)
- Updated greeting message to handle both program types
- Conditional rendering of ProgressCard based on program type
- Proper prop passing for visit vs spend programs

**Rewards List** (`/workspace/src/routes/_authenticated/consumer/rewards/index.tsx`)
- Shows appropriate progress metrics based on program type
- Visit-based: "X/Y visits"
- Spend-based: "$X/$Y"

**Find Rewards** (`/workspace/src/routes/_authenticated/consumer/find-rewards.tsx`)
- Updated reward descriptions to show program type and requirements
- Visit-based: "Visit X times (min $Y/visit), get Z"
- Spend-based: "Spend $X, get Y"

## Features

### Visit-Based Programs
- Track number of visits to a business
- Optional minimum spend per visit requirement
- Visit only counts if minimum spend is met
- Award reward after specified number of qualifying visits

### Spend-Based Programs
- Track total spending amount across all transactions
- Award reward when cumulative spending reaches goal
- Automatically accumulates spending from multiple visits

### Common Features
- Auto-renewal: After earning a reward, a new progress cycle starts automatically
- Transaction audit trail: All qualifying transactions are tracked
- Multiple active programs: Users can participate in multiple programs per business

## Database Migration Notes

**Note**: The schema changes are backward compatible with existing data:
- Old visit-based programs still work (have `visits` in rules)
- `currentSpendCents` is optional, so existing progress records remain valid
- New programs can be created with either type

**Recommended Actions**:
1. Existing programs will continue to work as visit-based programs
2. No data migration required
3. New programs can be created with either type starting immediately

## Testing Checklist

✅ Schema compiles without errors  
✅ No linting errors in all modified files  
✅ TypeScript type errors fixed (program rules union types)
✅ Business forms updated for both program types  
✅ Consumer UI updated to display both program types  
✅ Reward calculation logic handles both types  
✅ Minimum spend validation implemented  
✅ Currency formatting consistent throughout  
✅ Build succeeds locally and ready for Netlify deployment

## TypeScript Fixes Applied (2025-11-12)

Fixed type errors in the following files to handle the new union type for program rules:
- `convex/businesses/public.ts` - Updated return type for `getActivePrograms`
- `convex/consumer/accounts.ts` - Added type guards for accessing `rules.visits`
- `convex/seedData.ts` - Added type guards for seed data generation (2 occurrences)
- `src/routes/_authenticated/business/dashboard.tsx` - Added conditional rendering for program rules
- `src/routes/join/$slug.tsx` - Added type guards and conditional rendering for public program display  

## Future Enhancements

Possible future additions:
- Combination programs (e.g., "Visit 5 times AND spend $50")
- Time-limited programs (expire after X days)
- Tiered rewards (different rewards at different spend levels)
- Program editing UI for business owners
- Analytics dashboard showing program performance

## API Changes

### Mutation Arguments
```typescript
// Create Program
api.rewardPrograms.mutations.create({
  businessId: Id<"businesses">,
  name: string,
  type: "visit" | "spend",
  rules: VisitRules | SpendRules,
  description?: string
})

// VisitRules
{
  visits: number,
  reward: string,
  minimumSpendCents?: number
}

// SpendRules
{
  spendAmountCents: number,
  reward: string
}
```

### Query Returns
Both `getActiveProgress` and `getNearbyRewards` now return discriminated unions that include `programType` field to distinguish between visit and spend-based programs.

---

**Implementation Completed:** 2025-11-12  
**Status:** ✅ Ready for testing and deployment
