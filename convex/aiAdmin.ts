import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import { DEFAULT_AI_POLICY } from "./lib/aiPolicy";

const providerValidator = v.union(
  v.literal("openai"),
  v.literal("gemini"),
  v.literal("anthropic"),
);

const policyValidator = v.object({
  freeDailyRequests: v.number(),
  premiumDailyRequests: v.number(),
  adminDailyRequests: v.number(),
  maxInputCharacters: v.number(),
  maxOutputTokens: v.number(),
  monthlyBudgetMicrousd: v.number(),
  fallbackEnabled: v.boolean(),
});

export const getPolicy = query({
  args: {},
  returns: policyValidator,
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const policy = await ctx.db
      .query("aiGatewayPolicies")
      .withIndex("by_key", (index) => index.eq("key", "default"))
      .unique();
    return policy
      ? {
          freeDailyRequests: policy.freeDailyRequests,
          premiumDailyRequests: policy.premiumDailyRequests,
          adminDailyRequests: policy.adminDailyRequests,
          maxInputCharacters: policy.maxInputCharacters,
          maxOutputTokens: policy.maxOutputTokens,
          monthlyBudgetMicrousd: policy.monthlyBudgetMicrousd,
          fallbackEnabled: policy.fallbackEnabled,
        }
      : {
          freeDailyRequests: DEFAULT_AI_POLICY.freeDailyRequests,
          premiumDailyRequests: DEFAULT_AI_POLICY.premiumDailyRequests,
          adminDailyRequests: DEFAULT_AI_POLICY.adminDailyRequests,
          maxInputCharacters: DEFAULT_AI_POLICY.maxInputCharacters,
          maxOutputTokens: DEFAULT_AI_POLICY.maxOutputTokens,
          monthlyBudgetMicrousd: DEFAULT_AI_POLICY.monthlyBudgetMicrousd,
          fallbackEnabled: DEFAULT_AI_POLICY.fallbackEnabled,
        };
  },
});

export const listRecentProviderEvents = query({
  args: { limit: v.number() },
  returns: v.array(
    v.object({
      id: v.id("aiProviderEvents"),
      provider: providerValidator,
      event: v.union(
        v.literal("request-success"),
        v.literal("request-failure"),
        v.literal("circuit-opened"),
        v.literal("circuit-half-open"),
        v.literal("circuit-closed"),
        v.literal("provider-disabled"),
      ),
      requestId: v.optional(v.id("aiRequestLedger")),
      code: v.optional(v.string()),
      message: v.optional(v.string()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > 100) {
      throw new Error("INVALID_LIMIT");
    }
    const events = await ctx.db
      .query("aiProviderEvents")
      .order("desc")
      .take(args.limit);
    return events.map((event) => ({
      id: event._id,
      provider: event.provider,
      event: event.event,
      requestId: event.requestId,
      code: event.code,
      message: event.message,
      createdAt: event.createdAt,
    }));
  },
});
