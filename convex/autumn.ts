import { components } from "./_generated/api";
import { Autumn } from "@useautumn/convex";
import { authComponent } from "./auth";

export const autumn = new Autumn(components.autumn, {
  secretKey: process.env.AUTUMN_SECRET_KEY ?? "",
  identify: async (ctx: any) => {
    // IMPORTANT: authComponent.getAuthUser() throws when not authenticated
    // We need to wrap in try-catch for optional auth scenarios
    let user;
    try {
      user = await authComponent.getAuthUser(ctx);
    } catch (error) {
      // User is not authenticated
      return null;
    }

    if (!user) return null;

    const userId = user.userId || user._id;

    return {
      customerId: userId,
      customerData: {
        name: user.name as string,
        email: user.email as string,
      },
    };
  },
});

export const {
  track,
  cancel,
  query,
  attach,
  check,
  checkout,
  usage,
  setupPayment,
  createCustomer,
  listProducts,
  billingPortal,
  createReferralCode,
  redeemReferralCode,
  createEntity,
  getEntity,
} = autumn.api();

