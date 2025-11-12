# Demo Data Documentation

**Last Updated:** 2025-11-12

## Overview

The `convex/seedData.ts` file contains functions to generate realistic demo data for the No Punch Cards loyalty platform. This data is useful for development, testing, and demonstrations.

## Available Functions

### `resetWithDemoData` (Internal Mutation)

**Purpose:** Clears all existing data and creates a fresh set of demo data.

**Usage:**
```typescript
// Run via Convex dashboard or MCP
await ctx.runMutation(internal.seedData.resetWithDemoData, {});
```

**What it creates:**
- 8 businesses with verified status
- 8 business owner profiles
- 5 consumer profiles with completed onboarding
- 8 reward programs (one per business)
- 3 Plaid accounts (linked to first 3 consumers)
- 23+ transactions (5-15 per consumer with Plaid account)
- 13+ reward progress records (based on transactions)

### `clearAllData` (Internal Mutation)

**Purpose:** Removes all app data (businesses, profiles, transactions, etc.)

**Note:** Does NOT delete Better Auth system tables (user, session, account) as these are managed by Better Auth.

### `createDemoData` (Internal Mutation)

**Purpose:** Creates demo data without clearing existing data first.

## Demo Businesses

All businesses are verified and have active reward programs:

1. **Rossi's Pizzeria** 🍕
   - Category: Restaurant
   - Location: 142 Main Street, Downtown
   - Reward: Buy 5 pizzas, get your 6th free!
   - Statement Descriptors: `SQ*ROSSIS PIZZA`, `ROSSIS PIZZERIA`

2. **Brew Haven** ☕
   - Category: Coffee Shop
   - Location: 87 Oak Avenue, Arts District
   - Reward: Earn a free drink every 10 visits
   - Statement Descriptors: `SQ*BREW HAVEN`, `BREW HAVEN COFFEE`

3. **The Fit Factory** 💪
   - Category: Fitness
   - Location: 500 Wellness Boulevard
   - Reward: Visit 20 times to earn a free personal training session
   - Statement Descriptors: `FIT FACTORY`, `THE FIT FACTORY`

4. **Sweet Tooth Bakery** 🧁
   - Category: Bakery
   - Location: 23 Bakery Lane
   - Reward: Buy 12 pastries, get your 13th free
   - Statement Descriptors: `SQ*SWEET TOOTH`, `SWEET TOOTH BAKERY`

5. **Green Lawn Care Services** 🌱
   - Category: Services
   - Location: 1200 Garden Road
   - Reward: After 4 regular services, get 20% off your next visit
   - Statement Descriptors: `GREEN LAWN CARE`, `GLC SERVICES`

6. **Zen Medi Spa** 🧖
   - Category: Beauty & Wellness
   - Location: 456 Serenity Street
   - Reward: Book 6 treatments and receive a complimentary upgrade
   - Statement Descriptors: `ZEN MEDI SPA`, `ZEN SPA`

7. **QuickWash Auto Spa** 🚗
   - Category: Automotive
   - Location: 789 Auto Plaza
   - Reward: Wash your car 8 times and get a free premium detail
   - Statement Descriptors: `QUICKWASH AUTO`, `QUICKWASH SPA`

8. **Le Petit Bistro** 🍽️
   - Category: Restaurant
   - Location: 95 Bistro Boulevard
   - Reward: Dine with us 7 times and enjoy a complimentary appetizer
   - Statement Descriptors: `LE PETIT BISTRO`, `SQ*PETIT BISTRO`

## Demo Users

### Consumers (5)
- Sarah Johnson (sarah.johnson@example.com)
- Michael Chen (michael.chen@example.com)
- Emma Williams (emma.williams@example.com)
- James Rodriguez (james.rodriguez@example.com)
- Olivia Taylor (olivia.taylor@example.com)

All consumers have:
- Completed onboarding
- Linked card status
- Realistic creation dates (last 90 days)

First 3 consumers also have:
- Plaid accounts linked to "Demo Bank"
- 5-15 transactions each
- Reward progress at various businesses

### Business Owners (8)
Each business has a dedicated owner:
- Antonio Rossi (antonio@rossis-pizzeria.com) → Rossi's Pizzeria
- Lisa Park (lisa@brewhaven.com) → Brew Haven
- David Kim (david@thefitfactory.com) → The Fit Factory
- Maria Garcia (maria@sweettoothbakery.com) → Sweet Tooth Bakery
- Thomas Anderson (tom@greenlawncare.com) → Green Lawn Care Services
- Jennifer Wu (jennifer@zenmedispa.com) → Zen Medi Spa
- Robert Martinez (robert@quickwash.com) → QuickWash Auto Spa
- Sophie Laurent (sophie@petitbistro.com) → Le Petit Bistro

## Demo Transactions

Transactions are created with:
- Random amounts between $5-$85
- Random dates within the last 60 days
- Matched status (linked to businesses)
- Realistic merchant names
- Category: "Food and Drink", "Restaurants"

## Demo Reward Progress

Reward progress records are automatically calculated based on transactions:
- Current visit count (modulo program's required visits)
- Total rewards earned (visits ÷ required visits)
- Last visit date
- Transaction history
- Active status

## Important Limitations

### ⚠️ Demo User IDs vs Real User Accounts

**The demo data uses FAKE user IDs** that do not correspond to actual Better Auth users. Demo user IDs follow this pattern:
- Consumers: `demo_consumer_email@example.com`
- Business Owners: `demo_owner_email@example.com`

**Impact:**
- Real users logging into the app will NOT see the demo data
- Real users need to create their own profiles through normal onboarding
- Demo businesses and transactions exist but are associated with fake users
- You cannot log in as demo users

**Why:**
Better Auth manages user authentication separately from our app data. We cannot create fake Better Auth users in the demo data, so we use placeholder user IDs instead.

**Workaround:**
To test the app with a real account:
1. Sign up with a real email
2. Complete onboarding
3. Create your own business or link a card
4. The demo businesses will be visible in browse/discover features
5. Your own data will be separate from demo data

## Viewing Demo Data

You can view demo data in the Convex dashboard:

1. **Businesses:** Browse all 8 demo businesses with details
2. **Reward Programs:** See active programs for each business
3. **Transactions:** View transaction history for demo consumers
4. **Reward Progress:** Check progress towards rewards
5. **Profiles:** See consumer and business owner profiles

## Resetting Demo Data

To reset the database with fresh demo data:

```bash
# Via Convex dashboard:
# 1. Go to Functions
# 2. Find seedData:resetWithDemoData
# 3. Click "Run"

# Or use Convex MCP tools
```

## Future Enhancements

Potential additions to demo data:
- [ ] Notifications (reward earned, program updates)
- [ ] More diverse transaction categories
- [ ] Seasonal or special reward programs
- [ ] Multi-location businesses
- [ ] Customer reviews/ratings
- [ ] Referral program data
- [ ] More realistic transaction patterns
- [ ] Business analytics data

## Technical Notes

- All dates/times use realistic random values within specified ranges
- Locations use Chicago area coordinates (around 41.88°N, 87.63°W)
- MCC codes correspond to actual merchant category codes
- Statement descriptors match real-world patterns (e.g., "SQ*" for Square)
- Transaction amounts are in cents (500 = $5.00)
- All demo IDs are prefixed with "demo_" for easy identification

---

_Last updated: 2025-11-12_

