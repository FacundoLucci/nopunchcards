import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Delete all data from all tables
export const clearAllData = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    console.log("Starting to clear all data...");

    // Delete all transactions
    const transactions = await ctx.db.query("transactions").collect();
    for (const transaction of transactions) {
      await ctx.db.delete(transaction._id);
    }
    console.log(`Deleted ${transactions.length} transactions`);

    // Delete all rewardProgress
    const rewardProgress = await ctx.db.query("rewardProgress").collect();
    for (const progress of rewardProgress) {
      await ctx.db.delete(progress._id);
    }
    console.log(`Deleted ${rewardProgress.length} reward progress records`);

    // Delete all rewardClaims
    const rewardClaims = await ctx.db.query("rewardClaims").collect();
    for (const claim of rewardClaims) {
      await ctx.db.delete(claim._id);
    }
    console.log(`Deleted ${rewardClaims.length} reward claim records`);

    // Delete all rewardPrograms
    const rewardPrograms = await ctx.db.query("rewardPrograms").collect();
    for (const program of rewardPrograms) {
      await ctx.db.delete(program._id);
    }
    console.log(`Deleted ${rewardPrograms.length} reward programs`);

    // Delete all plaidAccounts
    const plaidAccounts = await ctx.db.query("plaidAccounts").collect();
    for (const account of plaidAccounts) {
      await ctx.db.delete(account._id);
    }
    console.log(`Deleted ${plaidAccounts.length} Plaid accounts`);

    // Delete all businesses
    const businesses = await ctx.db.query("businesses").collect();
    for (const business of businesses) {
      await ctx.db.delete(business._id);
    }
    console.log(`Deleted ${businesses.length} businesses`);

    // Delete all notifications
    const notifications = await ctx.db.query("notifications").collect();
    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }
    console.log(`Deleted ${notifications.length} notifications`);

    // Delete all pushSubscriptions
    const pushSubscriptions = await ctx.db.query("pushSubscriptions").collect();
    for (const subscription of pushSubscriptions) {
      await ctx.db.delete(subscription._id);
    }
    console.log(`Deleted ${pushSubscriptions.length} push subscriptions`);

    // Delete all profiles
    const profiles = await ctx.db.query("profiles").collect();
    for (const profile of profiles) {
      await ctx.db.delete(profile._id);
    }
    console.log(`Deleted ${profiles.length} profiles`);

    // Note: Better Auth system tables (user, session, account) cannot be modified directly
    // They are managed by the Better Auth service

    console.log("All data cleared successfully!");
    return null;
  },
});

// Create realistic demo data
export const createDemoData = internalMutation({
  args: {},
  returns: v.object({
    userIds: v.array(v.string()),
    businessIds: v.array(v.id("businesses")),
    consumerIds: v.array(v.string()),
  }),
  handler: async (ctx) => {
    console.log("Creating demo data...");
    const now = Date.now();
    const userIds: Array<string> = [];
    const businessIds: Array<Id<"businesses">> = [];
    const consumerIds: Array<string> = [];

    // Create demo consumers (5 consumers)
    const consumers = [
      { name: "Sarah Johnson", email: "sarah.johnson@example.com" },
      { name: "Michael Chen", email: "michael.chen@example.com" },
      { name: "Emma Williams", email: "emma.williams@example.com" },
      { name: "James Rodriguez", email: "james.rodriguez@example.com" },
      { name: "Olivia Taylor", email: "olivia.taylor@example.com" },
    ];

    for (const consumer of consumers) {
      // Generate a demo user ID (in real app this would come from Better Auth)
      const userId = `demo_consumer_${consumer.email}`;
      
      await ctx.db.insert("profiles", {
        userId,
        role: "consumer" as const,
        createdAt: now - Math.random() * 90 * 24 * 60 * 60 * 1000,
        onboarding: {
          hasLinkedCard: true,
          completedAt: now - Math.random() * 85 * 24 * 60 * 60 * 1000,
        },
      });
      
      userIds.push(userId);
      consumerIds.push(userId);
    }
    console.log(`Created ${consumers.length} consumer profiles`);

    // Create demo business owners (8 business owners)
    const businessOwners = [
      { 
        name: "Antonio Rossi", 
        email: "antonio@rossis-pizzeria.com",
        business: {
          name: "Rossi's Pizzeria",
          slug: "rossis-pizzeria",
          category: "Restaurant",
          description: "Authentic Italian pizza made with love and traditional recipes passed down through generations.",
          address: "142 Main Street, Downtown",
          location: { lat: 41.8781, lng: -87.6298 },
          statementDescriptors: ["SQ*ROSSIS PIZZA", "ROSSIS PIZZERIA"],
          mccCodes: ["5812"], // Eating Places, Restaurants
          status: "verified" as const,
          rewardProgram: {
            name: "Pizza Lover's Rewards",
            description: "Buy 5 pizzas, get your 6th free!",
            visits: 6,
            reward: "Free large pizza of your choice",
          },
        },
      },
      {
        name: "Lisa Park",
        email: "lisa@brewhaven.com",
        business: {
          name: "Brew Haven",
          slug: "brew-haven",
          category: "Coffee Shop",
          description: "Artisan coffee shop specializing in single-origin beans and handcrafted beverages.",
          address: "87 Oak Avenue, Arts District",
          location: { lat: 41.8800, lng: -87.6320 },
          statementDescriptors: ["SQ*BREW HAVEN", "BREW HAVEN COFFEE"],
          mccCodes: ["5814"], // Fast Food Restaurants
          status: "verified" as const,
          rewardProgram: {
            name: "Coffee Club",
            description: "Earn a free drink every 10 visits",
            visits: 10,
            reward: "Free beverage of any size",
          },
        },
      },
      {
        name: "David Kim",
        email: "david@thefitfactory.com",
        business: {
          name: "The Fit Factory",
          slug: "the-fit-factory",
          category: "Fitness",
          description: "Premier fitness center with state-of-the-art equipment, personal training, and group classes.",
          address: "500 Wellness Boulevard",
          location: { lat: 41.8850, lng: -87.6200 },
          statementDescriptors: ["FIT FACTORY", "THE FIT FACTORY"],
          mccCodes: ["7997"], // Membership Athletic/Recreation Clubs
          status: "verified" as const,
          rewardProgram: {
            name: "Fitness Milestone Rewards",
            description: "Visit 20 times to earn a free personal training session",
            visits: 20,
            reward: "One hour personal training session",
          },
        },
      },
      {
        name: "Maria Garcia",
        email: "maria@sweettoothbakery.com",
        business: {
          name: "Sweet Tooth Bakery",
          slug: "sweet-tooth-bakery",
          category: "Bakery",
          description: "Fresh baked goods daily including artisan breads, pastries, and custom cakes.",
          address: "23 Bakery Lane",
          location: { lat: 41.8820, lng: -87.6350 },
          statementDescriptors: ["SQ*SWEET TOOTH", "SWEET TOOTH BAKERY"],
          mccCodes: ["5462"], // Bakeries
          status: "verified" as const,
          rewardProgram: {
            name: "Baker's Dozen",
            description: "Buy 12 pastries, get your 13th free",
            visits: 13,
            reward: "Free pastry or dessert",
          },
        },
      },
      {
        name: "Thomas Anderson",
        email: "tom@greenlawncare.com",
        business: {
          name: "Green Lawn Care Services",
          slug: "green-lawn-care",
          category: "Services",
          description: "Professional lawn maintenance, landscaping, and garden design services.",
          address: "1200 Garden Road",
          location: { lat: 41.8900, lng: -87.6400 },
          statementDescriptors: ["GREEN LAWN CARE", "GLC SERVICES"],
          mccCodes: ["0780"], // Landscaping and Horticultural Services
          status: "verified" as const,
          rewardProgram: {
            name: "Loyal Customer Discount",
            description: "After 4 regular services, get 20% off your next visit",
            visits: 5,
            reward: "20% discount on next service",
          },
        },
      },
      {
        name: "Jennifer Wu",
        email: "jennifer@zenmedispa.com",
        business: {
          name: "Zen Medi Spa",
          slug: "zen-medi-spa",
          category: "Beauty & Wellness",
          description: "Relaxing spa treatments, facials, massages, and wellness therapies.",
          address: "456 Serenity Street",
          location: { lat: 41.8780, lng: -87.6280 },
          statementDescriptors: ["ZEN MEDI SPA", "ZEN SPA"],
          mccCodes: ["7298"], // Health and Beauty Spas
          status: "verified" as const,
          rewardProgram: {
            name: "Spa Wellness Program",
            description: "Book 6 treatments and receive a complimentary upgrade",
            visits: 6,
            reward: "Free upgrade to deluxe treatment",
          },
        },
      },
      {
        name: "Robert Martinez",
        email: "robert@quickwash.com",
        business: {
          name: "QuickWash Auto Spa",
          slug: "quickwash-auto-spa",
          category: "Automotive",
          description: "Premium car wash and detailing services with eco-friendly products.",
          address: "789 Auto Plaza",
          location: { lat: 41.8750, lng: -87.6150 },
          statementDescriptors: ["QUICKWASH AUTO", "QUICKWASH SPA"],
          mccCodes: ["7542"], // Car Washes
          status: "verified" as const,
          rewardProgram: {
            name: "Clean Car Club",
            description: "Wash your car 8 times and get a free premium detail",
            visits: 8,
            reward: "Free premium interior & exterior detail",
          },
        },
      },
      {
        name: "Sophie Laurent",
        email: "sophie@petitbistro.com",
        business: {
          name: "Le Petit Bistro",
          slug: "le-petit-bistro",
          category: "Restaurant",
          description: "Cozy French bistro offering classic dishes and fine wines in an intimate setting.",
          address: "95 Bistro Boulevard",
          location: { lat: 41.8840, lng: -87.6270 },
          statementDescriptors: ["LE PETIT BISTRO", "SQ*PETIT BISTRO"],
          mccCodes: ["5812"], // Eating Places, Restaurants
          status: "verified" as const,
          rewardProgram: {
            name: "Bistro Regulars",
            description: "Dine with us 7 times and enjoy a complimentary appetizer",
            visits: 7,
            reward: "Free appetizer from our chef's selection",
          },
        },
      },
    ];

    for (const owner of businessOwners) {
      // Generate a demo user ID (in real app this would come from Better Auth)
      const userId = `demo_owner_${owner.email}`;

      await ctx.db.insert("profiles", {
        userId,
        role: "business_owner" as const,
        createdAt: now - Math.random() * 180 * 24 * 60 * 60 * 1000,
      });

      const businessId = await ctx.db.insert("businesses", {
        ownerId: userId,
        name: owner.business.name,
        slug: owner.business.slug,
        category: owner.business.category,
        description: owner.business.description,
        address: owner.business.address,
        location: owner.business.location,
        logoUrl: undefined,
        status: owner.business.status,
        mccCodes: owner.business.mccCodes,
        statementDescriptors: owner.business.statementDescriptors,
        createdAt: now - Math.random() * 170 * 24 * 60 * 60 * 1000,
      });

      // Create reward program for each business
      await ctx.db.insert("rewardPrograms", {
        businessId,
        name: owner.business.rewardProgram.name,
        description: owner.business.rewardProgram.description,
        type: "visit" as const,
        rules: {
          visits: owner.business.rewardProgram.visits,
          reward: owner.business.rewardProgram.reward,
        },
        status: "active" as const,
        createdAt: now - Math.random() * 160 * 24 * 60 * 60 * 1000,
      });

      userIds.push(userId);
      businessIds.push(businessId);
    }
    console.log(`Created ${businessOwners.length} business owner profiles and businesses`);

    // Create demo Plaid accounts for first 3 consumers
    const plaidAccountIds: Array<Id<"plaidAccounts">> = [];
    for (let i = 0; i < 3 && i < consumerIds.length; i++) {
      const consumerId = consumerIds[i];
      const plaidAccountId = await ctx.db.insert("plaidAccounts", {
        userId: consumerId,
        plaidItemId: `demo_item_${consumerId}`,
        plaidAccessTokenCiphertext: "demo_encrypted_token",
        accountIds: [`demo_account_${consumerId}_1`, `demo_account_${consumerId}_2`],
        status: "active" as const,
        institutionName: "Demo Bank",
        lastSyncedAt: now - Math.random() * 7 * 24 * 60 * 60 * 1000,
        createdAt: now - Math.random() * 60 * 24 * 60 * 60 * 1000,
      });
      plaidAccountIds.push(plaidAccountId);
    }
    console.log(`Created ${plaidAccountIds.length} demo Plaid accounts`);

    // Create demo transactions for consumers at various businesses
    let transactionCount = 0;
    for (let i = 0; i < consumerIds.length && i < plaidAccountIds.length; i++) {
      const consumerId = consumerIds[i];
      const plaidAccountId = plaidAccountIds[i];
      
      // Create 5-15 random transactions per consumer
      const numTransactions = Math.floor(Math.random() * 11) + 5;
      for (let j = 0; j < numTransactions; j++) {
        const randomBusiness = businessIds[Math.floor(Math.random() * businessIds.length)];
        const business = await ctx.db.get(randomBusiness);
        
        if (business) {
          const daysAgo = Math.floor(Math.random() * 60);
          const transactionDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
          const dateString = transactionDate.toISOString().split('T')[0];
          
          await ctx.db.insert("transactions", {
            plaidTransactionId: `demo_txn_${consumerId}_${j}`,
            userId: consumerId,
            plaidAccountId: plaidAccountId,
            amount: Math.floor(Math.random() * 8000) + 500, // $5-$85
            currency: "USD",
            merchantName: business.name,
            date: dateString,
            category: ["Food and Drink", "Restaurants"],
            businessId: randomBusiness,
            status: "matched" as const,
            createdAt: transactionDate.getTime(),
          });
          transactionCount++;
        }
      }
    }
    console.log(`Created ${transactionCount} demo transactions`);

    // Create reward progress for consumers
    let progressCount = 0;
    for (let i = 0; i < consumerIds.length && i < plaidAccountIds.length; i++) {
      const consumerId = consumerIds[i];
      
      // Get transactions for this consumer
      const userTransactions = await ctx.db
        .query("transactions")
        .filter((q) => q.eq(q.field("userId"), consumerId))
        .collect();
      
      // Group transactions by business
      const transactionsByBusiness: Record<string, Array<typeof userTransactions[0]>> = {};
      for (const txn of userTransactions) {
        if (txn.businessId) {
          const bizId = txn.businessId;
          if (!transactionsByBusiness[bizId]) {
            transactionsByBusiness[bizId] = [];
          }
          transactionsByBusiness[bizId].push(txn);
        }
      }
      
      // Create reward progress for each business they've visited
      for (const [businessIdStr, transactions] of Object.entries(transactionsByBusiness)) {
        const businessId = businessIdStr as Id<"businesses">;
        const rewardProgram = await ctx.db
          .query("rewardPrograms")
          .filter((q) => q.eq(q.field("businessId"), businessId))
          .first();
        
        if (rewardProgram && transactions.length > 0) {
          const rules = rewardProgram.rules as any;
          // Only create progress for visit-based programs in seed data
          if (rewardProgram.type === "visit" && "visits" in rules) {
            const currentVisits = transactions.length;
            const totalEarned = Math.floor(currentVisits / rules.visits);
            const lastTransaction = [...transactions].sort((a, b) => b.createdAt - a.createdAt)[0];
            
            await ctx.db.insert("rewardProgress", {
              userId: consumerId,
              businessId: businessId,
              rewardProgramId: rewardProgram._id,
              currentVisits: currentVisits % rules.visits,
              currentSpendCents: 0,
              totalEarned: totalEarned,
              lastVisitDate: lastTransaction.date,
              transactionIds: transactions.map(t => t._id),
              status: "active" as const,
              createdAt: transactions[0].createdAt,
            });
            progressCount++;
          }
        }
      }
    }
    console.log(`Created ${progressCount} reward progress records`);

    console.log("Demo data created successfully!");
    return { userIds, businessIds, consumerIds };
  },
});

// Run both clear and seed in one operation
export const resetWithDemoData = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    console.log("Step 1: Clearing existing data...");
    
    // Delete all transactions
    const transactions = await ctx.db.query("transactions").collect();
    for (const transaction of transactions) {
      await ctx.db.delete(transaction._id);
    }
    console.log(`Deleted ${transactions.length} transactions`);

    // Delete all rewardProgress
    const rewardProgress = await ctx.db.query("rewardProgress").collect();
    for (const progress of rewardProgress) {
      await ctx.db.delete(progress._id);
    }
    console.log(`Deleted ${rewardProgress.length} reward progress records`);

    // Delete all rewardClaims
    const rewardClaims = await ctx.db.query("rewardClaims").collect();
    for (const claim of rewardClaims) {
      await ctx.db.delete(claim._id);
    }
    console.log(`Deleted ${rewardClaims.length} reward claim records`);

    // Delete all rewardPrograms
    const rewardPrograms = await ctx.db.query("rewardPrograms").collect();
    for (const program of rewardPrograms) {
      await ctx.db.delete(program._id);
    }
    console.log(`Deleted ${rewardPrograms.length} reward programs`);

    // Delete all plaidAccounts
    const plaidAccounts = await ctx.db.query("plaidAccounts").collect();
    for (const account of plaidAccounts) {
      await ctx.db.delete(account._id);
    }
    console.log(`Deleted ${plaidAccounts.length} Plaid accounts`);

    // Delete all businesses
    const businesses = await ctx.db.query("businesses").collect();
    for (const business of businesses) {
      await ctx.db.delete(business._id);
    }
    console.log(`Deleted ${businesses.length} businesses`);

    // Delete all notifications
    const notifications = await ctx.db.query("notifications").collect();
    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }
    console.log(`Deleted ${notifications.length} notifications`);

    // Delete all pushSubscriptions
    const pushSubscriptions = await ctx.db.query("pushSubscriptions").collect();
    for (const subscription of pushSubscriptions) {
      await ctx.db.delete(subscription._id);
    }
    console.log(`Deleted ${pushSubscriptions.length} push subscriptions`);

    // Delete all profiles
    const profiles = await ctx.db.query("profiles").collect();
    for (const profile of profiles) {
      await ctx.db.delete(profile._id);
    }
    console.log(`Deleted ${profiles.length} profiles`);

    // Note: Better Auth system tables (user, session, account) cannot be modified directly
    // They are managed by the Better Auth service

    console.log("Step 2: Creating demo data...");
    const now = Date.now();

    // Create demo consumers (5 consumers)
    const consumers = [
      { name: "Sarah Johnson", email: "sarah.johnson@example.com" },
      { name: "Michael Chen", email: "michael.chen@example.com" },
      { name: "Emma Williams", email: "emma.williams@example.com" },
      { name: "James Rodriguez", email: "james.rodriguez@example.com" },
      { name: "Olivia Taylor", email: "olivia.taylor@example.com" },
    ];

    for (const consumer of consumers) {
      // Generate a demo user ID (in real app this would come from Better Auth)
      const userId = `demo_consumer_${consumer.email}`;
      
      await ctx.db.insert("profiles", {
        userId,
        role: "consumer" as const,
        createdAt: now - Math.random() * 90 * 24 * 60 * 60 * 1000,
        onboarding: {
          hasLinkedCard: true,
          completedAt: now - Math.random() * 85 * 24 * 60 * 60 * 1000,
        },
      });
    }
    console.log(`Created ${consumers.length} consumer profiles`);

    // Create demo business owners (8 business owners)
    const businessOwners = [
      { 
        name: "Antonio Rossi", 
        email: "antonio@rossis-pizzeria.com",
        business: {
          name: "Rossi's Pizzeria",
          slug: "rossis-pizzeria",
          category: "Restaurant",
          description: "Authentic Italian pizza made with love and traditional recipes passed down through generations.",
          address: "142 Main Street, Downtown",
          location: { lat: 41.8781, lng: -87.6298 },
          statementDescriptors: ["SQ*ROSSIS PIZZA", "ROSSIS PIZZERIA"],
          mccCodes: ["5812"],
          status: "verified" as const,
          rewardProgram: {
            name: "Pizza Lover's Rewards",
            description: "Buy 5 pizzas, get your 6th free!",
            visits: 6,
            reward: "Free large pizza of your choice",
          },
        },
      },
      {
        name: "Lisa Park",
        email: "lisa@brewhaven.com",
        business: {
          name: "Brew Haven",
          slug: "brew-haven",
          category: "Coffee Shop",
          description: "Artisan coffee shop specializing in single-origin beans and handcrafted beverages.",
          address: "87 Oak Avenue, Arts District",
          location: { lat: 41.8800, lng: -87.6320 },
          statementDescriptors: ["SQ*BREW HAVEN", "BREW HAVEN COFFEE"],
          mccCodes: ["5814"],
          status: "verified" as const,
          rewardProgram: {
            name: "Coffee Club",
            description: "Earn a free drink every 10 visits",
            visits: 10,
            reward: "Free beverage of any size",
          },
        },
      },
      {
        name: "David Kim",
        email: "david@thefitfactory.com",
        business: {
          name: "The Fit Factory",
          slug: "the-fit-factory",
          category: "Fitness",
          description: "Premier fitness center with state-of-the-art equipment, personal training, and group classes.",
          address: "500 Wellness Boulevard",
          location: { lat: 41.8850, lng: -87.6200 },
          statementDescriptors: ["FIT FACTORY", "THE FIT FACTORY"],
          mccCodes: ["7997"],
          status: "verified" as const,
          rewardProgram: {
            name: "Fitness Milestone Rewards",
            description: "Visit 20 times to earn a free personal training session",
            visits: 20,
            reward: "One hour personal training session",
          },
        },
      },
      {
        name: "Maria Garcia",
        email: "maria@sweettoothbakery.com",
        business: {
          name: "Sweet Tooth Bakery",
          slug: "sweet-tooth-bakery",
          category: "Bakery",
          description: "Fresh baked goods daily including artisan breads, pastries, and custom cakes.",
          address: "23 Bakery Lane",
          location: { lat: 41.8820, lng: -87.6350 },
          statementDescriptors: ["SQ*SWEET TOOTH", "SWEET TOOTH BAKERY"],
          mccCodes: ["5462"],
          status: "verified" as const,
          rewardProgram: {
            name: "Baker's Dozen",
            description: "Buy 12 pastries, get your 13th free",
            visits: 13,
            reward: "Free pastry or dessert",
          },
        },
      },
      {
        name: "Thomas Anderson",
        email: "tom@greenlawncare.com",
        business: {
          name: "Green Lawn Care Services",
          slug: "green-lawn-care",
          category: "Services",
          description: "Professional lawn maintenance, landscaping, and garden design services.",
          address: "1200 Garden Road",
          location: { lat: 41.8900, lng: -87.6400 },
          statementDescriptors: ["GREEN LAWN CARE", "GLC SERVICES"],
          mccCodes: ["0780"],
          status: "verified" as const,
          rewardProgram: {
            name: "Loyal Customer Discount",
            description: "After 4 regular services, get 20% off your next visit",
            visits: 5,
            reward: "20% discount on next service",
          },
        },
      },
      {
        name: "Jennifer Wu",
        email: "jennifer@zenmedispa.com",
        business: {
          name: "Zen Medi Spa",
          slug: "zen-medi-spa",
          category: "Beauty & Wellness",
          description: "Relaxing spa treatments, facials, massages, and wellness therapies.",
          address: "456 Serenity Street",
          location: { lat: 41.8780, lng: -87.6280 },
          statementDescriptors: ["ZEN MEDI SPA", "ZEN SPA"],
          mccCodes: ["7298"],
          status: "verified" as const,
          rewardProgram: {
            name: "Spa Wellness Program",
            description: "Book 6 treatments and receive a complimentary upgrade",
            visits: 6,
            reward: "Free upgrade to deluxe treatment",
          },
        },
      },
      {
        name: "Robert Martinez",
        email: "robert@quickwash.com",
        business: {
          name: "QuickWash Auto Spa",
          slug: "quickwash-auto-spa",
          category: "Automotive",
          description: "Premium car wash and detailing services with eco-friendly products.",
          address: "789 Auto Plaza",
          location: { lat: 41.8750, lng: -87.6150 },
          statementDescriptors: ["QUICKWASH AUTO", "QUICKWASH SPA"],
          mccCodes: ["7542"],
          status: "verified" as const,
          rewardProgram: {
            name: "Clean Car Club",
            description: "Wash your car 8 times and get a free premium detail",
            visits: 8,
            reward: "Free premium interior & exterior detail",
          },
        },
      },
      {
        name: "Sophie Laurent",
        email: "sophie@petitbistro.com",
        business: {
          name: "Le Petit Bistro",
          slug: "le-petit-bistro",
          category: "Restaurant",
          description: "Cozy French bistro offering classic dishes and fine wines in an intimate setting.",
          address: "95 Bistro Boulevard",
          location: { lat: 41.8840, lng: -87.6270 },
          statementDescriptors: ["LE PETIT BISTRO", "SQ*PETIT BISTRO"],
          mccCodes: ["5812"],
          status: "verified" as const,
          rewardProgram: {
            name: "Bistro Regulars",
            description: "Dine with us 7 times and enjoy a complimentary appetizer",
            visits: 7,
            reward: "Free appetizer from our chef's selection",
          },
        },
      },
    ];

    for (const owner of businessOwners) {
      // Generate a demo user ID (in real app this would come from Better Auth)
      const userId = `demo_owner_${owner.email}`;

      await ctx.db.insert("profiles", {
        userId,
        role: "business_owner" as const,
        createdAt: now - Math.random() * 180 * 24 * 60 * 60 * 1000,
      });

      const businessId = await ctx.db.insert("businesses", {
        ownerId: userId,
        name: owner.business.name,
        slug: owner.business.slug,
        category: owner.business.category,
        description: owner.business.description,
        address: owner.business.address,
        location: owner.business.location,
        logoUrl: undefined,
        status: owner.business.status,
        mccCodes: owner.business.mccCodes,
        statementDescriptors: owner.business.statementDescriptors,
        createdAt: now - Math.random() * 170 * 24 * 60 * 60 * 1000,
      });

      // Create reward program for each business
      await ctx.db.insert("rewardPrograms", {
        businessId,
        name: owner.business.rewardProgram.name,
        description: owner.business.rewardProgram.description,
        type: "visit" as const,
        rules: {
          visits: owner.business.rewardProgram.visits,
          reward: owner.business.rewardProgram.reward,
        },
        status: "active" as const,
        createdAt: now - Math.random() * 160 * 24 * 60 * 60 * 1000,
      });
    }
    console.log(`Created ${businessOwners.length} business owner profiles and businesses`);

    // Create demo Plaid accounts for consumers
    const consumerIds: Array<string> = [];
    for (const consumer of consumers) {
      consumerIds.push(`demo_consumer_${consumer.email}`);
    }
    
    const plaidAccountIds: Array<Id<"plaidAccounts">> = [];
    for (let i = 0; i < 3 && i < consumerIds.length; i++) {
      const consumerId = consumerIds[i];
      const plaidAccountId = await ctx.db.insert("plaidAccounts", {
        userId: consumerId,
        plaidItemId: `demo_item_${consumerId}`,
        plaidAccessTokenCiphertext: "demo_encrypted_token",
        accountIds: [`demo_account_${consumerId}_1`, `demo_account_${consumerId}_2`],
        status: "active" as const,
        institutionName: "Demo Bank",
        lastSyncedAt: now - Math.random() * 7 * 24 * 60 * 60 * 1000,
        createdAt: now - Math.random() * 60 * 24 * 60 * 60 * 1000,
      });
      plaidAccountIds.push(plaidAccountId);
    }
    console.log(`Created ${plaidAccountIds.length} demo Plaid accounts`);

    // Collect businessIds
    const createdBusinessIds: Array<Id<"businesses">> = [];
    for (const owner of businessOwners) {
      const business = await ctx.db
        .query("businesses")
        .filter((q) => q.eq(q.field("slug"), owner.business.slug))
        .first();
      if (business) {
        createdBusinessIds.push(business._id);
      }
    }

    // Create demo transactions
    let transactionCount = 0;
    for (let i = 0; i < consumerIds.length && i < plaidAccountIds.length; i++) {
      const consumerId = consumerIds[i];
      const plaidAccountId = plaidAccountIds[i];
      
      const numTransactions = Math.floor(Math.random() * 11) + 5;
      for (let j = 0; j < numTransactions; j++) {
        const randomBusiness = createdBusinessIds[Math.floor(Math.random() * createdBusinessIds.length)];
        const business = await ctx.db.get(randomBusiness);
        
        if (business) {
          const daysAgo = Math.floor(Math.random() * 60);
          const transactionDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
          const dateString = transactionDate.toISOString().split('T')[0];
          
          await ctx.db.insert("transactions", {
            plaidTransactionId: `demo_txn_${consumerId}_${j}`,
            userId: consumerId,
            plaidAccountId: plaidAccountId,
            amount: Math.floor(Math.random() * 8000) + 500,
            currency: "USD",
            merchantName: business.name,
            date: dateString,
            category: ["Food and Drink", "Restaurants"],
            businessId: randomBusiness,
            status: "matched" as const,
            createdAt: transactionDate.getTime(),
          });
          transactionCount++;
        }
      }
    }
    console.log(`Created ${transactionCount} demo transactions`);

    // Create reward progress
    let progressCount = 0;
    for (let i = 0; i < consumerIds.length && i < plaidAccountIds.length; i++) {
      const consumerId = consumerIds[i];
      
      const userTransactions = await ctx.db
        .query("transactions")
        .filter((q) => q.eq(q.field("userId"), consumerId))
        .collect();
      
      const transactionsByBusiness: Record<string, Array<typeof userTransactions[0]>> = {};
      for (const txn of userTransactions) {
        if (txn.businessId) {
          const bizId = txn.businessId;
          if (!transactionsByBusiness[bizId]) {
            transactionsByBusiness[bizId] = [];
          }
          transactionsByBusiness[bizId].push(txn);
        }
      }
      
      for (const [businessIdStr, transactions] of Object.entries(transactionsByBusiness)) {
        const businessId = businessIdStr as Id<"businesses">;
        const rewardProgram = await ctx.db
          .query("rewardPrograms")
          .filter((q) => q.eq(q.field("businessId"), businessId))
          .first();
        
        if (rewardProgram && transactions.length > 0) {
          const rules = rewardProgram.rules as any;
          // Only create progress for visit-based programs in seed data
          if (rewardProgram.type === "visit" && "visits" in rules) {
            const currentVisits = transactions.length;
            const totalEarned = Math.floor(currentVisits / rules.visits);
            const lastTransaction = transactions.sort((a, b) => b.createdAt - a.createdAt)[0];
            
            await ctx.db.insert("rewardProgress", {
              userId: consumerId,
              businessId: businessId,
              rewardProgramId: rewardProgram._id,
              currentVisits: currentVisits % rules.visits,
              currentSpendCents: 0,
              totalEarned: totalEarned,
              lastVisitDate: lastTransaction.date,
              transactionIds: transactions.map(t => t._id),
              status: "active" as const,
              createdAt: transactions[0].createdAt,
            });
            progressCount++;
          }
        }
      }
    }
    console.log(`Created ${progressCount} reward progress records`);

    console.log("Database reset with demo data complete!");
    return null;
  },
});

