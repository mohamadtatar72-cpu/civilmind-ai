import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { requireActiveUser } from "./lib/auth";
import {
  AiAdapterError,
  executeProviderAdapter,
  validatePromptEnvelope,
  type AiProvider,
} from "./lib/aiAdapterContract";
import {
  validateRequestedTools,
  type AiCapability,
} from "./lib/aiToolPolicy";
import { normalizeFailureCode, normalizeSafeMessage } from "./lib/aiPolicy";

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

const statusValidator = v.union(
  v.literal("planned"),
  v.literal("queued"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("blocked"),
  v.literal("cancelled"),
);

type AiRuntimeStatus =
  | "planned"
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "blocked"
  | "cancelled";

type SubmitAndExecuteResult = {
  requestId: Id<"aiRequestLedger">;
  status: AiRuntimeStatus;
  responseText?: string;
  failureCode?: string;
  quotaRemaining: number;
};

type GatewayStatus = { maxOutputTokens: number };
type RequestIntentResult = {
  request: {
    id: Id<"aiRequestLedger">;
    status: AiRuntimeStatus;
    failureCode?: string;
  };
  quotaRemaining: number;
};
type ExecutionContext = {
  requestId: Id<"aiRequestLedger">;
  capability: AiCapability;
  status: AiRuntimeStatus;
  provider: AiProvider;
  modelAlias: string;
  timeoutMs: number;
  maxOutputTokens: number;
  fallbackEnabled: boolean;
};

function errorCode(error: unknown) {
  if (error instanceof AiAdapterError) return error.code;
  if (error instanceof Error) return normalizeFailureCode(error.message);
  return "AI_RUNTIME_FAILURE";
}

function isRetryable(error: unknown) {
  return error instanceof AiAdapterError && error.retryable;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new AiAdapterError("AI_PROVIDER_TIMEOUT", true)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export const getExecutionContext = internalQuery({
  args: { requestId: v.id("aiRequestLedger") },
  returns: v.union(
    v.object({
      requestId: v.id("aiRequestLedger"),
      capability: capabilityValidator,
      status: statusValidator,
      provider: providerValidator,
      modelAlias: v.string(),
      timeoutMs: v.number(),
      maxOutputTokens: v.number(),
      fallbackEnabled: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request || !request.provider || !request.modelAlias) return null;

    const provider = await ctx.db
      .query("aiProviderConfigs")
      .withIndex("by_provider", (index) =>
        index.eq("provider", request.provider!),
      )
      .unique();
    const policy = await ctx.db
      .query("aiGatewayPolicies")
      .withIndex("by_key", (index) => index.eq("key", "default"))
      .unique();
    if (!provider || !policy) return null;

    return {
      requestId: request._id,
      capability: request.capability,
      status: request.status,
      provider: request.provider,
      modelAlias: request.modelAlias,
      timeoutMs: provider.timeoutMs,
      maxOutputTokens: policy.maxOutputTokens,
      fallbackEnabled: policy.fallbackEnabled,
    };
  },
});

export const recordAttemptFailureAndSelectFallback = internalMutation({
  args: {
    requestId: v.id("aiRequestLedger"),
    failedProvider: providerValidator,
    code: v.string(),
    message: v.optional(v.string()),
  },
  returns: v.union(
    v.object({ provider: providerValidator, modelAlias: v.string() }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (
      !request ||
      request.status !== "running" ||
      request.provider !== args.failedProvider
    ) {
      throw new Error("AI_REQUEST_NOT_RUNNING");
    }

    const failedConfig = await ctx.db
      .query("aiProviderConfigs")
      .withIndex("by_provider", (index) =>
        index.eq("provider", args.failedProvider),
      )
      .unique();
    if (!failedConfig) throw new Error("AI_PROVIDER_NOT_INITIALIZED");

    const now = Date.now();
    const failureCount = failedConfig.consecutiveFailures + 1;
    const openCircuit = failureCount >= 5;
    const code = normalizeFailureCode(args.code);
    const message = normalizeSafeMessage(args.message);

    await ctx.db.patch(failedConfig._id, {
      consecutiveFailures: failureCount,
      circuitStatus: openCircuit ? "open" : failedConfig.circuitStatus,
      openedAt: openCircuit ? now : failedConfig.openedAt,
      cooldownUntil: openCircuit ? now + 5 * 60_000 : failedConfig.cooldownUntil,
      lastFailureAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("aiProviderEvents", {
      provider: args.failedProvider,
      event: "request-failure",
      requestId: request._id,
      code,
      message,
      createdAt: now,
    });
    if (openCircuit) {
      await ctx.db.insert("aiProviderEvents", {
        provider: args.failedProvider,
        event: "circuit-opened",
        requestId: request._id,
        code,
        createdAt: now,
      });
    }

    const candidates = await ctx.db
      .query("aiProviderConfigs")
      .withIndex("by_enabled_and_routePriority", (index) =>
        index.eq("enabled", true),
      )
      .order("asc")
      .take(10);
    const fallback = candidates.find(
      (candidate) =>
        candidate.provider !== args.failedProvider &&
        candidate.adapterReady &&
        ["closed", "half-open"].includes(candidate.circuitStatus) &&
        (candidate.cooldownUntil === undefined || candidate.cooldownUntil <= now) &&
        candidate.spendMicrousd < candidate.monthlyBudgetMicrousd,
    );

    if (!fallback) {
      await ctx.db.patch(request._id, {
        status: "failed",
        failureCode: code,
        completedAt: now,
      });
      return null;
    }

    await ctx.db.patch(request._id, {
      status: "planned",
      provider: fallback.provider,
      modelAlias: fallback.modelAlias,
      failureCode: undefined,
      startedAt: undefined,
    });
    return { provider: fallback.provider, modelAlias: fallback.modelAlias };
  },
});

export const submitAndExecute = action({
  args: {
    capability: capabilityValidator,
    idempotencyKey: v.string(),
    userText: v.string(),
    requestedTools: v.array(v.string()),
  },
  returns: v.object({
    requestId: v.id("aiRequestLedger"),
    status: statusValidator,
    responseText: v.optional(v.string()),
    failureCode: v.optional(v.string()),
    quotaRemaining: v.number(),
  }),
  handler: async (ctx, args): Promise<SubmitAndExecuteResult> => {
    const status = await ctx.runQuery(
      api.aiGateway.currentStatus,
      {},
    ) as GatewayStatus;
    const tools = validateRequestedTools(
      args.capability as AiCapability,
      args.requestedTools,
    );
    const prompt = validatePromptEnvelope({
      capability: args.capability as AiCapability,
      userText: args.userText,
      requestedTools: tools,
      maxOutputTokens: status.maxOutputTokens,
    });

    const intent = await ctx.runMutation(
      api.aiGateway.createRequestIntent,
      {
        capability: args.capability,
        idempotencyKey: args.idempotencyKey,
        inputCharacters: prompt.userText.length,
      },
    ) as RequestIntentResult;
    const requestId: Id<"aiRequestLedger"> = intent.request.id;

    if (intent.request.status !== "planned") {
      return {
        requestId,
        status: intent.request.status,
        failureCode: intent.request.failureCode,
        quotaRemaining: intent.quotaRemaining,
      };
    }

    let attempts = 0;
    while (attempts < 2) {
      attempts += 1;
      const execution = await ctx.runQuery(
        internal.aiRuntime.getExecutionContext,
        { requestId },
      ) as ExecutionContext | null;
      if (!execution || execution.status !== "planned") {
        return {
          requestId,
          status: execution?.status ?? "failed",
          failureCode: "AI_EXECUTION_CONTEXT_MISSING",
          quotaRemaining: intent.quotaRemaining,
        };
      }

      await ctx.runMutation(internal.aiGateway.internalClaimRequest, {
        requestId,
        provider: execution.provider,
      });

      try {
        const response = await withTimeout(
          executeProviderAdapter({
            requestId,
            provider: execution.provider,
            modelAlias: execution.modelAlias,
            prompt,
            timeoutMs: execution.timeoutMs,
          }),
          execution.timeoutMs,
        );
        await ctx.runMutation(internal.aiGateway.internalCompleteRequest, {
          requestId,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          actualCostMicrousd: response.costMicrousd,
        });
        return {
          requestId,
          status: "completed",
          responseText: response.text,
          quotaRemaining: intent.quotaRemaining,
        };
      } catch (error) {
        const code = errorCode(error);
        if (
          attempts < 2 &&
          execution.fallbackEnabled &&
          isRetryable(error)
        ) {
          const fallback = await ctx.runMutation(
            internal.aiRuntime.recordAttemptFailureAndSelectFallback,
            {
              requestId,
              failedProvider: execution.provider,
              code,
              message: error instanceof Error ? error.message : undefined,
            },
          );
          if (fallback) continue;
          return {
            requestId,
            status: "failed",
            failureCode: code,
            quotaRemaining: intent.quotaRemaining,
          };
        }

        await ctx.runMutation(internal.aiGateway.internalFailRequest, {
          requestId,
          code,
          message: error instanceof Error ? error.message : undefined,
        });
        return {
          requestId,
          status: "failed",
          failureCode: code,
          quotaRemaining: intent.quotaRemaining,
        };
      }
    }

    return {
      requestId,
      status: "failed",
      failureCode: "AI_RETRY_LIMIT_REACHED",
      quotaRemaining: intent.quotaRemaining,
    };
  },
});

export const cancelOwnRequest = mutation({
  args: { requestId: v.id("aiRequestLedger") },
  returns: statusValidator,
  handler: async (ctx, args): Promise<AiRuntimeStatus> => {
    const user = await requireActiveUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request || request.userId !== user._id) {
      throw new Error("AI_REQUEST_NOT_FOUND");
    }
    if (!["planned", "queued"].includes(request.status)) {
      throw new Error("AI_REQUEST_NOT_CANCELLABLE");
    }
    await ctx.db.patch(request._id, {
      status: "cancelled",
      failureCode: "USER_CANCELLED",
      completedAt: Date.now(),
    });
    return "cancelled";
  },
});

export const myRecentRequests = query({
  args: { limit: v.number() },
  returns: v.array(
    v.object({
      id: v.id("aiRequestLedger"),
      capability: capabilityValidator,
      status: statusValidator,
      provider: v.optional(providerValidator),
      failureCode: v.optional(v.string()),
      createdAt: v.number(),
      completedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    if (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > 50) {
      throw new Error("INVALID_LIMIT");
    }
    const requests = await ctx.db
      .query("aiRequestLedger")
      .withIndex("by_userId_and_createdAt", (index) =>
        index.eq("userId", user._id),
      )
      .order("desc")
      .take(args.limit);
    return requests.map((request) => ({
      id: request._id,
      capability: request.capability,
      status: request.status,
      provider: request.provider,
      failureCode: request.failureCode,
      createdAt: request.createdAt,
      completedAt: request.completedAt,
    }));
  },
});
