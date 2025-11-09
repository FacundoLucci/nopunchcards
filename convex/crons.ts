import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Process unmatched transactions every 5 minutes
crons.interval(
  "process unmatched transactions",
  { minutes: 5 },
  internal.matching.processNewTransactions.processNewTransactions,
  {}
);

export default crons;

