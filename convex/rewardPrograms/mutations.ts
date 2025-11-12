import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireRole } from "../users";

export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("visit"), v.literal("spend")),
    rules: v.union(
      v.object({ 
        visits: v.number(), 
        reward: v.string(),
        minimumSpendCents: v.optional(v.number())
      }),
      v.object({ 
        spendAmountCents: v.number(), 
        reward: v.string() 
      })
    ),
  },
  returns: v.id("rewardPrograms"),
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["business_owner", "admin"]);

    // Verify ownership
    const business = await ctx.db.get(args.businessId);
    if (!business) {
      throw new Error("Business not found");
    }

    if (business.ownerId !== user.id && user.profile?.role !== "admin") {
      throw new Error("Forbidden: You don't own this business");
    }

    // TODO: Add Autumn billing check here
    // For now, allow creation (can add billing later)

    // Create reward program
    const programId = await ctx.db.insert("rewardPrograms", {
      businessId: args.businessId,
      name: args.name,
      description: args.description,
      type: args.type,
      rules: args.rules,
      status: "active",
      createdAt: Date.now(),
    });

    // TODO: Track usage with Autumn
    // await ctx.runAction(internal.autumn.track, { ... })

    return programId;
  },
});

export const update = mutation({
  args: {
    programId: v.id("rewardPrograms"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.union(v.literal("visit"), v.literal("spend"))),
    rules: v.optional(v.union(
      v.object({ 
        visits: v.number(), 
        reward: v.string(),
        minimumSpendCents: v.optional(v.number())
      }),
      v.object({ 
        spendAmountCents: v.number(), 
        reward: v.string() 
      })
    )),
    status: v.optional(
      v.union(v.literal("active"), v.literal("paused"), v.literal("archived"))
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["business_owner", "admin"]);

    const program = await ctx.db.get(args.programId);
    if (!program) {
      throw new Error("Program not found");
    }

    const business = await ctx.db.get(program.businessId);
    if (!business) {
      throw new Error("Business not found");
    }

    if (business.ownerId !== user.id && user.profile?.role !== "admin") {
      throw new Error("Forbidden: You don't own this business");
    }

    const { programId, ...updates } = args;
    await ctx.db.patch(programId, updates);

    return null;
  },
});

export const listByBusiness = query({
  args: { businessId: v.id("businesses") },
  returns: v.array(
    v.object({
      _id: v.id("rewardPrograms"),
      _creationTime: v.number(),
      businessId: v.id("businesses"),
      name: v.string(),
      description: v.optional(v.string()),
      type: v.string(),
      rules: v.union(
        v.object({ 
          visits: v.number(), 
          reward: v.string(),
          minimumSpendCents: v.optional(v.number())
        }),
        v.object({ 
          spendAmountCents: v.number(), 
          reward: v.string() 
        })
      ),
      status: v.string(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["business_owner", "admin"]);

    const business = await ctx.db.get(args.businessId);
    if (!business) {
      throw new Error("Business not found");
    }

    if (business.ownerId !== user.id && user.profile?.role !== "admin") {
      throw new Error("Forbidden: You don't own this business");
    }

    return await ctx.db
      .query("rewardPrograms")
      .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
      .collect();
  },
});

