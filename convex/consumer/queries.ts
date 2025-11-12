import { query } from "../_generated/server";
import { v } from "convex/values";
import { authComponent } from "../auth";
import { Id } from "../_generated/dataModel";

// Get consumer's active reward progress sorted by most recent activity
export const getActiveProgress = query({
  args: {},
  returns: v.array(
    v.union(
      v.object({
        _id: v.id("rewardProgress"),
        businessId: v.id("businesses"),
        businessName: v.string(),
        programType: v.literal("visit"),
        currentVisits: v.number(),
        totalVisits: v.number(),
        minimumSpendCents: v.optional(v.number()),
        rewardDescription: v.string(),
        programName: v.string(),
        lastActivityDate: v.optional(v.string()),
      }),
      v.object({
        _id: v.id("rewardProgress"),
        businessId: v.id("businesses"),
        businessName: v.string(),
        programType: v.literal("spend"),
        currentSpendCents: v.number(),
        totalSpendCents: v.number(),
        rewardDescription: v.string(),
        programName: v.string(),
        lastActivityDate: v.optional(v.string()),
      })
    )
  ),
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    // Return empty array if not authenticated instead of throwing
    if (!user) return [];

    const userId = user.userId || user._id;

    const progressRecords = await ctx.db
      .query("rewardProgress")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const result = [];
    for (const progress of progressRecords) {
      const business = await ctx.db.get(progress.businessId);
      const program = await ctx.db.get(progress.rewardProgramId);

      if (business && program) {
        // Get the most recent transaction for this business to sort by activity
        const lastTransaction = await ctx.db
          .query("transactions")
          .withIndex("by_userId_and_date", (q) => q.eq("userId", userId))
          .filter((q) => q.eq(q.field("businessId"), progress.businessId))
          .order("desc")
          .first();

        const rules = program.rules as any;

        if (program.type === "visit" && "visits" in rules) {
          result.push({
            _id: progress._id,
            businessId: progress.businessId,
            businessName: business.name,
            programType: "visit" as const,
            currentVisits: progress.currentVisits,
            totalVisits: rules.visits,
            minimumSpendCents: rules.minimumSpendCents,
            rewardDescription: rules.reward,
            programName: program.name,
            lastActivityDate: lastTransaction?.date,
          });
        } else if (program.type === "spend" && "spendAmountCents" in rules) {
          result.push({
            _id: progress._id,
            businessId: progress.businessId,
            businessName: business.name,
            programType: "spend" as const,
            currentSpendCents: progress.currentSpendCents || 0,
            totalSpendCents: rules.spendAmountCents,
            rewardDescription: rules.reward,
            programName: program.name,
            lastActivityDate: lastTransaction?.date,
          });
        }
      }
    }

    // Sort by most recent activity (transactions with no activity go last)
    return result.sort((a, b) => {
      if (!a.lastActivityDate && !b.lastActivityDate) return 0;
      if (!a.lastActivityDate) return 1;
      if (!b.lastActivityDate) return -1;
      return b.lastActivityDate.localeCompare(a.lastActivityDate);
    });
  },
});

// Get nearby businesses with their active reward programs
export const getNearbyRewards = query({
  args: {
    userLat: v.number(),
    userLng: v.number(),
    radiusMeters: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("businesses"),
      businessName: v.string(),
      category: v.optional(v.string()),
      address: v.optional(v.string()),
      distance: v.optional(v.number()),
      programName: v.string(),
      programType: v.string(),
      rewardDescription: v.string(),
      visitsRequired: v.optional(v.number()),
      spendAmountCents: v.optional(v.number()),
      minimumSpendCents: v.optional(v.number()),
      currentProgress: v.optional(
        v.object({
          currentVisits: v.optional(v.number()),
          currentSpendCents: v.optional(v.number()),
          progressId: v.id("rewardProgress"),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    const userId = user?.userId || user?._id;

    // Get all businesses with active reward programs
    const businesses = await ctx.db.query("businesses").collect();

    const result = [];
    for (const business of businesses) {
      // Get active reward programs for this business
      const programs = await ctx.db
        .query("rewardPrograms")
        .withIndex("by_businessId", (q) => q.eq("businessId", business._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      for (const program of programs) {
        // Calculate distance if business has location
        let distance: number | undefined;
        if (business.location) {
          const lat1 = args.userLat;
          const lon1 = args.userLng;
          const lat2 = business.location.lat;
          const lon2 = business.location.lng;

          // Haversine formula to calculate distance
          const R = 6371e3; // Earth's radius in meters
          const φ1 = (lat1 * Math.PI) / 180;
          const φ2 = (lat2 * Math.PI) / 180;
          const Δφ = ((lat2 - lat1) * Math.PI) / 180;
          const Δλ = ((lon2 - lon1) * Math.PI) / 180;

          const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

          distance = R * c;

          // Skip if outside radius
          const radiusMeters = args.radiusMeters || 10000; // Default 10km
          if (distance > radiusMeters) continue;
        }

        const rules = program.rules as any;

        // Get user's progress on this program if authenticated
        let currentProgress:
          | { 
              currentVisits?: number; 
              currentSpendCents?: number;
              progressId: Id<"rewardProgress"> 
            }
          | undefined;
        if (userId) {
          const progress = await ctx.db
            .query("rewardProgress")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .filter((q) =>
              q.and(
                q.eq(q.field("businessId"), business._id),
                q.eq(q.field("rewardProgramId"), program._id),
                q.eq(q.field("status"), "active")
              )
            )
            .first();

          if (progress) {
            currentProgress = {
              currentVisits: program.type === "visit" ? progress.currentVisits : undefined,
              currentSpendCents: program.type === "spend" ? progress.currentSpendCents || 0 : undefined,
              progressId: progress._id,
            };
          }
        }

        result.push({
          _id: business._id,
          businessName: business.name,
          category: business.category,
          address: business.address,
          distance,
          programName: program.name,
          programType: program.type,
          rewardDescription: rules.reward,
          visitsRequired: "visits" in rules ? rules.visits : undefined,
          spendAmountCents: "spendAmountCents" in rules ? rules.spendAmountCents : undefined,
          minimumSpendCents: "minimumSpendCents" in rules ? rules.minimumSpendCents : undefined,
          currentProgress,
        });
      }
    }

    // Sort by distance (undefined distances go last)
    return result.sort((a, b) => {
      if (a.distance === undefined && b.distance === undefined) return 0;
      if (a.distance === undefined) return 1;
      if (b.distance === undefined) return -1;
      return a.distance - b.distance;
    });
  },
});

// Get recent transactions
export const getRecentTransactions = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("transactions"),
      merchantName: v.optional(v.string()),
      businessName: v.optional(v.string()),
      amount: v.number(),
      date: v.string(),
      programType: v.optional(v.string()),
      currentVisits: v.optional(v.number()),
      totalVisits: v.optional(v.number()),
      currentSpendCents: v.optional(v.number()),
      totalSpendCents: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    // Return empty array if not authenticated instead of throwing
    if (!user) return [];

    const userId = user.userId || user._id;

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_and_date", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 10);

    const result = [];
    for (const tx of transactions) {
      let businessName = undefined;
      let programType = undefined;
      let currentVisits = undefined;
      let totalVisits = undefined;
      let currentSpendCents = undefined;
      let totalSpendCents = undefined;

      if (tx.businessId) {
        const business = await ctx.db.get(tx.businessId);
        businessName = business?.name;

        // Get active progress for this business
        const progress = await ctx.db
          .query("rewardProgress")
          .withIndex("by_businessId", (q) => q.eq("businessId", tx.businessId!))
          .filter((q) =>
            q.and(
              q.eq(q.field("userId"), user.userId || user._id),
              q.eq(q.field("status"), "active")
            )
          )
          .unique();

        if (progress) {
          const program = await ctx.db.get(progress.rewardProgramId);
          if (program) {
            programType = program.type;
            const rules = program.rules as any;
            
            if (program.type === "visit" && "visits" in rules) {
              currentVisits = progress.currentVisits;
              totalVisits = rules.visits;
            } else if (program.type === "spend" && "spendAmountCents" in rules) {
              currentSpendCents = progress.currentSpendCents || 0;
              totalSpendCents = rules.spendAmountCents;
            }
          }
        }
      }

      result.push({
        _id: tx._id,
        merchantName: tx.merchantName,
        businessName,
        amount: tx.amount,
        date: tx.date,
        programType,
        currentVisits,
        totalVisits,
        currentSpendCents,
        totalSpendCents,
      });
    }

    return result;
  },
});
