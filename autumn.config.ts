import {
  feature,
  product,
  featureItem,
  priceItem,
} from "atmn";

// Define features
export const rewardPrograms = feature({
  id: "reward_programs_active",
  name: "Active Reward Programs",
  type: "continuous_use", // Limits concurrent active programs
});

export const monthlyCustomers = feature({
  id: "monthly_customers",
  name: "Monthly Customers",
  type: "single_use", // Resets each month
});

// Free tier
export const free = product({
  id: "free",
  name: "Free",
  items: [
    featureItem({
      feature_id: rewardPrograms.id,
      included_usage: 1, // 1 active program max
    }),
    featureItem({
      feature_id: monthlyCustomers.id,
      included_usage: 50, // 50 customers per month
      interval: "month",
    }),
  ],
});

// Pro tier
export const pro = product({
  id: "pro",
  name: "Pro",
  items: [
    featureItem({
      feature_id: rewardPrograms.id,
      included_usage: "inf", // inf = unlimited
    }),
    featureItem({
      feature_id: monthlyCustomers.id,
      included_usage: 500,
      interval: "month",
    }),
    priceItem({
      price: 20,
      interval: "month",
    }),
  ],
});

export default {
  features: [rewardPrograms, monthlyCustomers],
  products: [free, pro],
};

