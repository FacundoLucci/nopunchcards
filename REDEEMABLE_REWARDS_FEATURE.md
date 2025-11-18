# Redeemable Rewards on Cards Page

**Created:** 2025-11-18  
**Status:** Implemented

## Summary

Added a redeemable rewards section to the consumer cards page that displays rewards that have been earned and are ready to redeem. This provides quick access to available rewards directly from the cards view.

## Implementation Details

### Changes Made

1. **Cards Page Updates** (`src/routes/_authenticated/consumer/cards.tsx`)
   - Added `RedeemableRewardsSection` component
   - Integrated with existing `getPendingRewardClaims` Convex query
   - Shows up to 3 most recent redeemable rewards
   - Displays a "View All" button linking to `/consumer/rewards`

### UI Components

- **Reward Cards:**
  - Gift icon in a circular badge
  - Business name and reward description
  - Time since reward was earned (e.g., "Earned 2 days ago")
  - "Redeem" button for quick access

- **View All Button:**
  - Located in the section header
  - Links to the full rewards page at `/consumer/rewards`
  - Only visible when there are redeemable rewards

### User Flow

1. User navigates to the Cards tab in the consumer app
2. If they have redeemable rewards, a "Redeemable Rewards" section appears below their cards
3. Clicking on a reward navigates to `/consumer/rewards/$claimId/claim`
4. The claim page displays:
   - QR code for easy scanning by merchants
   - Alphanumeric reward code
   - Copy button for the code
   - Reward details (business, description, earned date)

### Data Flow

```
Cards Page -> getPendingRewardClaims query -> Display up to 3 rewards
Click reward -> Navigate to claim page -> getRewardClaim query -> Show QR/code
```

## Backend Queries Used

- `api.consumer.queries.getPendingRewardClaims`: Fetches all pending (unredeemed) reward claims
- `api.consumer.queries.getRewardClaim`: Fetches specific claim details including QR payload

## Testing

To test this feature:

1. Ensure you have consumer profile with linked cards
2. Complete a reward program (earn required visits/spend)
3. Navigate to Cards tab
4. Verify the "Redeemable Rewards" section appears
5. Click on a reward to view QR code and redemption code
6. Test the "View All" button navigation

## Future Enhancements

- Add pull-to-refresh for reward status updates
- Show notification badge count on Cards tab when new rewards available
- Add animations when new rewards appear
- Support for expired rewards display
