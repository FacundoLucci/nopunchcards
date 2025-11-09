import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Calculate haversine distance between two lat/lng points in kilometers
 */
function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Map common Plaid categories to business categories
 */
function categoriesMatch(
  transactionCategories: string[] | undefined,
  businessCategory: string
): boolean {
  if (!transactionCategories || transactionCategories.length === 0) {
    return false;
  }

  const txCategories = transactionCategories.map((c) => c.toLowerCase());
  const bizCategory = businessCategory.toLowerCase();

  // Category mapping
  const categoryMap: Record<string, string[]> = {
    coffee: ["food and drink", "coffee", "cafe", "restaurants"],
    restaurant: ["food and drink", "restaurants", "fast food"],
    retail: ["shops", "retail", "clothing", "electronics"],
    grocery: ["shops", "food and drink", "groceries", "supermarkets"],
    fitness: ["recreation", "gyms and fitness", "sports"],
    salon: ["shops", "beauty", "personal care"],
  };

  const matchCategories = categoryMap[bizCategory] || [bizCategory];

  return txCategories.some((txCat) =>
    matchCategories.some((match) => txCat.includes(match))
  );
}

export const matchTransaction = internalMutation({
  args: { transactionId: v.id("transactions") },
  returns: v.union(v.id("businesses"), v.null()),
  handler: async (ctx, args) => {
    // 1. Get transaction by _id from transactions table
    const tx = await ctx.db.get(args.transactionId);
    if (!tx) {
      throw new Error(`Transaction not found: ${args.transactionId}`);
    }

    // 2. If already matched, return existing businessId (idempotency)
    if (tx.businessId) {
      return tx.businessId;
    }

    // 3. If no merchant name from Plaid, cannot match
    if (!tx.merchantName) {
      return null;
    }

    // 4. Get all verified businesses from businesses table (status="verified")
    const businesses = await ctx.db
      .query("businesses")
      .withIndex("by_status", (q) => q.eq("status", "verified"))
      .collect();

    // 5. Score each business using multiple signals (multi-signal matching)
    const scores = businesses.map((business) => {
      let score = 0;
      const txName = tx.merchantName!.toLowerCase().trim();
      const bizName = business.name.toLowerCase().trim();

      // SIGNAL 1: Statement Descriptor Match (60-70 points)
      // This is a strong signal but NOT unique, so not sufficient alone
      if (
        business.statementDescriptors &&
        business.statementDescriptors.length > 0
      ) {
        const txNameUpper = txName.toUpperCase();
        for (const descriptor of business.statementDescriptors) {
          if (txNameUpper === descriptor) {
            score += 70; // Exact match
            break;
          } else if (
            txNameUpper.includes(descriptor) ||
            descriptor.includes(txNameUpper)
          ) {
            score += 60; // Partial match
            break;
          }
        }
      }

      // SIGNAL 2: Business Name Match (40-100 points)
      // Lower weight if we already have descriptor match
      const nameWeight = score > 0 ? 0.5 : 1.0; // Reduce weight if descriptor matched

      if (txName === bizName) {
        score += 100 * nameWeight; // Exact name match
      } else if (txName.includes(bizName)) {
        score += 50 * nameWeight; // Business name in merchant name
      } else if (bizName.includes(txName)) {
        score += 40 * nameWeight; // Merchant name in business name
      } else {
        // Partial word match
        const txWords = txName.split(/\s+/);
        const bizWords = bizName.split(/\s+/);
        const commonWords = txWords.filter(
          (w) => bizWords.includes(w) && w.length > 3
        );
        if (commonWords.length > 0) {
          score += 20 * nameWeight * commonWords.length;
        }
      }

      // SIGNAL 3: Category Match (20 points)
      if (categoriesMatch(tx.category, business.category)) {
        score += 20;
      }

      // SIGNAL 4: Location Proximity (0-30 points, distance-weighted)
      // Within 1km = 30 points, 1-5km = 15 points, 5-10km = 5 points
      const txLocation = (tx as any).location;
      if (txLocation && business.location) {
        const distanceKm = calculateHaversineDistance(
          txLocation.lat,
          txLocation.lng,
          business.location.lat,
          business.location.lng
        );

        if (distanceKm < 1) {
          score += 30;
        } else if (distanceKm < 5) {
          score += 15;
        } else if (distanceKm < 10) {
          score += 5;
        }
      }

      return { business, score, signals: score };
    });

    // 6. Sort by score descending to get best match first
    scores.sort((a, b) => b.score - a.score);

    // 7. Multi-signal confidence threshold
    // Require score >= 90 to ensure multiple signals converged
    // This prevents false positives from single weak signals
    const bestMatch = scores[0];
    const CONFIDENCE_THRESHOLD = 90;

    if (bestMatch && bestMatch.score >= CONFIDENCE_THRESHOLD) {
      console.log(
        `✓ Matched tx ${tx.plaidTransactionId} to business "${bestMatch.business.name}" ` +
          `(score: ${bestMatch.score}, merchant: "${tx.merchantName}")`
      );
      return bestMatch.business._id;
    }

    // 8. No confident match found - remains unmatched
    // Log for debugging and potential manual review
    if (bestMatch && bestMatch.score >= 70) {
      console.log(
        `⚠ Low-confidence match for tx ${tx.plaidTransactionId}: ` +
          `"${bestMatch.business.name}" (score: ${bestMatch.score}/${CONFIDENCE_THRESHOLD}, merchant: "${tx.merchantName}") - needs review`
      );
    } else {
      console.log(
        `✗ No match for tx ${tx.plaidTransactionId} ` +
          `(merchant: "${tx.merchantName}", best score: ${
            bestMatch?.score || 0
          })`
      );
    }
    return null;
  },
});
