import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";

export const resendComponent = new Resend(components.resend, {
  // testMode defaults to true; set false in prod to send real emails
  // testMode: false,
});

