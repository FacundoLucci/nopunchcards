import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

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

    // 5. Score each business using multiple heuristics
    const scores = businesses.map((business) => {
      let score = 0;
      const txName = tx.merchantName!.toLowerCase().trim();
      const bizName = business.name.toLowerCase().trim();

      // 5a. Exact name match = 100 points (highest confidence)
      if (txName === bizName) {
        score += 100;
      }
      // 5b. Business name is substring of merchant name = 80 points
      //     Example: "Starbucks" matches "Starbucks #1234"
      else if (txName.includes(bizName)) {
        score += 80;
      }
      // 5c. Merchant name is substring of business name = 60 points
      else if (bizName.includes(txName)) {
        score += 60;
      }
      // 5d. Partial word match = 40 points
      //     Example: "Target Store" matches "Target"
      else {
        const txWords = txName.split(/\s+/);
        const bizWords = bizName.split(/\s+/);
        const commonWords = txWords.filter(
          (w) => bizWords.includes(w) && w.length > 3
        );
        if (commonWords.length > 0) {
          score += 40;
        }
      }

      // 5e. MCC code match (if transaction category and business mccCodes exist)
      //     Simplified category matching for MVP
      if (
        tx.category &&
        tx.category.length > 0 &&
        business.mccCodes &&
        business.mccCodes.length > 0
      ) {
        // This needs proper MCC mapping; placeholder for now
        score += 20;
      }

      // 5f. Location proximity (if both have coordinates)
      //     TODO: Use geospatial component or haversine distance
      //     Within 1km = 30 bonus points
      // if (tx.location && business.location) {
      //   const distanceKm = calculateHaversineDistance(...);
      //   if (distanceKm < 1) score += 30;
      // }

      return { business, score };
    });

    // 6. Sort by score descending to get best match first
    scores.sort((a, b) => b.score - a.score);

    // 7. If highest score >= 80 (confidence threshold), return that businessId
    const bestMatch = scores[0];
    const CONFIDENCE_THRESHOLD = 80;

    if (bestMatch && bestMatch.score >= CONFIDENCE_THRESHOLD) {
      console.log(
        `Matched tx ${tx.plaidTransactionId} to business "${bestMatch.business.name}" ` +
          `(score: ${bestMatch.score}, merchant: "${tx.merchantName}")`
      );
      return bestMatch.business._id;
    }

    // 8. No confident match found - remains unmatched
    console.log(
      `No match for tx ${tx.plaidTransactionId} ` +
        `(merchant: "${tx.merchantName}", best score: ${bestMatch?.score || 0})`
    );
    return null;
  },
});

