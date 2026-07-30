import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireActiveUser, requireAdmin } from "./lib/auth";

const subscriptionStatusValidator = v.union(
  v.literal("active"),
  v.literal("trialing"),
  v.literal("past_due"),
  v.literal("canceled"),
  v.literal("expired"),
);

const publicSubscriptionValidator = v.object({
  id: v.id("subscriptions"),
  userId: v.id("users"),
  plan: v.union(v.literal("free"), v.literal("premium")),
  status: subscriptionStatusValidator,
  currentPeriodStart: v.optional(v.number()),
  currentPeriodEnd: v.optional(v.number()),
  cancelAtPeriodEnd: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

function toPublicSubscription(subscription: {
  _id: Parameters<typeof publicSubscriptionValidator["json"]>[0] extends never
    ? never
    : never;
}) {
  return subscription;
}

export const current = query({
  args: {},
  returns: v.union(publicSubscriptionValidator, v.null()),
  handler: async (ctx) => {
    const user = await requireActiveUser(ctx);
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (query) => query.eq("userId", user._id))
      .unique();

    if (!subscription) return null;

    return {
      id: subscription._id,
      userId: subscription.userId,
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  },
});

export const adminList = query({
  args: { limit: v.number() },
  returns: v.array(publicSubscriptionValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > 100) {
      throw new Error("INVALID_LIMIT");
    }

    const subscriptions = await ctx.db
      .query("subscriptions")
      .order("desc")
      .take(args.limit);

    return subscriptions.map((subscription) => ({
      id: subscription._id,
      userId: subscription.userId,
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    }));
  },
});
