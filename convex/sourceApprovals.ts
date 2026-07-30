import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
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
});

function toPublicProposal(proposal: {
  _id: any;
  sourceKey: string;
  sourceUrl: string;
  title: string;
  summary: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  securityReport: string;
  contentHash: string;
  status: "pending" | "approved" | "rejected" | "quarantined";
  detectedAt: number;
  reviewedAt?: number;
  reviewedBy?: any;
  reviewNote?: string;
}) {
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
  };
}

export const internalCreateProposal = internalMutation({
  args: {
    sourceKey: v.string(),
    sourceUrl: v.string(),
    title: v.string(),
    summary: v.string(),
    riskLevel: riskValidator,
    securityReport: v.string(),
    contentHash: v.string(),
    quarantined: v.boolean(),
  },
  returns: v.id("sourceChangeProposals"),
  handler: async (ctx, args) => {
    if (!args.sourceUrl.startsWith("https://inbr.ir/")) {
      throw new Error("SOURCE_DOMAIN_NOT_ALLOWED");
    }

    return await ctx.db.insert("sourceChangeProposals", {
      sourceKey: args.sourceKey,
      sourceUrl: args.sourceUrl,
      title: args.title,
      summary: args.summary,
      riskLevel: args.riskLevel,
      securityReport: args.securityReport,
      contentHash: args.contentHash,
      status: args.quarantined ? "quarantined" : "pending",
      detectedAt: Date.now(),
    });
  },
});

export const adminListPending = query({
  args: { limit: v.number() },
  returns: v.array(proposalValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > 100) {
      throw new Error("INVALID_LIMIT");
    }

    const proposals = await ctx.db
      .query("sourceChangeProposals")
      .withIndex("by_status_and_detectedAt", (index) =>
        index.eq("status", "pending"),
      )
      .order("desc")
      .take(args.limit);

    return proposals.map(toPublicProposal);
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
    const note = args.note.replace(/\s+/g, " ").trim();

    if (!proposal) throw new Error("PROPOSAL_NOT_FOUND");
    if (proposal.status !== "pending") throw new Error("PROPOSAL_NOT_PENDING");
    if (note.length < 3 || note.length > 1000) {
      throw new Error("INVALID_REVIEW_NOTE");
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
      },
    });

    return toPublicProposal((await ctx.db.get(proposal._id))!);
  },
});
