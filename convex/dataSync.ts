import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireActiveUser } from "./lib/auth";

const syncStateValidator = v.object({
  status: v.union(v.literal("idle"), v.literal("completed"), v.literal("failed")),
  studySessions: v.number(),
  practiceAttempts: v.number(),
  topicProgress: v.number(),
  plannerTasks: v.number(),
  lastSyncedAt: v.number(),
  lastError: v.optional(v.string()),
});

export const current = query({
  args: {},
  returns: v.union(syncStateValidator, v.null()),
  handler: async (ctx) => {
    const user = await requireActiveUser(ctx);
    const state = await ctx.db
      .query("userDataSyncStates")
      .withIndex("by_userId", (index) => index.eq("userId", user._id))
      .unique();
    if (!state) return null;
    return {
      status: state.status,
      studySessions: state.studySessions,
      practiceAttempts: state.practiceAttempts,
      topicProgress: state.topicProgress,
      plannerTasks: state.plannerTasks,
      lastSyncedAt: state.lastSyncedAt,
      lastError: state.lastError,
    };
  },
});

export const syncNow = mutation({
  args: {},
  returns: syncStateValidator,
  handler: async (ctx) => {
    const user = await requireActiveUser(ctx);
    const [sessions, attempts, progress, tasks] = await Promise.all([
      ctx.db
        .query("studySessions")
        .withIndex("by_userId_and_studiedAt", (index) => index.eq("userId", user._id))
        .take(500),
      ctx.db
        .query("practiceAttempts")
        .withIndex("by_userId_and_completedAt", (index) => index.eq("userId", user._id))
        .take(500),
      ctx.db
        .query("userTopicProgress")
        .withIndex("by_userId_and_updatedAt", (index) => index.eq("userId", user._id))
        .take(500),
      ctx.db
        .query("plannerTasks")
        .withIndex("by_userId_and_dayKey", (index) => index.eq("userId", user._id))
        .take(500),
    ]);
    const next = {
      status: "completed" as const,
      studySessions: sessions.length,
      practiceAttempts: attempts.length,
      topicProgress: progress.length,
      plannerTasks: tasks.length,
      lastSyncedAt: Date.now(),
    };
    const existing = await ctx.db
      .query("userDataSyncStates")
      .withIndex("by_userId", (index) => index.eq("userId", user._id))
      .unique();
    if (existing) await ctx.db.patch(existing._id, next);
    else await ctx.db.insert("userDataSyncStates", { userId: user._id, ...next });
    return next;
  },
});
