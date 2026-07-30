import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";
import { writeAuditLog } from "./lib/audit";
import { requireActiveUser, requireAdmin } from "./lib/auth";
import {
  DEFAULT_AI_POLICY,
  DEFAULT_PROVIDER_CONFIGS,
  normalizeFailureCode,
  normalizeIdempotencyKey,
  normalizeSafeMessage,
  quotaForRole,
  utcDayKey,
  validateInputCharacters,
} from "./lib/aiPolicy";

const providerValidator = v.union(
  v.literal("openai"),
  v.literal("gemini"),
  v.literal("anthropic"),
);

const capabilityValidator = v.union(
  v.literal("study-coach"),
  v.literal("exam-analysis"),
  v.literal("study-planner"),
  v.literal("pdf-question"),
);

const requestStatusValidator = v.union(
  v.literal("planned"),
  v.literal("queued"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("blocked"),
  v.literal("cancelled"),
);

const circuitStatusValidator = v.union(
  v.literal("closed"),
  v.literal("open"),
  v.literal("half-open"),
  v.literal("disabled"),
);

const publicProviderValidator = v.object({
  provider: providerValidator,
  displayName: v.string(),
  enabled: v.boolean(),
  adapterReady: v.boolean(),
  routePriority: v.number(),
  modelAlias: v.string(),
  monthlyBudgetMicrousd: v.number(),
  spendMicrousd: v.number(),
  circuitStatus: circuitStatusValidator,
  cooldownUntil: v.optional(v.number()),
});

const publicRequestValidator = v.object({
  id: v.id("aiRequestLedger"),
  capability: capabilityValidator,
  status: requestStatusValidator,
  provider: v.optional(providerValidator),
  modelAlias: v.optional(v.string()),
  inputCharacters: v.number(),
  inputTokens: v.optional(v.number()),
  outputTokens: v.optional(v.number()),
  estimatedCostMicrousd: v.number(),
  actualCostMicrousd: v.optional(v.number()),
  failureCode: v.optional(v.string()),
  createdAt: v.number(),
  completedAt: v.optional(v.number()),
});

const policyValidator = v.object({
  freeDailyRequests: v.number(),
  premiumDailyRequests: v.number(),
  adminDailyRequests: v.number(),
  maxInputCharacters: v.number(),
  maxOutputTokens: v.number(),
  monthlyBudgetMicrousd: v.number(),
  fallbackEnabled: v.boolean(),
});

type GatewayContext = QueryCtx | MutationCtx;

async function getPolicy(ctx: GatewayContext) {
  const stored = await ctx.db
    .query("aiGatewayPolicies")
    .withIndex("by_key", (index) => index.eq("key", "default"))
    .unique();

  return stored ?? {
    ...DEFAULT_AI_POLICY,
    updatedAt: 0,
  };
}

async function getUsage(
  ctx: GatewayContext,
  userId: Id<"users">,
  dayKey: string,
) {
  return await ctx.db
    .query("aiUsageBuckets")
    .withIndex("by_userId_and_dayKey", (index) =>
      index.eq("userId", userId).eq("dayKey", dayKey),
    )
    .unique();
}

async function selectProvider(ctx: GatewayContext) {
  const now = Date.now();
  const candidates = await ctx.db
    .query("aiProviderConfigs")
    .withIndex("by_enabled_and_routePriority", (index) =>
      index.eq("enabled", true),
    )
    .order("asc")
    .take(10);

  return (
    candidates.find(
      (provider) =>
        provider.adapterReady &&
        ["closed", "half-open"].includes(provider.circuitStatus) &&
        (provider.cooldownUntil === undefined || provider.cooldownUntil <= now) &&
        provider.spendMicrousd < provider.monthlyBudgetMicrousd,
    ) ?? null
  );
}

async function reserveUsage(
  ctx: MutationCtx,
  userId: Id<"users">,
  dayKey: string,
  inputCharacters: number,
) {
  const usage = await getUsage(ctx, userId, dayKey);
  const now = Date.now();
  if (usage) {
    await ctx.db.patch(usage._id, {
      requestCount: usage.requestCount + 1,
      reservedInputCharacters:
        usage.reservedInputCharacters + inputCharacters,
      updatedAt: now,
    });
    return usage._id;
  }

  return await ctx.db.insert("aiUsageBuckets", {
    userId,
    dayKey,
    requestCount: 1,
    reservedInputCharacters: inputCharacters,
    inputTokens: 0,
    outputTokens: 0,
    costMicrousd: 0,
    updatedAt: now,
  });
}

function toPublicProvider(provider: Doc<"aiProviderConfigs">) {
  return {
    provider: provider.provider,
    displayName: provider.displayName,
    enabled: provider.enabled,
    adapterReady: provider.adapterReady,
    routePriority: provider.routePriority,
    modelAlias: provider.modelAlias,
    monthlyBudgetMicrousd: provider.monthlyBudgetMicrousd,
    spendMicrousd: provider.spendMicrousd,
    circuitStatus: provider.circuitStatus,
    cooldownUntil: provider.cooldownUntil,
  };
}

function toPublicRequest(request: Doc<"aiRequestLedger">) {
  return {
    id: request._id,
    capability: request.capability,
    status: request.status,
    provider: request.provider,
    modelAlias: request.modelAlias,
    inputCharacters: request.inputCharacters,
    inputTokens: request.inputTokens,
    outputTokens: request.outputTokens,
    estimatedCostMicrousd: request.estimatedCostMicrousd,
    actualCostMicrousd: request.actualCostMicrousd,
    failureCode: request.failureCode,
    createdAt: request.createdAt,
    completedAt: request.completedAt,
  };
}

export const currentStatus = query({
  args: {},
  returns: v.object({
    role: v.union(v.literal("free"), v.literal("premium"), v.literal("admin")),
    dayKey: v.string(),
    dailyQuota: v.number(),
    usedToday: v.number(),
    remainingToday: v.number(),
    maxInputCharacters: v.number(),
    maxOutputTokens: v.number(),
    gatewayReady: v.boolean(),
    providers: v.array(publicProviderValidator),
  }),
  handler: async (ctx) => {
    const user = await requireActiveUser(ctx);
    const policy = await getPolicy(ctx);
    const dayKey = utcDayKey();
    const usage = await getUsage(ctx, user._id, dayKey);
    const quota = quotaForRole(user.role, policy);
    const providers = await ctx.db
      .query("aiProviderConfigs")
      .order("asc")
      .take(10);
    const usedToday = usage?.requestCount ?? 0;

    return {
      role: user.role,
      dayKey,
      dailyQuota: quota,
      usedToday,
      remainingToday: Math.max(quota - usedToday, 0),
      maxInputCharacters: policy.maxInputCharacters,
      maxOutputTokens: policy.maxOutputTokens,
      gatewayReady: providers.some(
        (provider) =>
          provider.enabled &&
          provider.adapterReady &&
          ["closed", "half-open"].includes(provider.circuitStatus),
      ),
      providers: providers.map(toPublicProvider),
    };
  },
});

export const createRequestIntent = mutation({
  args: {
    capability: capabilityValidator,
    idempotencyKey: v.string(),
    inputCharacters: v.number(),
  },
  returns: v.object({
    request: publicRequestValidator,
    reused: v.boolean(),
    quotaRemaining: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    const policy = await getPolicy(ctx);
    const idempotencyKey = normalizeIdempotencyKey(args.idempotencyKey);
    const inputCharacters = validateInputCharacters(
      args.inputCharacters,
      policy.maxInputCharacters,
    );

    const duplicate = await ctx.db
      .query("aiRequestLedger")
      .withIndex("by_userId_and_idempotencyKey", (index) =>
        index.eq("userId", user._id).eq("idempotencyKey", idempotencyKey),
      )
      .unique();
    const dayKey = utcDayKey();
    const quota = quotaForRole(user.role, policy);
    const currentUsage = await getUsage(ctx, user._id, dayKey);

    if (duplicate) {
      return {
        request: toPublicRequest(duplicate),
        reused: true,
        quotaRemaining: Math.max(
          quota - (currentUsage?.requestCount ?? 0),
          0,
        ),
      };
    }

    const used = currentUsage?.requestCount ?? 0;
    if (used >= quota) {
      await writeAuditLog(ctx, {
        actorUserId: user._id,
        actorAuthSubject: user.authSubject,
        action: "ai.request_denied",
        resourceType: "aiGateway",
        result: "denied",
        metadata: { reason: "daily_quota_exceeded", dayKey },
      });
      throw new Error("AI_DAILY_QUOTA_EXCEEDED");
    }

    const provider = await selectProvider(ctx);
    const now = Date.now();
    const requestId = await ctx.db.insert("aiRequestLedger", {
      userId: user._id,
      dayKey,
      idempotencyKey,
      capability: args.capability,
      status: provider ? "planned" : "blocked",
      provider: provider?.provider,
      modelAlias: provider?.modelAlias,
      inputCharacters,
      estimatedCostMicrousd: 0,
      failureCode: provider ? undefined : "NO_PROVIDER_ADAPTER",
      createdAt: now,
      completedAt: provider ? undefined : now,
    });

    // Every accepted intent is bounded by the daily quota, including blocked
    // intents. This prevents authenticated users from creating unbounded ledger
    // and audit records while no provider adapter is available.
    await reserveUsage(ctx, user._id, dayKey, inputCharacters);

    await writeAuditLog(ctx, {
      actorUserId: user._id,
      actorAuthSubject: user.authSubject,
      action: provider ? "ai.request_planned" : "ai.request_blocked",
      resourceType: "aiRequestLedger",
      resourceId: requestId,
      result: provider ? "success" : "denied",
      metadata: {
        capability: args.capability,
        inputCharacters,
        ...(provider === null ? {} : { provider: provider.provider }),
      },
    });

    return {
      request: toPublicRequest((await ctx.db.get(requestId))!),
      reused: false,
      quotaRemaining: Math.max(quota - used - 1, 0),
    };
  },
});

export const adminInitializeDefaults = mutation({
  args: {},
  returns: v.object({
    policyCreated: v.boolean(),
    providersCreated: v.number(),
  }),
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const now = Date.now();
    const currentPolicy = await ctx.db
      .query("aiGatewayPolicies")
      .withIndex("by_key", (index) => index.eq("key", "default"))
      .unique();
    let policyCreated = false;

    if (!currentPolicy) {
      await ctx.db.insert("aiGatewayPolicies", {
        ...DEFAULT_AI_POLICY,
        updatedAt: now,
        updatedBy: admin._id,
      });
      policyCreated = true;
    }

    let providersCreated = 0;
    for (const provider of DEFAULT_PROVIDER_CONFIGS) {
      const existing = await ctx.db
        .query("aiProviderConfigs")
        .withIndex("by_provider", (index) =>
          index.eq("provider", provider.provider),
        )
        .unique();
      if (existing) continue;
      await ctx.db.insert("aiProviderConfigs", {
        ...provider,
        spendMicrousd: 0,
        circuitStatus: "disabled",
        consecutiveFailures: 0,
        updatedAt: now,
        updatedBy: admin._id,
      });
      providersCreated += 1;
    }

    await writeAuditLog(ctx, {
      actorUserId: admin._id,
      actorAuthSubject: admin.authSubject,
      action: "ai.gateway_initialized",
      resourceType: "aiGateway",
      result: "success",
      metadata: { policyCreated, providersCreated },
    });

    return { policyCreated, providersCreated };
  },
});

export const adminUpdatePolicy = mutation({
  args: policyValidator,
  returns: policyValidator,
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const limits = [
      args.freeDailyRequests,
      args.premiumDailyRequests,
      args.adminDailyRequests,
      args.maxInputCharacters,
      args.maxOutputTokens,
      args.monthlyBudgetMicrousd,
    ];
    if (limits.some((value) => !Number.isInteger(value) || value < 0)) {
      throw new Error("AI_POLICY_INVALID");
    }
    if (
      args.freeDailyRequests > args.premiumDailyRequests ||
      args.premiumDailyRequests > args.adminDailyRequests ||
      args.maxInputCharacters < 100 ||
      args.maxInputCharacters > 100_000 ||
      args.maxOutputTokens < 64 ||
      args.maxOutputTokens > 16_384
    ) {
      throw new Error("AI_POLICY_INVALID");
    }

    const current = await ctx.db
      .query("aiGatewayPolicies")
      .withIndex("by_key", (index) => index.eq("key", "default"))
      .unique();
    const now = Date.now();
    if (current) {
      await ctx.db.patch(current._id, {
        ...args,
        updatedAt: now,
        updatedBy: admin._id,
      });
    } else {
      await ctx.db.insert("aiGatewayPolicies", {
        key: "default",
        ...args,
        updatedAt: now,
        updatedBy: admin._id,
      });
    }

    await writeAuditLog(ctx, {
      actorUserId: admin._id,
      actorAuthSubject: admin.authSubject,
      action: "ai.policy_updated",
      resourceType: "aiGatewayPolicy",
      result: "success",
      metadata: { monthlyBudgetMicrousd: args.monthlyBudgetMicrousd },
    });

    return args;
  },
});

export const adminUpdateProviderRouting = mutation({
  args: {
    provider: providerValidator,
    enabled: v.boolean(),
    routePriority: v.number(),
    modelAlias: v.string(),
    maxConcurrency: v.number(),
    timeoutMs: v.number(),
    monthlyBudgetMicrousd: v.number(),
  },
  returns: publicProviderValidator,
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const config = await ctx.db
      .query("aiProviderConfigs")
      .withIndex("by_provider", (index) => index.eq("provider", args.provider))
      .unique();
    if (!config) throw new Error("AI_PROVIDER_NOT_INITIALIZED");
    if (args.enabled && !config.adapterReady) {
      throw new Error("AI_PROVIDER_ADAPTER_NOT_READY");
    }

    const modelAlias = args.modelAlias.replace(/\s+/g, " ").trim();
    if (
      !Number.isInteger(args.routePriority) ||
      args.routePriority < 1 ||
      args.routePriority > 100 ||
      !Number.isInteger(args.maxConcurrency) ||
      args.maxConcurrency < 1 ||
      args.maxConcurrency > 100 ||
      !Number.isInteger(args.timeoutMs) ||
      args.timeoutMs < 1_000 ||
      args.timeoutMs > 120_000 ||
      !Number.isInteger(args.monthlyBudgetMicrousd) ||
      args.monthlyBudgetMicrousd < 0 ||
      modelAlias.length < 2 ||
      modelAlias.length > 80
    ) {
      throw new Error("AI_PROVIDER_CONFIG_INVALID");
    }

    await ctx.db.patch(config._id, {
      enabled: args.enabled,
      routePriority: args.routePriority,
      modelAlias,
      maxConcurrency: args.maxConcurrency,
      timeoutMs: args.timeoutMs,
      monthlyBudgetMicrousd: args.monthlyBudgetMicrousd,
      circuitStatus: args.enabled ? "closed" : "disabled",
      updatedAt: Date.now(),
      updatedBy: admin._id,
    });

    await writeAuditLog(ctx, {
      actorUserId: admin._id,
      actorAuthSubject: admin.authSubject,
      action: "ai.provider_routing_updated",
      resourceType: "aiProviderConfig",
      resourceId: config._id,
      result: "success",
      metadata: { provider: args.provider, enabled: args.enabled },
    });

    return toPublicProvider((await ctx.db.get(config._id))!);
  },
});

export const adminListProviders = query({
  args: {},
  returns: v.array(publicProviderValidator),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const providers = await ctx.db
      .query("aiProviderConfigs")
      .order("asc")
      .take(10);
    return providers.map(toPublicProvider);
  },
});

export const adminListRequests = query({
  args: { limit: v.number() },
  returns: v.array(publicRequestValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > 100) {
      throw new Error("INVALID_LIMIT");
    }
    const requests = await ctx.db
      .query("aiRequestLedger")
      .order("desc")
      .take(args.limit);
    return requests.map(toPublicRequest);
  },
});

export const internalSetAdapterReady = internalMutation({
  args: { provider: providerValidator, ready: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("aiProviderConfigs")
      .withIndex("by_provider", (index) => index.eq("provider", args.provider))
      .unique();
    if (!config) throw new Error("AI_PROVIDER_NOT_INITIALIZED");
    await ctx.db.patch(config._id, {
      adapterReady: args.ready,
      enabled: args.ready ? config.enabled : false,
      circuitStatus: args.ready ? "closed" : "disabled",
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const internalClaimRequest = internalMutation({
  args: {
    requestId: v.id("aiRequestLedger"),
    provider: providerValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (
      !request ||
      request.status !== "planned" ||
      request.provider !== args.provider
    ) {
      throw new Error("AI_REQUEST_NOT_CLAIMABLE");
    }
    await ctx.db.patch(request._id, {
      status: "running",
      startedAt: Date.now(),
    });
    return null;
  },
});

export const internalCompleteRequest = internalMutation({
  args: {
    requestId: v.id("aiRequestLedger"),
    inputTokens: v.number(),
    outputTokens: v.number(),
    actualCostMicrousd: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request || request.status !== "running" || !request.provider) {
      throw new Error("AI_REQUEST_NOT_RUNNING");
    }
    if (
      [args.inputTokens, args.outputTokens, args.actualCostMicrousd].some(
        (value) => !Number.isInteger(value) || value < 0,
      )
    ) {
      throw new Error("AI_USAGE_INVALID");
    }

    const usage = await getUsage(ctx, request.userId, request.dayKey);
    if (!usage) throw new Error("AI_USAGE_BUCKET_MISSING");
    const providerName = request.provider;
    const provider = await ctx.db
      .query("aiProviderConfigs")
      .withIndex("by_provider", (index) => index.eq("provider", providerName))
      .unique();
    if (!provider) throw new Error("AI_PROVIDER_NOT_INITIALIZED");
    const now = Date.now();

    await ctx.db.patch(request._id, {
      status: "completed",
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      actualCostMicrousd: args.actualCostMicrousd,
      completedAt: now,
    });
    await ctx.db.patch(usage._id, {
      inputTokens: usage.inputTokens + args.inputTokens,
      outputTokens: usage.outputTokens + args.outputTokens,
      costMicrousd: usage.costMicrousd + args.actualCostMicrousd,
      updatedAt: now,
    });
    await ctx.db.patch(provider._id, {
      spendMicrousd: provider.spendMicrousd + args.actualCostMicrousd,
      consecutiveFailures: 0,
      circuitStatus: "closed",
      cooldownUntil: undefined,
      lastSuccessAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("aiProviderEvents", {
      provider: providerName,
      event: "request-success",
      requestId: request._id,
      createdAt: now,
    });
    return null;
  },
});

export const internalFailRequest = internalMutation({
  args: {
    requestId: v.id("aiRequestLedger"),
    code: v.string(),
    message: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (
      !request ||
      !["planned", "running"].includes(request.status) ||
      !request.provider
    ) {
      throw new Error("AI_REQUEST_NOT_FAILABLE");
    }
    const providerName = request.provider;
    const provider = await ctx.db
      .query("aiProviderConfigs")
      .withIndex("by_provider", (index) => index.eq("provider", providerName))
      .unique();
    if (!provider) throw new Error("AI_PROVIDER_NOT_INITIALIZED");

    const now = Date.now();
    const failureCount = provider.consecutiveFailures + 1;
    const openCircuit = failureCount >= 5;
    const code = normalizeFailureCode(args.code);
    const message = normalizeSafeMessage(args.message);

    await ctx.db.patch(request._id, {
      status: "failed",
      failureCode: code,
      completedAt: now,
    });
    await ctx.db.patch(provider._id, {
      consecutiveFailures: failureCount,
      circuitStatus: openCircuit ? "open" : provider.circuitStatus,
      openedAt: openCircuit ? now : provider.openedAt,
      cooldownUntil: openCircuit ? now + 5 * 60_000 : provider.cooldownUntil,
      lastFailureAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("aiProviderEvents", {
      provider: providerName,
      event: "request-failure",
      requestId: request._id,
      code,
      message,
      createdAt: now,
    });
    if (openCircuit) {
      await ctx.db.insert("aiProviderEvents", {
        provider: providerName,
        event: "circuit-opened",
        requestId: request._id,
        code,
        createdAt: now,
      });
    }
    return null;
  },
});
