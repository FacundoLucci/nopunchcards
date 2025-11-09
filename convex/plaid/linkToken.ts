"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} from "plaid";
import { authComponent } from "../auth";

const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV!],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
        "PLAID-SECRET": process.env.PLAID_SECRET!,
      },
    },
  })
);

export const createLinkToken = action({
  args: {},
  returns: v.object({ linkToken: v.string() }),
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const userId = user.userId || user._id;

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: "No Punch Cards",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
      webhook: `${process.env.SITE_URL}/api/plaid/webhook`,
    });

    return { linkToken: response.data.link_token };
  },
});

