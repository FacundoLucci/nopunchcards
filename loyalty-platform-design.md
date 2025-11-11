<!-- Design document generated: 2025-11-08 -->
<!-- Last updated: 2025-11-08T22:00:00Z -->

# No Punch Cards — UI/UX Design System & User Flows

**Created:** 2025-11-08  
**Last Updated:** 2025-11-08T22:00:00Z  
**Status:** Draft  
**Mode:** SPA (Single Page Application) with SSR for public pages

---

## Key Design Decisions

### 1. **OKLCH Color System**

- Using OKLCH color space (matches existing `styles.css`)
- Perceptually uniform - better color consistency across themes
- Future-proof for wide-gamut displays

### 2. **Light Mode First**

- **Light mode**: Clean white background with elevated, bulky cards
- **Dark mode**: True black background with subtle cards
- Background tone **never changes** - stays light OR dark
- Cards have playful subtle rotation (light mode)

### 3. **Credit Cards, Not Banks**

- Users link the **credit/debit card they shop with**
- Plaid connects to banks behind the scenes
- Messaging: "Link your card" not "Connect your bank"
- Clearer mental model for users

### 4. **No Hamburger Menu**

- Profile icon (top right) for account/settings
- Bottom navigation for main sections
- Cleaner, more modern mobile experience
- Less cognitive load

### 5. **Responsive Components**

- Bottom sheets on mobile → Centered modals on desktop
- Same component, different presentation
- Maintains consistency across devices

### 6. **Mobile-First Desktop Layout**

- **Constrained width on desktop** - max 480px-640px
- Content centered with ample whitespace on sides
- Prevents "stretched mobile" look
- Exception: Landing page can be full-width with split layouts
- App screens (dashboard, etc.) stay narrow and centered

**Layout Strategy:**

```css
/* App container */
.app-container {
  max-width: 480px; /* Phone width */
  margin: 0 auto;
  padding: 0 1rem;
}

/* Landing page - full width allowed */
.landing-section {
  max-width: 1280px; /* Wide for hero/marketing */
  margin: 0 auto;
}
```

### 7. **Viral Growth via Public Pages**

- Every business gets a unique shareable link: `/join/{business-slug}`
- Public page showcases programs without requiring login
- Copy emphasizes: **"Sign up once, get loyalty everywhere"**
- Businesses promote on social media (Instagram, Facebook, in-store QR)
- SSR for social media preview cards (Open Graph meta tags)
- Context-aware signup flow preserves business referral

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Design System](#design-system)
3. [Landing Page](#landing-page)
4. [User Flows](#user-flows)
5. [Screen Specifications](#screen-specifications)
6. [Business Public Page (Viral Growth)](#business-public-page-viral-growth)
7. [Component Library](#component-library)
8. [SPA Configuration](#spa-configuration)

---

## Design Philosophy

### Core Principles

**Separation of Concerns**

- Each screen has ONE primary action
- Clear visual hierarchy guides users to the next step
- No cognitive overload — users see only what matters now

**Mobile First**

- All designs start at 375px width (iPhone SE)
- Touch targets minimum 44x44px
- Bottom-sheet navigation for core actions
- Swipe gestures for common actions

**Minimal Black Monochrome**

- Base: True black `#000000` and pure white `#FFFFFF`
- Grays: 5-step scale from `#1A1A1A` to `#F5F5F5`
- Accent colors ONLY for state:
  - Red `#FF3B30`: Destructive actions, errors
  - Green `#34C759`: Success, progress completion
  - Yellow `#FFCC00`: Warnings, pending actions

**Multistep Forms**

- One field/question per screen when possible
- Clear progress indicators
- Instant validation
- Back navigation always available

**Full Screen Blur Modals**

- `backdrop-filter: blur(24px)`
- Centered content with max-width constraints
- Escape hatch (X button) always visible
- Dark overlay: `rgba(0, 0, 0, 0.6)`

**Rounded & Sans Serif**

- Border radius: `16px` (large), `12px` (medium), `8px` (small)
- Typography: Inter, SF Pro, system sans-serif stack
- Smooth, friendly curves contrast with sharp monochrome

---

## Design System

### Color Tokens

**Using OKLCH Color Space** (matches existing `styles.css`)

```css
/* Light Theme (Default) */
:root {
  /* Base */
  --background: oklch(1 0 0); /* Pure white */
  --foreground: oklch(0.141 0.005 285.823); /* Near black */

  /* Cards - elevated, bulky feel */
  --card: oklch(0.985 0 0); /* Off-white with shadow */
  --card-foreground: oklch(0.141 0.005 285.823);
  --card-shadow: 0 4px 6px -1px oklch(0 0 0 / 0.1), 0 2px 4px -2px oklch(0 0 0 /
          0.1);

  /* Semantic Colors */
  --destructive: oklch(0.577 0.245 27.325); /* Red */
  --success: oklch(0.646 0.222 142); /* Green */
  --warning: oklch(0.828 0.189 84.429); /* Yellow */

  /* Text */
  --text-primary: oklch(0.141 0.005 285.823);
  --text-secondary: oklch(0.552 0.016 285.938);
  --text-tertiary: oklch(0.705 0.015 286.067);

  /* Borders */
  --border: oklch(0.92 0.004 286.32);
  --border-input: oklch(0.92 0.004 286.32);
  --border-active: oklch(0.141 0.005 285.823);

  /* Interactive elements */
  --primary: oklch(0.21 0.006 285.885); /* Near black */
  --primary-foreground: oklch(0.985 0 0); /* White */
}

/* Dark Theme */
.dark {
  --background: oklch(0.141 0.005 285.823); /* True black */
  --foreground: oklch(0.985 0 0); /* Pure white */

  /* Cards - less contrast in dark mode */
  --card: oklch(0.21 0.006 285.885);
  --card-foreground: oklch(0.985 0 0);
  --card-shadow: 0 4px 6px -1px oklch(0 0 0 / 0.3), 0 2px 4px -2px oklch(0 0 0 /
          0.3);

  /* Semantic Colors (adjusted for dark) */
  --destructive: oklch(0.704 0.191 22.216);
  --success: oklch(0.646 0.222 142);
  --warning: oklch(0.828 0.189 84.429);

  /* Text */
  --text-primary: oklch(0.985 0 0);
  --text-secondary: oklch(0.705 0.015 286.067);
  --text-tertiary: oklch(0.552 0.016 285.938);

  /* Borders */
  --border: oklch(1 0 0 / 10%);
  --border-input: oklch(1 0 0 / 15%);
  --border-active: oklch(0.985 0 0);

  /* Interactive */
  --primary: oklch(0.92 0.004 286.32);
  --primary-foreground: oklch(0.21 0.006 285.885);
}

/* Card playfulness (light mode only) */
.card-playful {
  transform: rotate(-0.5deg);
  transition: transform 200ms ease;
}

.card-playful:hover {
  transform: rotate(0deg) scale(1.02);
}

.card-playful:nth-child(even) {
  transform: rotate(0.5deg);
}
```

**Key Design Decisions:**

1. **Light mode is primary** - Clean white background with elevated cards
2. **Dark mode available** - But black background, not white
3. **Cards have depth** - Shadows, subtle rotation for playful feel
4. **Background never changes tonally** - Always stays light or dark based on theme
5. **OKLCH for perceptual uniformity** - Better color consistency across themes

### Typography

```css
/* Font Stack */
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue",
  sans-serif;

/* Font Sizes (Mobile First) */
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem; /* 36px */
--text-5xl: 3rem; /* 48px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Spacing Scale

```css
/* 4px base unit */
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
--space-20: 5rem; /* 80px */
```

### Border Radius

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-full: 9999px;
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.5);

/* Glow effects for accent colors */
--glow-success: 0 0 20px rgba(52, 199, 89, 0.4);
--glow-warning: 0 0 20px rgba(255, 204, 0, 0.4);
--glow-destructive: 0 0 20px rgba(255, 59, 48, 0.4);
```

### Animations

```css
/* Durations */
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 350ms;

/* Easings */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## Landing Page

### Structure

**Hero Section** (Full viewport height)

```
┌─────────────────────────────────────┐
│                                     │
│          [No Punch Cards]           │ ← Logo/Brand
│                                     │
│      Loyalty without the cards      │ ← Tagline
│                                     │
│   Automatic rewards every time      │ ← Subtitle
│        you shop locally             │
│                                     │
│     [Start Earning Rewards]         │ ← CTA Button
│                                     │
│     [I'm a Business Owner]          │ ← Secondary CTA
│                                     │
│            ↓ Scroll               │ ← Visual indicator
└─────────────────────────────────────┘
```

**How It Works** (3 Steps)

```
┌─────────────────────────────────────┐
│                                     │
│         How It Works                │
│                                     │
│   ┌───────┐  ┌───────┐  ┌───────┐ │
│   │   1   │  │   2   │  │   3   │ │
│   │ Link  │→ │ Shop  │→ │ Earn  │ │
│   │ Card  │  │Local  │  │Reward │ │
│   └───────┘  └───────┘  └───────┘ │
│                                     │
│   Link your credit/debit card       │
│   Shop at participating stores      │
│   Get rewarded automatically        │
│                                     │
└─────────────────────────────────────┘
```

**Social Proof** (Minimal stats)

```
┌─────────────────────────────────────┐
│                                     │
│   1,247         324          $47K   │
│  Active Users  Businesses   Earned  │
│                                     │
└─────────────────────────────────────┘
```

**Footer** (Minimal, black background)

```
┌─────────────────────────────────────┐
│                                     │
│  No Punch Cards © 2025              │
│                                     │
│  Privacy • Terms • Contact          │
│                                     │
└─────────────────────────────────────┘
```

### Component Breakdown

**Hero CTA Button**

```jsx
<button
  className="w-full max-w-xs h-14 bg-white text-black rounded-lg 
                   font-semibold text-lg hover:bg-gray-100 
                   transition-all duration-normal active:scale-95"
>
  Start Earning Rewards
</button>
```

**Secondary CTA**

```jsx
<button
  className="w-full max-w-xs h-14 bg-transparent text-white 
                   border-2 border-white rounded-lg font-semibold 
                   text-lg hover:bg-white hover:text-black 
                   transition-all duration-normal"
>
  I'm a Business Owner
</button>
```

**Step Card**

```jsx
<div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
  <div
    className="w-12 h-12 rounded-full bg-white text-black 
                  flex items-center justify-center font-bold text-xl mb-4"
  >
    1
  </div>
  <h3 className="text-xl font-semibold mb-2">Link Your Bank</h3>
  <p className="text-gray-400">Securely connect in seconds</p>
</div>
```

---

## User Flows

### Consumer Journey

**Flow 1: Onboarding (First-Time User)**

```
Landing Page
     ↓
Sign Up (Email)
     ↓
[One field per screen]
     ↓
1. Email Input
   → Validation
     ↓
2. Password Input
   → Strength indicator
     ↓
3. Name Input
     ↓
Welcome Screen
   "Link the card you use most"
     ↓
Plaid Link Modal (Full screen blur)
     ↓
Bank/Institution Selection
     ↓
Login to Bank
     ↓
Select Card/Account
     ↓
Success Screen
   "All set! Start shopping"
     ↓
Dashboard
```

**Flow 2: Daily Usage**

```
Dashboard
     ↓
View Progress Cards
  - Business A: 3/5 visits
  - Business B: 1/10 visits
     ↓
[Tap card to see details]
     ↓
Business Detail Sheet (Bottom drawer)
  - Progress ring
  - Recent transactions
  - Reward description
  - Action: "Find location"
     ↓
[Swipe down to close]
     ↓
Back to Dashboard
```

**Flow 3: Reward Earned**

```
[Push Notification]
"You earned a free coffee at Joe's Cafe!"
     ↓
[Tap notification]
     ↓
Full Screen Celebration
  - Animated confetti
  - Reward details
  - [Claim Reward] CTA
     ↓
[Tap CTA]
     ↓
QR Code Modal
  "Show this to cashier"
     ↓
Business scans code
     ↓
Success screen
  "Reward redeemed!"
```

### Business Owner Journey

**Flow 1: Business Registration**

```
Landing Page
  → "I'm a Business Owner"
     ↓
Sign Up (Email)
     ↓
Business Info (Multistep)
     ↓
1. Business Name
     ↓
2. Category Selection
   (Coffee, Restaurant, Retail, etc.)
     ↓
3. Address Input
   (with autocomplete)
     ↓
4. Logo Upload (Optional)
   "You can add this later"
     ↓
Verification Pending Screen
  "We'll review within 24 hours"
     ↓
Email notification when approved
     ↓
Dashboard
```

**Flow 2: Create Reward Program**

```
Dashboard
  → [+ Create Program] FAB
     ↓
Full Screen Modal
     ↓
1. Program Name
   "5-visit punch card"
     ↓
2. Visit Target
   Slider: 1-20 visits
   Default: 5
     ↓
3. Reward Description
   "What do they earn?"
   Ex: "Free coffee"
     ↓
Review Screen
  Preview card
  [Looks good] / [Edit]
     ↓
[Tap "Looks good"]
     ↓
Success Animation
  "Program created!"
     ↓
Dashboard (shows new program)
```

**Flow 3: View Analytics**

```
Dashboard
  → [Analytics] Tab
     ↓
Cards with key metrics:
  - Total visits this month
  - Rewards redeemed
  - New customers
  - Top customer
     ↓
[Tap card to expand]
     ↓
Full Screen Detail
  - Chart (line/bar)
  - Time period filter
  - Export option
     ↓
[Swipe down to close]
```

**Flow 4: Share Public Page**

```
Business Dashboard
  → "Share Your Page" card visible
     ↓
[Tap "Copy Link"]
     ↓
Link copied to clipboard
  "nopunchcards.com/join/joes-coffee"
     ↓
Success toast
  "Link copied! Share with your customers"
     ↓
[Optional: Social share buttons]
  - Instagram story
  - Facebook post
  - X post
     ↓
Customer sees post on social media
     ↓
[Tap link] → Public Business Page
```

### Viral Growth Journey (Customer from Social Media)

**Flow 1: Discovery via Social Media**

```
[Instagram/Facebook Post]
"Earn free coffee at Joe's! ☕"
Link: nopunchcards.com/join/joes-coffee
     ↓
[Tap link]
     ↓
Public Business Page
  - Joe's Coffee Shop
  - "5-Visit Punch Card"
  - "Sign up once, get loyalty everywhere"
  - 47 customers already earning rewards
     ↓
[Scroll to see programs]
     ↓
Program Cards (visual preview):
  ○○○○○ → 5 visits → Free coffee
     ↓
[Sticky CTA: "Start Earning Rewards"]
     ↓
[Tap CTA]
     ↓
IF not logged in:
  → Signup page (?ref=joes-coffee)
     ↓
1. Email & Password
     ↓
2. Name
     ↓
3. "Link the card you use most"
   → Plaid Link
     ↓
4. Card selection
     ↓
Success Screen
  "You're all set!"
  "Now earning rewards at Joe's Coffee
   and 300+ other businesses"
     ↓
Redirect to Consumer Dashboard
  → Joe's Coffee shows 0/5 progress
     ↓
[Next time they shop at Joe's]
  → Transaction auto-matched
  → Progress: 1/5 visits
  → Push notification

IF already logged in:
  → Auto-enroll in programs
  → Dashboard shows Joe's Coffee
```

---

## Screen Specifications

### 1. Landing Page

**Mobile (375px)**

```
Header: Fixed, transparent until scroll
  - Logo (top left)
  - [Sign In] (top right, ghost button)

Hero Section: Full viewport
  - Logo/Brand centered
  - Headline: text-4xl, font-bold, white
  - Subtitle: text-lg, gray-400, max-w-md
  - CTA: Primary button, mb-4
  - Secondary CTA: Outline button
  - Scroll indicator: Animated arrow

How It Works: py-16
  - Section title: text-3xl, font-bold, mb-8
  - 3 cards stacked vertically (mobile)
  - Each card: bg-gray-900, p-6, rounded-lg

Social Proof: py-12, bg-gray-950
  - 3 stats in grid
  - Large numbers: text-3xl, font-bold
  - Labels: text-sm, gray-500

Footer: py-8, bg-black
  - Minimal links
  - text-sm, gray-600
```

**Desktop (1440px)**

```
Hero Section:
  - Split layout: 50/50
  - Left: Text content
  - Right: Visual/Animation

How It Works:
  - 3 cards horizontal
  - Arrows between cards

Social Proof:
  - Horizontal layout with dividers
```

### 2. Consumer Dashboard

**Mobile Layout (375px)**

```
┌─────────────────────────────────────┐
│ No Punch Cards          [👤] [🔔] 3 │ ← Header (fixed)
├─────────────────────────────────────┤
│                                     │
│ Hey Alex,                           │ ← Greeting
│ You're 2 visits away from           │
│ earning a free coffee! ☕            │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ Active Rewards                      │ ← Section title
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Joe's Coffee Shop               │ │ ← Card (with subtle tilt)
│ │                                 │ │
│ │     ●●●○○                       │ │ ← Progress dots
│ │     3 of 5 visits               │ │
│ │                                 │ │
│ │ Reward: Free medium coffee      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Main Street Deli                │ │
│ │                                 │ │
│ │     ●○○○○○○○○○                  │ │
│ │     1 of 10 visits              │ │
│ │                                 │ │
│ │ Reward: Free sandwich           │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ Recent Activity                     │
│                                     │
│ Today                               │
│ Joe's Coffee Shop      -$4.50       │
│ 10:32 AM               ●●●○○        │
│                                     │
│ Yesterday                           │
│ Main Street Deli       -$12.00      │
│ 12:45 PM               ●○○○○○○○○○   │
│                                     │
└─────────────────────────────────────┘
│ [Dashboard] [Merchants] [Rewards]   │ ← Bottom nav
└─────────────────────────────────────┘
```

**Desktop Layout (1440px)**

```
                    ┌─────────────────────────────────────┐
                    │ No Punch Cards          [👤] [🔔] 3 │
                    ├─────────────────────────────────────┤
                    │                                     │
   ← Whitespace     │ Hey Alex,                           │
                    │ You're 2 visits away from           │
                    │ earning a free coffee! ☕           │
                    │                                     │
                    │ Active Rewards                      │
   Max-width:       │                                     │
   480px centered   │ ┌─────────────────────────────────┐ │
                    │ │ Joe's Coffee Shop               │ │
                    │ │     ●●●○○                      │ │
                    │ │     3 of 5 visits              │ │
                    │ │ Reward: Free medium coffee      │ │
                    │ └─────────────────────────────────┘ │
                    │                                     │
                    │ [Dashboard] [Merchants] [Rewards]   │
                    └─────────────────────────────────────┘
                                                              Whitespace →
```

**Header Navigation:**

- **[👤] Profile Icon**: Opens account menu (Settings, Linked Cards, Sign Out)
- **[🔔] Notifications**: Shows notification count, tap to open notification center
- **No hamburger menu** - Keep it clean, use bottom nav + profile for all navigation

**Interactions**

- Pull to refresh (whole page)
- Tap card → Bottom sheet (mobile) / Centered modal (desktop)
- Swipe card left → Quick actions (Find location, View transactions)
- Tap notification bell → Notification center (full screen)
- Tap profile → Account sheet (Settings, Linked cards, etc.)

### 3. Business Dashboard

**Mobile Layout**

```
┌─────────────────────────────────────┐
│ Joe's Coffee Shop           [⚙️]    │ ← Header (fixed)
├─────────────────────────────────────┤
│                                     │
│ This Month                          │
│                                     │
│ ┌──────────┐ ┌──────────┐ ┌───────┐│
│ │   247    │ │    12    │ │  3.2  ││ ← Metric cards
│ │  Visits  │ │ Rewards  │ │  Avg  ││
│ └──────────┘ └──────────┘ └───────┘│
│                                     │
├─────────────────────────────────────┤
│                                     │
│ Active Programs                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 5-Visit Punch Card              │ │
│ │                                 │ │
│ │ 127 customers enrolled          │ │
│ │ 12 rewards this week            │ │
│ │                                 │ │
│ │ [View Details]                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [+ Create New Program]              │ ← FAB
│                                     │
├─────────────────────────────────────┤
│                                     │
│ Recent Redemptions                  │
│                                     │
│ Alex M.                             │
│ Free medium coffee · 2:15 PM        │
│ 5-Visit Punch Card ✓                │
│                                     │
│ Sarah K.                            │
│ Free medium coffee · 11:30 AM       │
│ 5-Visit Punch Card ✓                │
│                                     │
└─────────────────────────────────────┘
│ [Dashboard] [Programs] [Analytics]  │ ← Bottom nav
└─────────────────────────────────────┘
```

### 4. Multistep Form Example: Create Program

**Step 1: Program Name**

```
┌─────────────────────────────────────┐
│ [X]                          1 of 4 │ ← Progress
├─────────────────────────────────────┤
│                                     │
│                                     │
│ What should we call                 │
│ this program?                       │ ← Question
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 5-Visit Punch Card_             │ │ ← Input
│ └─────────────────────────────────┘ │
│                                     │
│ This is what customers will see     │ ← Helper text
│                                     │
│                                     │
│                                     │
│                                     │
│ [Continue]                          │ ← CTA (bottom)
└─────────────────────────────────────┘
```

**Step 2: Visit Target**

```
┌─────────────────────────────────────┐
│ [←]                          2 of 4 │
├─────────────────────────────────────┤
│                                     │
│ How many visits                     │
│ to earn a reward?                   │
│                                     │
│        ┌───────────────┐            │
│        │      5        │            │ ← Large number
│        │    visits     │            │
│        └───────────────┘            │
│                                     │
│    ◀─────────●─────────▶            │ ← Slider
│    1                  20            │
│                                     │
│ Most businesses choose 5-10         │
│                                     │
│                                     │
│ [Continue]                          │
└─────────────────────────────────────┘
```

**Step 3: Reward Description**

```
┌─────────────────────────────────────┐
│ [←]                          3 of 4 │
├─────────────────────────────────────┤
│                                     │
│ What do customers earn?             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Free medium coffee_             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Common rewards:                     │
│ • Free item                         │
│ • Discount (10% off)                │
│ • Free upgrade                      │
│                                     │
│                                     │
│ [Continue]                          │
└─────────────────────────────────────┘
```

**Step 4: Review**

```
┌─────────────────────────────────────┐
│ [←]                          4 of 4 │
├─────────────────────────────────────┤
│                                     │
│ Does this look right?               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 5-Visit Punch Card              │ │ ← Preview card
│ │                                 │ │
│ │     ○○○○○                      │ │
│ │     0 of 5 visits              │ │
│ │                                 │ │
│ │ Free medium coffee             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ This is how customers will see      │
│ your program.                       │
│                                     │
│ [Edit] [Looks Good]                 │
└─────────────────────────────────────┘
```

**Success State** (after "Looks Good")

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│         ✓                          │ ← Animated checkmark
│                                     │
│    Program Created!                 │
│                                     │
│ Customers can start earning         │
│ rewards right away.                 │
│                                     │
│                                     │
│ [View Dashboard]                    │
│                                     │
└─────────────────────────────────────┘
```

---

## Business Public Page (Viral Growth)

### Overview

**Purpose**: Shareable landing page for businesses to promote on social media and drive customer acquisition.

**URL Format**: `nopunchcards.com/join/{business-slug}`

**Key Features**:

- Public (no auth required)
- SSR for social media previews (Open Graph)
- Mobile-first, constrained 480px desktop
- Prominent "Sign up once, get loyalty everywhere" messaging
- Social proof (customer count, rewards earned)
- Sticky CTA for conversion

### Screen Layout

**Mobile (375px)**

```
┌─────────────────────────────────────┐
│ ← Back                   [Share] ⤴ │ ← Header
├─────────────────────────────────────┤
│                                     │
│        ┌──────────┐                 │
│        │   LOGO   │                 │ ← Business logo
│        └──────────┘                 │
│                                     │
│     Joe's Coffee Shop               │ ← Business name (h1)
│                                     │
│ ☕ Coffee · 123 Main St             │ ← Category + Address
│                                     │
├─────────────────────────────────────┤
│                                     │
│ Sign up once,                       │ ← Value prop
│ get loyalty everywhere              │   (prominent)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  47 customers    12 rewards     │ │ ← Social proof
│ │   earning here   this week      │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ Earn free coffee with every         │ ← Description
│ 5 visits. Plus rewards at 300+      │   (optional)
│ other local businesses.             │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ Rewards at Joe's Coffee             │ ← Section title
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 5-Visit Punch Card              │ │ ← Program card
│ │                                 │ │
│ │     ○ ○ ○ ○ ○                  │ │ ← Visual dots
│ │                                 │ │
│ │ Visit 5 times, earn:            │ │
│ │ Free medium coffee              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 10-Visit VIP Card               │ │
│ │                                 │ │
│ │     ○ ○ ○ ○ ○ ○ ○ ○ ○ ○        │ │
│ │                                 │ │
│ │ Visit 10 times, earn:           │ │
│ │ Free large coffee + pastry      │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ How it works                        │ ← How it works
│                                     │   (3 steps)
│ 1️⃣ Link your card (one time)       │
│ 2️⃣ Shop like normal                 │
│ 3️⃣ Earn rewards automatically       │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ Plus loyalty at 300+ businesses     │ ← Platform benefit
│                                     │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│ │Cafe │ │Deli │ │Gym  │ │More │   │ ← Example icons
│ └─────┘ └─────┘ └─────┘ └─────┘   │
│                                     │
│ One account, all your local         │
│ loyalty rewards in one place.       │
│                                     │
│                                     │
│                                     │
│ [Scroll padding for sticky CTA]     │
│                                     │
└─────────────────────────────────────┘
│  [Start Earning Rewards] →          │ ← Sticky CTA
└─────────────────────────────────────┘  (fixed bottom)
```

**Desktop Layout (1440px)**

```
                    ┌─────────────────────────────────────┐
                    │ ← Back                   [Share] ⤴ │
                    ├─────────────────────────────────────┤
                    │                                     │
   ← Whitespace     │        ┌──────────┐                 │
                    │        │   LOGO   │                 │
                    │        └──────────┘                 │
                    │                                     │
   Max-width:       │     Joe's Coffee Shop               │
   480px centered   │                                     │
                    │ ☕ Coffee · 123 Main St             │
                    │                                     │
                    │ Sign up once,                       │
                    │ get loyalty everywhere              │
                    │                                     │
                    │ ┌─────────────────────────────────┐ │
                    │ │  47 customers    12 rewards     │ │
                    │ │   earning here   this week      │ │
                    │ └─────────────────────────────────┘ │
                    │                                     │
                    │ [Rewards programs...]               │
                    │                                     │
                    │ [Start Earning Rewards] →           │
                    └─────────────────────────────────────┘
                                                              Whitespace →
```

### Copy Guidelines

**Primary Message**: "Sign up once, get loyalty everywhere"

**Supporting Copy**:

- "One account, all your local rewards"
- "Automatic rewards at 300+ businesses"
- "No punch cards, no apps, just shop"
- "Link your card once, earn everywhere"

**Social Proof**:

- "{X} customers earning here"
- "{Y} rewards earned this week"
- "Join {X} others"

**CTA Variations**:

- Primary: "Start Earning Rewards"
- Alternative: "Join Now"
- If logged in: "Start Earning Here"

### Component Breakdown

**Hero Section**

```jsx
<div className="text-center py-8">
  {/* Logo */}
  {business.logoUrl && (
    <img
      src={business.logoUrl}
      alt={business.name}
      className="w-24 h-24 mx-auto rounded-full border-4 border-white shadow-lg mb-4"
    />
  )}

  {/* Business name */}
  <h1 className="text-3xl font-bold mb-2">{business.name}</h1>

  {/* Category + Location */}
  <p className="text-gray-400 flex items-center justify-center gap-2">
    <span>{business.category}</span>
    <span>·</span>
    <span>{business.address}</span>
  </p>
</div>
```

**Value Prop Banner**

```jsx
<div className="bg-linear-to-r from-gray-900 to-gray-800 rounded-lg p-6 text-center mb-6">
  <h2 className="text-2xl font-bold mb-2">Sign up once,</h2>
  <p className="text-xl text-gray-300">get loyalty everywhere</p>
</div>
```

**Social Proof Stats**

```jsx
<div className="grid grid-cols-2 gap-4 mb-8">
  <div className="bg-gray-900 rounded-lg p-4 text-center">
    <div className="text-3xl font-bold">{stats.totalCustomers}</div>
    <div className="text-sm text-gray-400">customers earning here</div>
  </div>
  <div className="bg-gray-900 rounded-lg p-4 text-center">
    <div className="text-3xl font-bold">{stats.totalRewards}</div>
    <div className="text-sm text-gray-400">rewards this week</div>
  </div>
</div>
```

**Program Card (Public View)**

```jsx
<div
  className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-4
                hover:border-gray-700 transition-colors"
>
  <h3 className="text-xl font-semibold mb-4">{program.name}</h3>

  {/* Visual progress dots */}
  <div className="flex gap-2 mb-4 justify-center">
    {Array.from({ length: program.rules.visits }).map((_, i) => (
      <div key={i} className="w-4 h-4 rounded-full bg-gray-700" />
    ))}
  </div>

  {/* Reward description */}
  <div className="bg-gray-950 rounded-lg p-4 text-center">
    <p className="text-sm text-gray-400 mb-1">
      Visit {program.rules.visits} times, earn:
    </p>
    <p className="text-lg font-semibold">{program.rules.reward}</p>
  </div>
</div>
```

**Sticky CTA (Bottom)**

```jsx
<div
  className="fixed bottom-0 left-0 right-0 p-4 bg-linear-to-t 
                from-black via-black/95 to-transparent 
                md:max-w-[480px] md:mx-auto"
>
  <button
    onClick={handleStartEarning}
    className="w-full h-14 bg-white text-black rounded-lg 
                     font-semibold text-lg hover:bg-gray-100 
                     active:scale-95 transition-all shadow-xl 
                     flex items-center justify-center gap-2"
  >
    Start Earning Rewards
    <span>→</span>
  </button>
</div>
```

**Share Button (Header)**

```jsx
<button
  onClick={copyLinkToClipboard}
  className="flex items-center gap-2 px-4 py-2 bg-gray-800 
                rounded-lg text-sm font-medium hover:bg-gray-700 
                transition-colors"
>
  <span>Share</span>
  <span>⤴</span>
</button>;

{
  /* Success toast after copy */
}
```

### Business Dashboard Integration

**Share Your Page Card** (added to business dashboard)

```jsx
<div
  className="bg-linear-to-br from-gray-900 to-gray-800 
                rounded-lg p-6 border border-gray-700 mb-6"
>
  <div className="flex items-start justify-between mb-4">
    <div>
      <h3 className="text-lg font-semibold mb-1">Share Your Page</h3>
      <p className="text-sm text-gray-400">
        Promote your rewards on social media
      </p>
    </div>
    <span className="text-2xl">📢</span>
  </div>

  {/* Copyable link */}
  <div className="bg-gray-950 rounded-lg p-3 flex items-center gap-3 mb-4">
    <code className="flex-1 text-sm text-gray-300 truncate">
      nopunchcards.com/join/{business.slug}
    </code>
    <button
      onClick={copyLink}
      className="px-3 py-1 bg-white text-black rounded font-medium 
                       text-sm hover:bg-gray-100 transition-colors shrink-0"
    >
      Copy
    </button>
  </div>

  {/* Social share buttons */}
  <div className="flex gap-2">
    <button className="flex-1 py-2 bg-gray-800 rounded text-sm">
      📷 Instagram
    </button>
    <button className="flex-1 py-2 bg-gray-800 rounded text-sm">
      📘 Facebook
    </button>
    <button className="flex-1 py-2 bg-gray-800 rounded text-sm">🐦 X</button>
  </div>
</div>
```

### SEO & Social Media Optimization

**Open Graph Meta Tags** (for social previews)

```tsx
// In /join/[slug].tsx route
export const meta = ({ data }: { data: BusinessData }) => {
  return [
    { title: `Earn rewards at ${data.business.name} | No Punch Cards` },
    {
      name: "description",
      content: `Sign up once, get loyalty everywhere. Start earning at ${data.business.name} and 300+ other local businesses.`,
    },
    { property: "og:title", content: `Earn rewards at ${data.business.name}` },
    {
      property: "og:description",
      content: "One account for all your local loyalty rewards.",
    },
    {
      property: "og:image",
      content: data.business.logoUrl || "/og-default-image.png",
    },
    {
      property: "og:url",
      content: `https://nopunchcards.com/join/${data.business.slug}`,
    },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ];
};
```

### Interactions & States

**Not Authenticated**:

- CTA → Redirect to `/signup?ref={slug}`
- Preserve context through signup flow
- After signup, auto-enroll in programs
- Show success: "Now earning at {business}"

**Already Authenticated**:

- CTA → Auto-enroll (mutation)
- Show progress if already enrolled
- Redirect to dashboard with toast

**Invalid/Unverified Business**:

- Show 404 page
- "This business page doesn't exist"
- CTA to explore other businesses

**Loading State**:

- Skeleton loaders for cards
- Logo placeholder
- Prevent layout shift

---

## Component Library

### 1. Cards

**Progress Card (Consumer)**

```jsx
<div
  className="bg-gray-900 rounded-lg p-6 border border-gray-800 
                active:bg-gray-800 transition-colors"
>
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold">Joe's Coffee Shop</h3>
    <span className="text-sm text-gray-400">2.4 mi</span>
  </div>

  {/* Progress Dots */}
  <div className="flex gap-2 mb-3">
    <div className="w-3 h-3 rounded-full bg-white" />
    <div className="w-3 h-3 rounded-full bg-white" />
    <div className="w-3 h-3 rounded-full bg-white" />
    <div className="w-3 h-3 rounded-full bg-gray-700" />
    <div className="w-3 h-3 rounded-full bg-gray-700" />
  </div>

  <p className="text-sm text-gray-400 mb-4">3 of 5 visits</p>

  <div className="bg-gray-950 rounded-lg p-3">
    <p className="text-sm font-medium">Reward: Free medium coffee</p>
  </div>
</div>
```

**Program Card (Business)**

```jsx
<div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold">5-Visit Punch Card</h3>
    <span
      className="px-2 py-1 bg-success/20 text-success text-xs 
                   font-medium rounded-full"
    >
      Active
    </span>
  </div>

  <div className="space-y-2 mb-4">
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">Enrolled</span>
      <span className="font-medium">127 customers</span>
    </div>
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">This week</span>
      <span className="font-medium">12 rewards</span>
    </div>
  </div>

  <button
    className="w-full py-2 bg-gray-800 rounded-lg text-sm 
                     font-medium hover:bg-gray-700 transition-colors"
  >
    View Details
  </button>
</div>
```

### 2. Buttons

**Primary Button**

```jsx
<button
  className="w-full h-12 bg-white text-black rounded-lg 
                   font-semibold hover:bg-gray-100 
                   active:scale-95 transition-all"
>
  Continue
</button>
```

**Secondary Button**

```jsx
<button
  className="w-full h-12 bg-gray-800 text-white rounded-lg 
                   font-semibold hover:bg-gray-700 
                   active:scale-95 transition-all"
>
  View Details
</button>
```

**Destructive Button**

```jsx
<button
  className="w-full h-12 bg-destructive text-white rounded-lg 
                   font-semibold hover:bg-destructive-hover 
                   active:scale-95 transition-all shadow-md 
                   hover:shadow-lg hover:shadow-destructive/50"
>
  Delete Program
</button>
```

**Ghost Button**

```jsx
<button
  className="w-full h-12 bg-transparent text-white rounded-lg 
                   font-semibold border-2 border-gray-700 
                   hover:border-white hover:bg-white hover:text-black 
                   transition-all"
>
  Cancel
</button>
```

### 3. Input Fields

**Text Input**

```jsx
<div className="space-y-2">
  <label className="text-sm font-medium text-gray-400">Email</label>
  <input
    type="email"
    className="w-full h-12 bg-gray-900 border border-gray-800 
               rounded-lg px-4 text-white placeholder:text-gray-600
               focus:border-white focus:outline-none 
               transition-colors"
    placeholder="you@example.com"
  />
</div>
```

**Input with Validation**

```jsx
<div className="space-y-2">
  <label className="text-sm font-medium text-gray-400">Password</label>
  <input
    type="password"
    className="w-full h-12 bg-gray-900 border-2 border-success
               rounded-lg px-4 text-white placeholder:text-gray-600
               focus:outline-none transition-colors"
    placeholder="••••••••"
  />
  <p className="text-xs text-success flex items-center gap-1">
    <span>✓</span> Strong password
  </p>
</div>
```

**Input with Error**

```jsx
<div className="space-y-2">
  <label className="text-sm font-medium text-gray-400">Email</label>
  <input
    type="email"
    className="w-full h-12 bg-gray-900 border-2 border-destructive
               rounded-lg px-4 text-white placeholder:text-gray-600
               focus:outline-none transition-colors"
    placeholder="you@example.com"
  />
  <p className="text-xs text-destructive">Please enter a valid email</p>
</div>
```

### 4. Modals

**Full Screen Blur Modal**

```jsx
<div
  className="fixed inset-0 z-50 flex items-center justify-center 
                px-6 backdrop-blur-xl bg-black/60 
                animate-in fade-in duration-200"
>
  <div
    className="w-full max-w-md bg-gray-950 rounded-xl border 
                  border-gray-800 p-6 animate-in zoom-in-95 
                  duration-200 shadow-xl"
  >
    {/* Close button */}
    <button
      className="absolute top-4 right-4 w-8 h-8 
                       rounded-full bg-gray-800 flex items-center 
                       justify-center hover:bg-gray-700 
                       transition-colors"
    >
      ✕
    </button>

    {/* Modal content */}
    <h2 className="text-2xl font-bold mb-4">Modal Title</h2>
    <p className="text-gray-400 mb-6">Modal content goes here.</p>

    <button
      className="w-full h-12 bg-white text-black rounded-lg 
                       font-semibold"
    >
      Confirm
    </button>
  </div>
</div>
```

**Responsive Sheet/Modal Component**

On mobile (<768px): Displays as bottom sheet  
On desktop (≥768px): Displays as centered modal OR side panel

**Approach 1: Bottom Sheet → Centered Modal (Recommended for detail views)**

```jsx
<div
  className="fixed inset-0 z-50 flex items-end md:items-center 
                md:justify-center backdrop-blur-sm bg-black/40 
                animate-in fade-in duration-200"
>
  <div
    className="w-full md:w-auto md:min-w-[480px] md:max-w-2xl 
                  bg-gray-950 rounded-t-xl md:rounded-xl border-t 
                  md:border border-gray-800 p-6 
                  animate-in slide-in-from-bottom md:zoom-in-95 
                  duration-300 max-h-[85vh] md:max-h-[80vh] 
                  overflow-y-auto"
  >
    {/* Drag handle (mobile only) */}
    <div
      className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-6 
                    md:hidden"
    />

    {/* Close button (desktop) */}
    <button
      className="hidden md:flex absolute top-4 right-4 w-8 h-8 
                       rounded-full bg-gray-800 items-center 
                       justify-center hover:bg-gray-700 
                       transition-colors"
    >
      ✕
    </button>

    {/* Content */}
    <h2 className="text-2xl font-bold mb-4">Joe's Coffee Shop</h2>
    <p className="text-gray-400 mb-6">Sheet/modal content</p>
  </div>
</div>
```

**Approach 2: Bottom Sheet → Side Panel (Alternative for dashboards)**

```jsx
<div
  className="fixed inset-0 z-50 flex items-end md:items-stretch 
                md:justify-end backdrop-blur-sm bg-black/40 
                animate-in fade-in duration-200"
>
  <div
    className="w-full md:w-96 md:h-full bg-gray-950 
                  rounded-t-xl md:rounded-l-xl md:rounded-r-none 
                  border-t md:border-l md:border-t-0 border-gray-800 
                  p-6 animate-in slide-in-from-bottom 
                  md:slide-in-from-right duration-300 
                  max-h-[85vh] md:max-h-full overflow-y-auto"
  >
    {/* Drag handle (mobile only) */}
    <div
      className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-6 
                    md:hidden"
    />

    {/* Header with close */}
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold">Details</h2>
      <button
        className="w-8 h-8 rounded-full bg-gray-800 
                         flex items-center justify-center 
                         hover:bg-gray-700 transition-colors"
      >
        ✕
      </button>
    </div>

    {/* Content */}
    <p className="text-gray-400">Side panel content</p>
  </div>
</div>
```

**Usage Guidelines:**

- **Centered Modal**: Use for detail views, confirmations, forms
- **Side Panel**: Use for filtering, settings, extended info that supplements main view
- Always provide both tap-to-close (backdrop) and explicit close button on desktop
- Maintain same content/functionality, just different presentation

### 5. Progress Indicators

**Circular Progress (Reward Progress)**

```jsx
<div className="relative w-32 h-32">
  {/* Background circle */}
  <svg className="transform -rotate-90" viewBox="0 0 100 100">
    <circle
      cx="50" cy="50" r="40"
      fill="none"
      stroke="currentColor"
      strokeWidth="8"
      className="text-gray-800"
    />
    {/* Progress circle */}
    <circle
      cx="50" cy="50" r="40"
      fill="none"
      stroke="currentColor"
      strokeWidth="8"
      strokeDasharray="251.2" {/* 2 * π * r */}
      strokeDashoffset="150.72" {/* 60% progress */}
      strokeLinecap="round"
      className="text-white transition-all duration-500"
    />
  </svg>

  {/* Center text */}
  <div className="absolute inset-0 flex flex-col items-center
                  justify-center">
    <span className="text-2xl font-bold">3</span>
    <span className="text-xs text-gray-400">of 5</span>
  </div>
</div>
```

**Linear Progress (Multistep Forms)**

```jsx
<div className="flex items-center gap-2">
  {[1, 2, 3, 4].map((step, idx) => (
    <div
      key={step}
      className={`h-1 flex-1 rounded-full transition-colors ${
        idx < 2 ? 'bg-white' : 'bg-gray-700'
      }`}
    />
  ))}
</div>
<p className="text-xs text-gray-400 mt-2">Step 2 of 4</p>
```

### 6. Notifications

**Toast Notification**

```jsx
<div
  className="fixed top-4 right-4 max-w-sm bg-gray-950 border 
                border-gray-800 rounded-lg p-4 shadow-xl 
                animate-in slide-in-from-top duration-300"
>
  <div className="flex items-start gap-3">
    <div
      className="w-8 h-8 rounded-full bg-success/20 
                    flex items-center justify-center shrink-0"
    >
      <span className="text-success">✓</span>
    </div>
    <div className="flex-1">
      <h4 className="font-semibold mb-1">Reward Earned!</h4>
      <p className="text-sm text-gray-400">You earned a free coffee at Joe's</p>
    </div>
    <button className="text-gray-400 hover:text-white">✕</button>
  </div>
</div>
```

**Error Toast**

```jsx
<div
  className="fixed top-4 right-4 max-w-sm bg-gray-950 border-2 
                border-destructive rounded-lg p-4 shadow-xl 
                shadow-destructive/20 animate-in slide-in-from-top 
                duration-300"
>
  <div className="flex items-start gap-3">
    <div
      className="w-8 h-8 rounded-full bg-destructive/20 
                    flex items-center justify-center shrink-0"
    >
      <span className="text-destructive">!</span>
    </div>
    <div className="flex-1">
      <h4 className="font-semibold mb-1">Something went wrong</h4>
      <p className="text-sm text-gray-400">Please try again</p>
    </div>
    <button className="text-gray-400 hover:text-white">✕</button>
  </div>
</div>
```

---

## Selective SSR Configuration (Hybrid Rendering)

### TanStack Start Selective SSR

**Architecture Decision**: Use [Selective SSR](https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr) instead of pure SPA mode for optimal performance and SEO.

**Route Rendering Strategy:**

```
┌─────────────────────────────────────────────────────┐
│ SSR Enabled (ssr: true)                             │
│ • Landing page (/)                                  │
│ • Public business pages (/join/[slug])              │
│ • 404/error pages                                   │
│                                                     │
│ Benefits:                                           │
│ ✓ SEO optimization                                  │
│ ✓ Social media preview cards (Open Graph)          │
│ ✓ Instant content visibility                        │
│ ✓ Better first paint performance                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ SSR Disabled (ssr: false)                           │
│ • Signup/login flows                                │
│ • Consumer dashboard                                │
│ • Business dashboard                                │
│ • All authenticated routes                          │
│                                                     │
│ Benefits:                                           │
│ ✓ SPA-like instant navigation                       │
│ ✓ Perfect for PWA                                   │
│ ✓ No hydration issues                               │
│ ✓ Better for complex interactive UIs                │
└─────────────────────────────────────────────────────┘
```

**Implementation:**

```typescript
// src/routes/__root.tsx
import { createRootRoute, Outlet, Scripts } from "@tanstack/react-router";

export const Route = createRootRoute({
  // Default ssr: true (inherited by children)
  component: RootComponent,
});

function RootComponent() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
```

```typescript
// src/routes/index.tsx - Landing page
export const Route = createFileRoute("/")({
  // Inherits ssr: true from root
  component: LandingPage,
});
```

```typescript
// src/routes/join/$slug.tsx - Public business page
export const Route = createFileRoute("/join/$slug")({
  // Inherits ssr: true for Open Graph previews
  loader: async ({ params }) => {
    // Fetch business data server-side
    return await getBusinessData(params.slug);
  },
  meta: ({ loaderData }) => [
    { property: "og:title", content: `${loaderData.business.name}` },
    { property: "og:image", content: loaderData.business.logoUrl },
  ],
  component: PublicBusinessPage,
});
```

```typescript
// src/routes/(authenticated)/_layout.tsx - App shell
export const Route = createFileRoute("/(authenticated)/_layout")({
  // Disable SSR for all app routes
  ssr: false,
  beforeLoad: async () => {
    // Runs client-side only
    await requireAuth();
  },
  component: AuthenticatedLayout,
});
```

**Benefits of Selective SSR (vs Pure SPA):**

1. **Best of Both Worlds**

   - Marketing pages: SSR for SEO & social sharing
   - App routes: Client-only for SPA experience
   - No compromise needed

2. **Social Media Sharing**

   - `/join/[slug]` pages render server-side
   - Instagram/Facebook show proper preview cards
   - Critical for viral growth strategy

3. **PWA Compatibility**

   - PWA works perfectly with `ssr: false` routes
   - Service worker caches client-side app
   - Offline support for authenticated routes

4. **Performance Optimization**
   - Landing page: Fast first paint with SSR
   - App routes: Instant navigation after login
   - Progressive enhancement

**Why NOT Pure SPA Mode:**

According to [TanStack Start docs](https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr#how-does-this-compare-to-spa-mode):

- Pure SPA mode disables ALL SSR globally
- Loses SEO benefits on landing page
- No Open Graph previews for `/join/[slug]` pages
- Selective SSR provides per-route control

**Route Inheritance:**

From the [TanStack docs](https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr#inheritance), child routes inherit parent SSR config but can only become MORE restrictive:

```
root { ssr: true }
├── index { ssr: true } ← Inherits, keeps SSR
├── join/[slug] { ssr: true } ← Inherits, keeps SSR
└── (authenticated) { ssr: false } ← Disables SSR
    ├── consumer/dashboard ← Inherits ssr: false
    └── business/dashboard ← Inherits ssr: false
```

**PWA Manifest (works with Selective SSR):**

```json
{
  "name": "No Punch Cards",
  "short_name": "NoPunchCards",
  "start_url": "/app",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
```

**PWA Entry Point Strategy:**

The `start_url` points to `/app`, which is a smart redirect route that:

1. **Checks authentication** (client-side, `ssr: false`)
2. **If logged in**: Redirects to appropriate dashboard based on role
   - Business owner → `/business/dashboard`
   - Consumer → `/consumer/dashboard`
3. **If not logged in**: Redirects to `/login`

This ensures:

- ✅ PWA never shows the landing page (landing is for discovery, not installed apps)
- ✅ Instant app experience (client-side redirect, no SSR)
- ✅ Smart routing based on user context
- ✅ Users land exactly where they want to be

---

## Desktop Layout Implementation

### Root Layout Component

```tsx
// src/routes/__root.tsx or layout wrapper

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Constrained app container */}
      <div className="max-w-[480px] mx-auto px-4">{children}</div>
    </div>
  );
}
```

### Landing Page (Full Width)

```tsx
// src/routes/index.tsx - Landing page gets full width

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero - full width with max constraint */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12">
          <div>{/* Hero content */}</div>
          <div>{/* Hero visual */}</div>
        </div>
      </section>

      {/* How it works - constrained */}
      <section className="max-w-4xl mx-auto px-6">{/* 3 step cards */}</section>
    </div>
  );
}
```

### App Routes (Constrained)

```tsx
// src/routes/app/dashboard.tsx - App routes constrained

function ConsumerDashboard() {
  return (
    // Wrapper automatically constrains to 480px
    <div className="space-y-6 pb-20">
      {/* Greeting */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Hey Alex,</h1>
        <p className="text-muted-foreground">
          You're 2 visits away from earning a free coffee! ☕
        </p>
      </div>

      {/* Cards - full width within constraint */}
      <div className="space-y-4">
        <ProgressCard />
        <ProgressCard />
      </div>
    </div>
  );
}
```

### Benefits

1. **Looks native on all devices**
   - Mobile: Full width (375px - 768px)
   - Desktop: Centered phone-width (480px max)
2. **No "stretched" feeling**
   - Desktop users see a phone-like experience
   - Generous whitespace on sides
3. **Consistent experience**

   - Same UI, same interactions
   - Just centered on larger screens

4. **Exception for marketing**
   - Landing page can use full width
   - Split layouts, wide hero sections
   - Then funnels into constrained app

---

## Implementation Checklist

### Design Tokens

- [ ] Update `src/styles.css` with color tokens
- [ ] Add typography scale
- [ ] Define spacing scale
- [ ] Add animation tokens

### Components

- [ ] Create `<ProgressCard />` component
- [ ] Create `<ProgramCard />` component
- [ ] Create `<FullScreenModal />` component
- [ ] Create `<BottomSheet />` component
- [ ] Create `<Toast />` notification system
- [ ] Create `<CircularProgress />` component
- [ ] Create `<MultistepForm />` wrapper
- [ ] Create `<ShareYourPageCard />` for business dashboard
- [ ] Create `<PublicProgramCard />` for public pages
- [ ] Create `<StickyPrimaryCTA />` component

### Pages

- [ ] Build landing page
- [ ] Consumer dashboard
- [ ] Business dashboard
- [ ] Onboarding flows (consumer & business)
- [ ] Create program flow
- [ ] Reward detail screen
- [ ] **Business public page** (`/join/[slug]`)
- [ ] Context-aware signup flow with ref param
- [ ] 404 page for invalid business slugs

### Interactions

- [ ] Add pull-to-refresh
- [ ] Implement swipe gestures
- [ ] Bottom sheet animations
- [ ] Modal transitions
- [ ] Success animations (confetti, checkmark)
- [ ] Copy-to-clipboard with success feedback
- [ ] Share button functionality (native share API)

### Mobile Optimizations

- [ ] Touch target sizes (min 44x44px)
- [ ] Bottom navigation
- [ ] Safe area insets (iPhone notch)
- [ ] Viewport meta tag
- [ ] Prevent zoom on input focus

### Public Pages & Viral Growth

- [ ] SSR configuration for `/join/[slug]` route
- [ ] Open Graph meta tags for social previews
- [ ] Default OG image for businesses without logos
- [ ] Slug generation helper (business registration)
- [ ] Slug uniqueness validation
- [ ] Referral context preservation through signup
- [ ] Auto-enrollment after context-aware signup
- [ ] Business slug customization (settings page)
- [ ] QR code generation for in-store promotion
- [ ] Social share button integrations (Instagram, Facebook, X)

---

_Last updated: 2025-11-08T22:30:00Z_
