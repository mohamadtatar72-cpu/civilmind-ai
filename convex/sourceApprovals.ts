import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { writeAuditLog } from "./lib/audit";
import { requireAdmin } from "./lib/auth";

const riskValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical"),
);

const statusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("quarantined"),
);

const proposalValidator = v.object({
  id: v.id("sourceChangeProposals"),
  sourceKey: v.string(),
  sourceUrl: v.string(),
  title: v.string(),
  summary: v.string(),
  riskLevel: riskValidator,
  securityReport: v.string(),
  contentHash: v.string(),
  status: statusValidator,
  detectedAt: v.number(),
  reviewedAt: v.optional(v.number()),
  reviewedBy: v.optional(v.id("users")),
  reviewNote: v.optional(v.string()),
  snapshotId: v.optional(v.id("sourceSnapshots")),
  previousSnapshotId: v.optional(v.id("sourceSnapshots")),
  sourceSyncRunId: v.optional(v.id("sourceSyncRuns")),
  diffSummary: v.optional(v.string()),
  changeKinds: v.optional(v.array(v.string())),
  scanFindings: v.optional(v.array(v.string())),
});

const snapshotValidator = v.object({
  id: v.id("sourceSnapshots"),
  sourceKey: v.string(),
  sourceUrl: v.string(),
  contentHash: v.string(),
  byteLength: v.number(),
  contentType: v.string(),
  httpStatus: v.number(),
  fetchedAt: v.number(),
  securityStatus: v.union(
    v.literal("clean"),
    v.literal("suspicious"),
    v.literal("quarantined"),
  ),
  riskLevel: riskValidator,
  findings: v.array(v.string()),
  isLastKnownGood: v.boolean(),
  previousSnapshotId: v.optional(v.id("sourceSnapshots")),
  promotedAt: v.optional(v.number()),
  promotedBy: v.optional(v.id("users")),
});

const appendixValidator = v.object({
  id: v.id("sourceAppendices"),
  sourceKey: v.string(),
  sourceUrl: v.string(),
  title: v.string(),
  snapshotId: v.id("sourceSnapshots"),
  proposalId: v.id("sourceChangeProposals"),
  contentHash: v.string(),
  content: v.string(),
  summary: v.string(),
  appendedAt: v.number(),
});

function toPublicProposal(proposal: Doc<"sourceChangeProposals">) {
  return {
    id: proposal._id,
    sourceKey: proposal.sourceKey,
    sourceUrl: proposal.sourceUrl,
    title: proposal.title,
    summary: proposal.summary,
    riskLevel: proposal.riskLevel,
    securityReport: proposal.securityReport,
    contentHash: proposal.contentHash,
    status: proposal.status,
    detectedAt: proposal.detectedAt,
    reviewedAt: proposal.reviewedAt,
    reviewedBy: proposal.reviewedBy,
    reviewNote: proposal.reviewNote,
    snapshotId: proposal.snapshotId,
    previousSnapshotId: proposal.previousSnapshotId,
    sourceSyncRunId: proposal.sourceSyncRunId,
    diffSummary: proposal.diffSummary,
    changeKinds: proposal.changeKinds,
    scanFindings: proposal.scanFindings,
  };
}

function toPublicSnapshot(snapshot: Doc<"sourceSnapshots">) {
  return {
    id: snapshot._id,
    sourceKey: snapshot.sourceKey,
    sourceUrl: snapshot.sourceUrl,
    contentHash: snapshot.contentHash,
    byteLength: snapshot.byteLength,
    contentType: snapshot.contentType,
    httpStatus: snapshot.httpStatus,
    fetchedAt: snapshot.fetchedAt,
    securityStatus: snapshot.securityStatus,
    riskLevel: snapshot.riskLevel,
    findings: snapshot.findings,
    isLastKnownGood: snapshot.isLastKnownGood,
    previousSnapshotId: snapshot.previousSnapshotId,
    promotedAt: snapshot.promotedAt,
    promotedBy: snapshot.promotedBy,
  };
}

function normalizeNote(value: string) {
  const note = value.replace(/\s+/g, " ").trim();
  if (note.length < 3 || note.length > 1000) {
    throw new Error("INVALID_REVIEW_NOTE");
  }
  return note;
}

function toPublicAppendix(appendix: Doc<"sourceAppendices">) {
  return {
    id: appendix._id,
    sourceKey: appendix.sourceKey,
    sourceUrl: appendix.sourceUrl,
    title: appendix.title,
    snapshotId: appendix.snapshotId,
    proposalId: appendix.proposalId,
    contentHash: appendix.contentHash,
    content: appendix.content,
    summary: appendix.summary,
    appendedAt: appendix.appendedAt,
  };
}

export const adminListReviewQueue = query({
  args: { limit: v.number() },
  returns: v.array(proposalValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > 100) {
      throw new Error("INVALID_LIMIT");
    }

    const [pending, quarantined] = await Promise.all([
      ctx.db
        .query("sourceChangeProposals")
        .withIndex("by_status_and_detectedAt", (index) =>
          index.eq("status", "pending"),
        )
        .order("desc")
        .take(args.limit),
      ctx.db
        .query("sourceChangeProposals")
        .withIndex("by_status_and_detectedAt", (index) =>
          index.eq("status", "quarantined"),
        )
        .order("desc")
        .take(args.limit),
    ]);

    return [...pending, ...quarantined]
      .sort((left, right) => right.detectedAt - left.detectedAt)
      .slice(0, args.limit)
      .map(toPublicProposal);
  },
});

export const adminReview = mutation({
  args: {
    proposalId: v.id("sourceChangeProposals"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
    note: v.string(),
  },
  returns: proposalValidator,
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const proposal = await ctx.db.get(args.proposalId);
    const note = normalizeNote(args.note);

    if (!proposal) throw new Error("PROPOSAL_NOT_FOUND");
    if (!["pending", "quarantined"].includes(proposal.status)) {
      throw new Error("PROPOSAL_NOT_REVIEWABLE");
    }

    const resource = await ctx.db
      .query("officialResources")
      .withIndex("by_key", (index) => index.eq("key", proposal.sourceKey))
      .unique();
    if (!resource) throw new Error("SOURCE_RESOURCE_NOT_FOUND");

    if (args.decision === "approved") {
      if (proposal.status === "quarantined") {
        await writeAuditLog(ctx, {
          actorUserId: admin._id,
          actorAuthSubject: admin.authSubject,
          action: "official_source.approval_denied",
          resourceType: "sourceChangeProposal",
          resourceId: proposal._id,
          result: "denied",
          metadata: { reason: "quarantined_snapshot" },
        });
        throw new Error("QUARANTINED_PROPOSAL_CANNOT_BE_APPROVED");
      }
      if (!proposal.snapshotId) throw new Error("PROPOSAL_SNAPSHOT_MISSING");
      const snapshot = await ctx.db.get(proposal.snapshotId);
      if (!snapshot || snapshot.sourceKey !== proposal.sourceKey) {
        throw new Error("PROPOSAL_SNAPSHOT_INVALID");
      }
      if (snapshot.securityStatus === "quarantined") {
        throw new Error("QUARANTINED_SNAPSHOT_CANNOT_BE_PROMOTED");
      }

      if (resource.lastSnapshotId && resource.lastSnapshotId !== snapshot._id) {
        const currentSnapshot = await ctx.db.get(resource.lastSnapshotId);
        if (currentSnapshot) {
          await ctx.db.patch(currentSnapshot._id, { isLastKnownGood: false });
        }
      }

      const now = Date.now();
      await ctx.db.patch(snapshot._id, {
        isLastKnownGood: true,
        promotedAt: now,
        promotedBy: admin._id,
      });
      await ctx.db.patch(resource._id, {
        lastContentHash: snapshot.contentHash,
        lastSnapshotId: snapshot._id,
        lastVerifiedAt: now,
        lastSyncAt: now,
        lastSyncStatus: "unchanged",
        lastHttpStatus: snapshot.httpStatus,
        status: "verified",
      });

      const existingAppendix = await ctx.db
        .query("sourceAppendices")
        .withIndex("by_snapshotId", (index) => index.eq("snapshotId", snapshot._id))
        .unique();
      if (!existingAppendix) {
        await ctx.db.insert("sourceAppendices", {
          sourceKey: proposal.sourceKey,
          sourceUrl: proposal.sourceUrl,
          title: proposal.title,
          snapshotId: snapshot._id,
          proposalId: proposal._id,
          contentHash: snapshot.contentHash,
          content: snapshot.normalizedText,
          summary: proposal.diffSummary ?? proposal.summary,
          appendedAt: now,
          appendedBy: admin._id,
        });
      }
    } else {
      await ctx.db.patch(resource._id, {
        status: resource.lastContentHash ? "verified" : "outdated",
        lastSyncStatus: resource.lastContentHash ? "unchanged" : "failed",
      });
    }

    await ctx.db.patch(proposal._id, {
      status: args.decision,
      reviewedAt: Date.now(),
      reviewedBy: admin._id,
      reviewNote: note,
    });

    await writeAuditLog(ctx, {
      actorUserId: admin._id,
      actorAuthSubject: admin.authSubject,
      action: `official_source.${args.decision}`,
      resourceType: "sourceChangeProposal",
      resourceId: proposal._id,
      result: "success",
      metadata: {
        sourceKey: proposal.sourceKey,
        riskLevel: proposal.riskLevel,
        ...(proposal.snapshotId === undefined
          ? {}
          : { snapshotId: proposal.snapshotId }),
        note,
      },
    });

    return toPublicProposal((await ctx.db.get(proposal._id))!);
  },
});

export const adminListSnapshots = query({
  args: { sourceKey: v.string(), limit: v.number() },
  returns: v.array(snapshotValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > 50) {
      throw new Error("INVALID_LIMIT");
    }
    const snapshots = await ctx.db
      .query("sourceSnapshots")
      .withIndex("by_sourceKey_and_fetchedAt", (index) =>
        index.eq("sourceKey", args.sourceKey),
      )
      .order("desc")
      .take(args.limit);
    return snapshots.map(toPublicSnapshot);
  },
});

export const listApprovedAppendices = query({
  args: { sourceKey: v.string(), limit: v.optional(v.number()) },
  returns: v.array(appendixValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      throw new Error("INVALID_LIMIT");
    }
    const sourceKey = args.sourceKey.replace(/\s+/g, " ").trim();
    if (sourceKey.length < 2 || sourceKey.length > 120) {
      throw new Error("INVALID_SOURCE_KEY");
    }
    const appendices = await ctx.db
      .query("sourceAppendices")
      .withIndex("by_sourceKey_and_appendedAt", (index) =>
        index.eq("sourceKey", sourceKey),
      )
      .order("desc")
      .take(limit);
    return appendices.map(toPublicAppendix);
  },
});

export const adminRollbackResource = mutation({
  args: {
    sourceKey: v.string(),
    snapshotId: v.id("sourceSnapshots"),
    note: v.string(),
  },
  returns: snapshotValidator,
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const note = normalizeNote(args.note);
    const resource = await ctx.db
      .query("officialResources")
      .withIndex("by_key", (index) => index.eq("key", args.sourceKey))
      .unique();
    const snapshot = await ctx.db.get(args.snapshotId);

    if (!resource || !snapshot || snapshot.sourceKey !== args.sourceKey) {
      throw new Error("ROLLBACK_SNAPSHOT_INVALID");
    }
    if (snapshot.securityStatus !== "clean") {
      throw new Error("ROLLBACK_REQUIRES_CLEAN_SNAPSHOT");
    }

    if (resource.lastSnapshotId && resource.lastSnapshotId !== snapshot._id) {
      const currentSnapshot = await ctx.db.get(resource.lastSnapshotId);
      if (currentSnapshot) {
        await ctx.db.patch(currentSnapshot._id, { isLastKnownGood: false });
      }
    }

    const previousSnapshotId = resource.lastSnapshotId;
    const now = Date.now();
    await ctx.db.patch(snapshot._id, {
      isLastKnownGood: true,
      promotedAt: now,
      promotedBy: admin._id,
    });
    await ctx.db.patch(resource._id, {
      lastContentHash: snapshot.contentHash,
      lastSnapshotId: snapshot._id,
      lastVerifiedAt: now,
      lastSyncAt: now,
      lastSyncStatus: "unchanged",
      lastHttpStatus: snapshot.httpStatus,
      status: "verified",
    });

    await writeAuditLog(ctx, {
      actorUserId: admin._id,
      actorAuthSubject: admin.authSubject,
      action: "official_source.rollback",
      resourceType: "officialResource",
      resourceId: resource._id,
      result: "success",
      metadata: {
        sourceKey: args.sourceKey,
        snapshotId: snapshot._id,
        ...(previousSnapshotId === undefined
          ? {}
          : { previousSnapshotId }),
        note,
      },
    });

    return toPublicSnapshot((await ctx.db.get(snapshot._id))!);
  },
});
