import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

export const calculateRewards = internalMutation({
  args: {
    userId: v.string(),
    businessId: v.id("businesses"),
    transactionId: v.id("transactions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // 1. Get all active reward programs for this businessId using by_businessId index
    const activePrograms = await ctx.db
      .query("rewardPrograms")
      .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    if (activePrograms.length === 0) {
      return null; // No active programs for this business
    }

    // 2. Process each active reward program
    for (const program of activePrograms) {
      // 2a. Get existing active rewardProgress for (userId, programId)
      //     Use by_rewardProgramId index and filter by userId and status="active"
      let progress = await ctx.db
        .query("rewardProgress")
        .withIndex("by_rewardProgramId", (q) => q.eq("rewardProgramId", program._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), args.userId),
            q.eq(q.field("status"), "active")
          )
        )
        .unique();

      // Create new progress if doesn't exist
      if (!progress) {
        const progressId = await ctx.db.insert("rewardProgress", {
          userId: args.userId,
          businessId: args.businessId,
          rewardProgramId: program._id,
          currentVisits: 0,
          totalEarned: 0,
          transactionIds: [],
          status: "active",
          createdAt: Date.now(),
        });
        progress = (await ctx.db.get(progressId))!;
      }

      // 2b. Increment visit count
      const newVisitCount = progress.currentVisits + 1;

      // 2c. Add transactionId to array (audit trail)
      const updatedTxIds = [...progress.transactionIds, args.transactionId];

      // 2d. Check if user reached reward threshold from program.rules.visits
      const thresholdReached = newVisitCount >= program.rules.visits;

      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      if (thresholdReached) {
        // 2e. User earned a reward!

        // Update existing progress to "completed" status
        await ctx.db.patch(progress._id, {
          currentVisits: newVisitCount,
          transactionIds: updatedTxIds,
          totalEarned: progress.totalEarned + 1,
          status: "completed",
          lastVisitDate: today,
        });

        // Get business details for notification
        const business = await ctx.db.get(args.businessId);
        if (!business) throw new Error("Business not found");

        // Schedule notification action: reward earned
        await ctx.scheduler.runAfter(0, internal.notifications.sendRewardEarned.sendRewardEarned, {
          userId: args.userId,
          businessId: args.businessId,
          businessName: business.name,
          rewardDescription: program.rules.reward,
          programName: program.name,
        });

        // Create new active rewardProgress for next reward cycle (auto-renew)
        await ctx.db.insert("rewardProgress", {
          userId: args.userId,
          businessId: args.businessId,
          rewardProgramId: program._id,
          currentVisits: 0,
          totalEarned: 0,
          transactionIds: [],
          status: "active",
          createdAt: Date.now(),
        });

        console.log(
          `User ${args.userId} earned reward "${program.rules.reward}" ` +
            `at ${business?.name} (${newVisitCount} visits)`
        );
      } else {
        // 2f. Not yet at threshold, update progress
        await ctx.db.patch(progress._id, {
          currentVisits: newVisitCount,
          transactionIds: updatedTxIds,
          lastVisitDate: today,
        });

        console.log(
          `User ${args.userId} progress: ${newVisitCount}/${program.rules.visits} ` +
            `visits at program "${program.name}"`
        );
      }
    }

    return null;
  },
});

