import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { writeAuditLog } from "./lib/audit";
import { requireAdmin } from "./lib/auth";
import {
  fetchOfficialSource,
  summarizeTextChange,
} from "./lib/sourceSyncSecurity";

const runStatusValidator = v.union(
  v.literal("queued"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("partial"),
  v.literal("failed"),
);

const runValidator = v.object({
  id: v.id("sourceSyncRuns"),
  trigger: v.union(v.literal("manual"), v.literal("scheduled")),
  status: runStatusValidator,
  requestedBy: v.optional(v.id("users")),
  startedAt: v.number(),
  completedAt: v.optional(v.number()),
  sourceCount: v.number(),
  baselineCount: v.number(),
  unchangedCount: v.number(),
  changedCount: v.number(),
  quarantinedCount: v.number(),
  failedCount: v.number(),
  errorSummary: v.optional(v.string()),
});

const itemStatusValidator = v.union(
  v.literal("baseline"),
  v.literal("unchanged"),
  v.literal("proposal"),
  v.literal("quarantined"),
  v.literal("failed"),
);

const itemValidator = v.object({
  id: v.id("sourceSyncItems"),
  runId: v.id("sourceSyncRuns"),
  sourceKey: v.string(),
  sourceUrl: v.string(),
  status: itemStatusValidator,
  httpStatus: v.optional(v.number()),
  snapshotId: v.optional(v.id("sourceSnapshots")),
  proposalId: v.optional(v.id("sourceChangeProposals")),
  message: v.optional(v.string()),
  processedAt: v.number(),
});

function toPublicRun(run: {
  _id: Id<"sourceSyncRuns">;
  trigger: "manual" | "scheduled";
  status: "queued" | "running" | "completed" | "partial" | "failed";
  requestedBy?: Id<"users">;
  startedAt: number;
  completedAt?: number;
  sourceCount: number;
  baselineCount: number;
  unchangedCount: number;
  changedCount: number;
  quarantinedCount: number;
  failedCount: number;
  errorSummary?: string;
}) {
  return {
    id: run._id,
    trigger: run.trigger,
    status: run.status,
    requestedBy: run.requestedBy,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    sourceCount: run.sourceCount,
    baselineCount: run.baselineCount,
    unchangedCount: run.unchangedCount,
    changedCount: run.changedCount,
    quarantinedCount: run.quarantinedCount,
    failedCount: run.failedCount,
    errorSummary: run.errorSummary,
  };
}

async function findActiveRun(ctx: MutationCtx) {
  const queued = await ctx.db
    .query("sourceSyncRuns")
    .withIndex("by_status_and_startedAt", (index) => index.eq("status", "queued"))
    .order("desc")
    .first();
  if (queued) return queued;

  return await ctx.db
    .query("sourceSyncRuns")
    .withIndex("by_status_and_startedAt", (index) => index.eq("status", "running"))
    .order("desc")
    .first();
}

async function createRun(
  ctx: MutationCtx,
  trigger: "manual" | "scheduled",
  requestedBy?: Id<"users">,
) {
  const runId = await ctx.db.insert("sourceSyncRuns", {
    trigger,
    status: "queued",
    requestedBy,
    startedAt: Date.now(),
    sourceCount: 0,
    baselineCount: 0,
    unchangedCount: 0,
    changedCount: 0,
    quarantinedCount: 0,
    failedCount: 0,
  });
  await ctx.scheduler.runAfter(0, internal.sourceSync.executeRun, { runId });
  return runId;
}

export const adminStartSync = mutation({
  args: {},
  returns: v.object({
    runId: v.id("sourceSyncRuns"),
    reusedActiveRun: v.boolean(),
  }),
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const activeRun = await findActiveRun(ctx);
    if (activeRun) {
      return { runId: activeRun._id, reusedActiveRun: true };
    }

    const runId = await createRun(ctx, "manual", admin._id);
    await writeAuditLog(ctx, {
      actorUserId: admin._id,
      actorAuthSubject: admin.authSubject,
      action: "official_source.sync_started",
      resourceType: "sourceSyncRun",
      resourceId: runId,
      result: "success",
      metadata: { trigger: "manual" },
    });
    return { runId, reusedActiveRun: false };
  },
});

export const startScheduledSync = internalMutation({
  args: {},
  returns: v.union(v.id("sourceSyncRuns"), v.null()),
  handler: async (ctx) => {
    const activeRun = await findActiveRun(ctx);
    if (activeRun) return null;
    return await createRun(ctx, "scheduled");
  },
});

export const markRunRunning = internalMutation({
  args: { runId: v.id("sourceSyncRuns") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run || run.status !== "queued") return null;
    await ctx.db.patch(run._id, { status: "running" });
    return null;
  },
});

export const getRunContext = internalQuery({
  args: { runId: v.id("sourceSyncRuns") },
  returns: v.union(
    v.object({
      runId: v.id("sourceSyncRuns"),
      resources: v.array(
        v.object({
          key: v.string(),
          title: v.string(),
          sourceUrl: v.string(),
        }),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run || !["queued", "running"].includes(run.status)) return null;

    const resources = await ctx.db
      .query("officialResources")
      .withIndex("by_isActive_and_order", (index) => index.eq("isActive", true))
      .order("asc")
      .take(50);

    return {
      runId: run._id,
      resources: resources.map((resource) => ({
        key: resource.key,
        title: resource.title,
        sourceUrl: resource.sourceUrl,
      })),
    };
  },
});

export const recordFetchResult = internalMutation({
  args: {
    runId: v.id("sourceSyncRuns"),
    sourceKey: v.string(),
    sourceUrl: v.string(),
    title: v.string(),
    contentHash: v.string(),
    normalizedText: v.string(),
    byteLength: v.number(),
    contentType: v.string(),
    httpStatus: v.number(),
    etag: v.optional(v.string()),
    lastModified: v.optional(v.string()),
    riskLevel: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical"),
    ),
    securityStatus: v.union(
      v.literal("clean"),
      v.literal("suspicious"),
      v.literal("quarantined"),
    ),
    findings: v.array(v.string()),
    securityReport: v.string(),
  },
  returns: itemStatusValidator,
  handler: async (ctx, args) => {
    const resource = await ctx.db
      .query("officialResources")
      .withIndex("by_key", (index) => index.eq("key", args.sourceKey))
      .unique();
    if (!resource || resource.sourceUrl !== args.sourceUrl) {
      throw new Error("SOURCE_REGISTRY_MISMATCH");
    }

    const now = Date.now();
    if (resource.lastContentHash === args.contentHash) {
      await ctx.db.patch(resource._id, {
        lastSyncAt: now,
        lastSyncStatus: "unchanged",
        lastHttpStatus: args.httpStatus,
        lastVerifiedAt: now,
        status: "verified",
      });
      await ctx.db.insert("sourceSyncItems", {
        runId: args.runId,
        sourceKey: args.sourceKey,
        sourceUrl: args.sourceUrl,
        status: "unchanged",
        httpStatus: args.httpStatus,
        snapshotId: resource.lastSnapshotId,
        message: "Content hash matches the last-known-good snapshot.",
        processedAt: now,
      });
      return "unchanged";
    }

    const existingSnapshot = await ctx.db
      .query("sourceSnapshots")
      .withIndex("by_sourceKey_and_contentHash", (index) =>
        index.eq("sourceKey", args.sourceKey).eq("contentHash", args.contentHash),
      )
      .first();

    let snapshotId = existingSnapshot?._id;
    if (!snapshotId) {
      snapshotId = await ctx.db.insert("sourceSnapshots", {
        runId: args.runId,
        sourceKey: args.sourceKey,
        sourceUrl: args.sourceUrl,
        contentHash: args.contentHash,
        normalizedText: args.normalizedText,
        byteLength: args.byteLength,
        contentType: args.contentType,
        httpStatus: args.httpStatus,
        etag: args.etag,
        lastModified: args.lastModified,
        fetchedAt: now,
        securityStatus: args.securityStatus,
        riskLevel: args.riskLevel,
        findings: args.findings,
        isLastKnownGood: false,
        previousSnapshotId: resource.lastSnapshotId,
      });
    }

    if (!resource.lastContentHash && args.securityStatus === "clean") {
      await ctx.db.patch(snapshotId, {
        isLastKnownGood: true,
        promotedAt: now,
      });
      await ctx.db.patch(resource._id, {
        lastContentHash: args.contentHash,
        lastSnapshotId: snapshotId,
        lastSyncAt: now,
        lastSyncStatus: "baseline",
        lastHttpStatus: args.httpStatus,
        lastVerifiedAt: now,
        status: "verified",
      });
      await ctx.db.insert("sourceSyncItems", {
        runId: args.runId,
        sourceKey: args.sourceKey,
        sourceUrl: args.sourceUrl,
        status: "baseline",
        httpStatus: args.httpStatus,
        snapshotId,
        message: "Initial clean baseline stored as last-known-good.",
        processedAt: now,
      });
      return "baseline";
    }

    const existingProposal = await ctx.db
      .query("sourceChangeProposals")
      .withIndex("by_sourceKey_and_contentHash", (index) =>
        index.eq("sourceKey", args.sourceKey).eq("contentHash", args.contentHash),
      )
      .first();

    const previousSnapshot = resource.lastSnapshotId
      ? await ctx.db.get(resource.lastSnapshotId)
      : null;
    const change = summarizeTextChange(
      previousSnapshot?.normalizedText ?? "",
      args.normalizedText,
    );
    const proposalStatus =
      args.securityStatus === "quarantined" ? "quarantined" : "pending";

    let proposalId = existingProposal?._id;
    if (!proposalId || !["pending", "quarantined"].includes(existingProposal.status)) {
      proposalId = await ctx.db.insert("sourceChangeProposals", {
        sourceKey: args.sourceKey,
        sourceUrl: args.sourceUrl,
        title: args.title || resource.title,
        summary: change.diffSummary,
        riskLevel: args.riskLevel,
        securityReport: args.securityReport,
        contentHash: args.contentHash,
        status: proposalStatus,
        detectedAt: now,
        snapshotId,
        previousSnapshotId: resource.lastSnapshotId,
        sourceSyncRunId: args.runId,
        diffSummary: change.diffSummary,
        changeKinds: change.changeKinds,
        scanFindings: args.findings,
      });
    }

    await ctx.db.patch(resource._id, {
      lastSyncAt: now,
      lastSyncStatus:
        proposalStatus === "quarantined" ? "quarantined" : "pending-review",
      lastHttpStatus: args.httpStatus,
      status: "pending-review",
    });

    const itemStatus = proposalStatus === "quarantined" ? "quarantined" : "proposal";
    await ctx.db.insert("sourceSyncItems", {
      runId: args.runId,
      sourceKey: args.sourceKey,
      sourceUrl: args.sourceUrl,
      status: itemStatus,
      httpStatus: args.httpStatus,
      snapshotId,
      proposalId,
      message: change.diffSummary,
      processedAt: now,
    });
    return itemStatus;
  },
});

export const recordFetchFailure = internalMutation({
  args: {
    runId: v.id("sourceSyncRuns"),
    sourceKey: v.string(),
    sourceUrl: v.string(),
    message: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const message = args.message.replace(/\s+/g, " ").trim().slice(0, 300);
    const now = Date.now();
    const resource = await ctx.db
      .query("officialResources")
      .withIndex("by_key", (index) => index.eq("key", args.sourceKey))
      .first();
    if (resource) {
      await ctx.db.patch(resource._id, {
        lastSyncAt: now,
        lastSyncStatus: "failed",
      });
    }
    await ctx.db.insert("sourceSyncItems", {
      runId: args.runId,
      sourceKey: args.sourceKey,
      sourceUrl: args.sourceUrl,
      status: "failed",
      message,
      processedAt: now,
    });
    return null;
  },
});

export const completeRun = internalMutation({
  args: {
    runId: v.id("sourceSyncRuns"),
    sourceCount: v.number(),
    baselineCount: v.number(),
    unchangedCount: v.number(),
    changedCount: v.number(),
    quarantinedCount: v.number(),
    failedCount: v.number(),
    errorSummary: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) return null;
    const status =
      args.failedCount === args.sourceCount && args.sourceCount > 0
        ? "failed"
        : args.failedCount > 0 || args.quarantinedCount > 0
          ? "partial"
          : "completed";
    await ctx.db.patch(run._id, {
      status,
      completedAt: Date.now(),
      sourceCount: args.sourceCount,
      baselineCount: args.baselineCount,
      unchangedCount: args.unchangedCount,
      changedCount: args.changedCount,
      quarantinedCount: args.quarantinedCount,
      failedCount: args.failedCount,
      errorSummary: args.errorSummary?.slice(0, 1000),
    });
    return null;
  },
});

export const executeRun = internalAction({
  args: { runId: v.id("sourceSyncRuns") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.sourceSync.markRunRunning, { runId: args.runId });
    const context = await ctx.runQuery(internal.sourceSync.getRunContext, {
      runId: args.runId,
    });
    if (!context) return null;

    let baselineCount = 0;
    let unchangedCount = 0;
    let changedCount = 0;
    let quarantinedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const resource of context.resources) {
      try {
        const result = await fetchOfficialSource(resource.sourceUrl);
        const status = await ctx.runMutation(internal.sourceSync.recordFetchResult, {
          runId: args.runId,
          sourceKey: resource.key,
          sourceUrl: resource.sourceUrl,
          title: result.title || resource.title,
          contentHash: result.contentHash,
          normalizedText: result.normalizedText,
          byteLength: result.byteLength,
          contentType: result.contentType,
          httpStatus: result.httpStatus,
          etag: result.etag,
          lastModified: result.lastModified,
          riskLevel: result.riskLevel,
          securityStatus: result.securityStatus,
          findings: result.findings,
          securityReport: result.securityReport,
        });
        if (status === "baseline") baselineCount += 1;
        else if (status === "unchanged") unchangedCount += 1;
        else if (status === "quarantined") quarantinedCount += 1;
        else changedCount += 1;
      } catch (error) {
        failedCount += 1;
        const message = error instanceof Error ? error.message : "SOURCE_SYNC_UNKNOWN_ERROR";
        errors.push(`${resource.key}:${message}`);
        await ctx.runMutation(internal.sourceSync.recordFetchFailure, {
          runId: args.runId,
          sourceKey: resource.key,
          sourceUrl: resource.sourceUrl,
          message,
        });
      }
    }

    await ctx.runMutation(internal.sourceSync.completeRun, {
      runId: args.runId,
      sourceCount: context.resources.length,
      baselineCount,
      unchangedCount,
      changedCount,
      quarantinedCount,
      failedCount,
      errorSummary: errors.length > 0 ? errors.join("; ") : undefined,
    });
    return null;
  },
});

export const adminListRuns = query({
  args: { limit: v.number() },
  returns: v.array(runValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > 50) {
      throw new Error("INVALID_LIMIT");
    }
    const runs = await ctx.db
      .query("sourceSyncRuns")
      .withIndex("by_startedAt")
      .order("desc")
      .take(args.limit);
    return runs.map(toPublicRun);
  },
});

export const adminGetRunItems = query({
  args: { runId: v.id("sourceSyncRuns"), limit: v.number() },
  returns: v.array(itemValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > 100) {
      throw new Error("INVALID_LIMIT");
    }
    const items = await ctx.db
      .query("sourceSyncItems")
      .withIndex("by_runId_and_processedAt", (index) =>
        index.eq("runId", args.runId),
      )
      .order("desc")
      .take(args.limit);
    return items.map((item) => ({
      id: item._id,
      runId: item.runId,
      sourceKey: item.sourceKey,
      sourceUrl: item.sourceUrl,
      status: item.status,
      httpStatus: item.httpStatus,
      snapshotId: item.snapshotId,
      proposalId: item.proposalId,
      message: item.message,
      processedAt: item.processedAt,
    }));
  },
});
