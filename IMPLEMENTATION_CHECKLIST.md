<!-- Implementation Checklist -->
<!-- Generated: 2025-11-08 -->

# Loyalty Platform MVP - Implementation Checklist

## ✅ Completed (All Core Features)

### Phase 0: Environment & Package Setup
- [x] Install all required packages (plaid, web-push, vite-plugin-pwa, @convex-dev/geospatial, autumn-js, @useautumn/convex)
- [x] Install dev dependencies (@types/web-push, atmn)
- [x] Set all Convex environment variables:
  - [x] PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV
  - [x] RESEND_API_KEY
  - [x] AUTUMN_SECRET_KEY
  - [x] VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (generated)
  - [x] ENCRYPTION_SECRET (generated)
  - [x] SITE_URL
- [x] Register all Convex components (betterAuth, resend, geospatial, autumn)

### Phase 1: Database Schema & Auth
- [x] Create complete schema with all tables and indexes (`convex/schema.ts`)
- [x] Add Better Auth triggers for auto-creating profiles
- [x] Create user management functions with role-based auth
- [x] Add getCurrentUserWithProfile helper

### Phase 2: Plaid Integration
- [x] Create AES-256-GCM encryption helpers
- [x] Create link token generation action
- [x] Create public token exchange with encryption
- [x] Create transaction sync with cursor pagination
- [x] Create webhook verification with JWS
- [x] Add Plaid webhook HTTP endpoint
- [x] Create all helper mutations (savePlaidAccount, insertTransaction, etc.)

### Phase 3: Matching Engine & Rewards
- [x] Create transaction matching with 100-point scoring algorithm
- [x] Create reward calculation with visit counting
- [x] Create batch processing for unmatched transactions
- [x] Create cron job for scheduled matching (every 5 minutes)

### Phase 4: Business Functions
- [x] Create business CRUD operations
- [x] Create unique slug generation
- [x] Create reward program management with ownership validation
- [x] Create public business queries (getBySlug, getActivePrograms, getStats)
- [x] Create dashboard stats queries

### Phase 5: Notifications
- [x] Create push subscription handler
- [x] Create Web Push sending with VAPID
- [x] Create Resend email component wrapper
- [x] Create reward earned notification orchestration
- [x] Create notification list and mark as read
- [x] Add Resend webhook HTTP endpoint

### Phase 6: Autumn Billing
- [x] Create pricing-as-code config (free tier + pro tier)
- [x] Initialize Autumn in Convex
- [x] Add feature gating to reward program creation

### Phase 7: Design System
- [x] Update styles.css with OKLCH colors (already present)
- [x] Add card playfulness and layout utilities
- [x] Create ProgressCard component
- [x] Create BottomSheet component (responsive)
- [x] Create MultistepForm wrapper
- [x] Create ShareYourPageCard component

### Phase 8: Frontend Routes
- [x] Remove demo routes
- [x] Create landing page with SSR
- [x] Create signup/login routes (SSR disabled)
- [x] Create app entry point with smart redirect
- [x] Create authenticated layout with auth guard
- [x] Create consumer routes:
  - [x] Dashboard with progress cards
  - [x] Onboarding with Plaid Link
  - [x] Merchants listing
  - [x] Rewards (active/completed)
  - [x] Notifications center
- [x] Create business routes:
  - [x] Register (multistep form)
  - [x] Dashboard with stats and share card
  - [x] Programs listing
  - [x] Create program (multistep form)
  - [x] Analytics

### Phase 9: Public Pages (Viral Growth)
- [x] Create public business page route (`/join/$slug`)
- [x] Enable SSR for social media previews
- [x] Add share functionality
- [x] Add context-aware signup with ref param

### Phase 10: PWA
- [x] Configure VitePWA plugin in vite.config.ts
- [x] Add PWA manifest configuration
- [x] Configure service worker with Convex API caching
- [x] Create push notification client helper
- [x] Add Plaid Link script to root route
- [x] Add toast notifications (Sonner)

## 🔧 Manual Steps Required

### Before First Run
- [ ] Ensure `.env.local` has VITE_CONVEX_URL and VITE_VAPID_PUBLIC_KEY
  - Get VITE_CONVEX_URL from `npx convex dev` output
  - Use same VAPID public key as Convex env

### After First Run
- [ ] Push Autumn pricing config: `npx atmn push`
- [ ] Update first user's role to `business_owner` in Convex dashboard
- [ ] Create a business and set its status to `verified` in Convex dashboard

### For Testing
- [ ] Test Plaid Link flow with sandbox credentials (user_good / pass_good)
- [ ] Test transaction matching by triggering sync or waiting for cron
- [ ] Test reward completion and notifications
- [ ] Test public business page and share functionality
- [ ] Test billing limits (free tier: 1 program max)

## 📁 File Structure Summary

### Backend (`convex/`)
```
convex/
├── schema.ts                    # Database schema
├── auth.ts                      # Better Auth + triggers
├── users.ts                     # User management
├── http.ts                      # HTTP webhooks
├── crons.ts                     # Scheduled jobs
├── plaid/                       # Plaid integration (6 files)
├── matching/                    # Matching engine (3 files)
├── businesses/                  # Business management (4 files)
├── rewardPrograms/              # Program CRUD (1 file)
├── notifications/               # Push + email (4 files)
├── consumer/                    # Consumer queries (1 file)
├── sendEmails.ts                # Resend wrapper
├── autumn.ts                    # Billing setup
└── geospatial.ts                # Location index
```

### Frontend (`src/`)
```
src/
├── components/                  # Shared UI (4 components)
├── lib/                         # Utilities + auth client
├── routes/
│   ├── index.tsx                # Landing (SSR)
│   ├── signup.tsx               # Signup
│   ├── login.tsx                # Login
│   ├── app.tsx                  # Smart redirect
│   ├── join/$slug.tsx           # Public page (SSR)
│   └── (authenticated)/
│       ├── _layout.tsx          # Auth guard
│       ├── consumer/            # 5 consumer routes
│       └── business/            # 4 business routes
└── styles.css                   # Design tokens
```

## 🎯 MVP Features Delivered

**Consumer Experience**
- ✅ Email/password authentication
- ✅ Plaid Link integration for card linking
- ✅ Automatic transaction matching
- ✅ Progress tracking for multiple businesses
- ✅ Push + email notifications when rewards earned
- ✅ Dashboard with progress cards
- ✅ Business directory
- ✅ Rewards center

**Business Experience**
- ✅ Business registration with verification flow
- ✅ Reward program creation (visit-based)
- ✅ Dashboard with stats (visits, rewards, customers)
- ✅ Analytics page
- ✅ Public shareable page with unique slug
- ✅ Social share functionality
- ✅ Billing limits (free: 1 program, pro: unlimited)

**Viral Growth**
- ✅ Public business pages (`/join/{slug}`)
- ✅ SSR for social media previews (Open Graph)
- ✅ Context-aware signup (`?ref={slug}`)
- ✅ "Sign up once, get loyalty everywhere" messaging
- ✅ Social proof on public pages

**Technical Excellence**
- ✅ End-to-end type safety
- ✅ Encrypted Plaid tokens (AES-256-GCM)
- ✅ Webhook signature verification
- ✅ Role-based authorization
- ✅ Idempotent transaction processing
- ✅ Cursor-based pagination
- ✅ Scheduled background jobs
- ✅ Real-time updates with Convex
- ✅ Selective SSR (public pages) + SPA (app routes)
- ✅ PWA installable with offline support

## 🚀 Ready to Launch

All core MVP features are implemented and ready for testing. Follow the QUICKSTART.md guide to get the application running locally.

The platform is production-ready pending:
1. Domain verification for Resend
2. HTTPS setup for Web Push
3. Production environment variable configuration
4. Business verification workflow

---

_Implementation completed: 2025-11-08_

