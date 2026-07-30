import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "guarded official source sync",
  { hours: 6 },
  internal.sourceSync.startScheduledSync,
  {},
);

export default crons;
