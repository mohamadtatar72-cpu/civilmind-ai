import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const userRole = v.union(
  v.literal("free"),
  v.literal("premium"),
  v.literal("admin"),
);

const userStatus = v.union(
  v.literal("active"),
  v.literal("suspended"),
  v.literal("deleted"),
);

const subscriptionStatus = v.union(
  v.literal("active"),
  v.literal("trialing"),
  v.literal("past_due"),
  v.literal("canceled"),
  v.literal("expired"),
);

const sourceRisk = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical"),
);

const sourceProposalStatus = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("quarantined"),
);

const sourceSecurityStatus = v.union(
  v.literal("clean"),
  v.literal("suspicious"),
  v.literal("quarantined"),
);

const sourceSyncStatus = v.union(
  v.literal("baseline"),
  v.literal("unchanged"),
  v.literal("pending-review"),
  v.literal("quarantined"),
  v.literal("failed"),
);

export default defineSchema({
  topics: defineTable({
    code: v.number(),
    slug: v.string(),
    title: v.string(),
    shortTitle: v.string(),
    discipline: v.literal("civil"),
    qualification: v.union(
      v.literal("supervision"),
      v.literal("execution"),
      v.literal("calculation"),
      v.literal("general"),
    ),
    order: v.number(),
    description: v.string(),
    questionCount: v.number(),
    resourceCount: v.number(),
    isActive: v.boolean(),
    latestEdition: v.optional(v.string()),
    sourcePublisher: v.optional(v.string()),
    sourceDomain: v.optional(v.string()),
    officialPageUrl: v.optional(v.string()),
    officialDocumentUrl: v.optional(v.string()),
    sourceStatus: v.optional(
      v.union(
        v.literal("verified"),
        v.literal("pending-review"),
        v.literal("outdated"),
      ),
    ),
    lastVerifiedAt: v.optional(v.number()),
  })
    .index("by_code", ["code"])
    .index("by_slug", ["slug"])
    .index("by_isActive_and_order", ["isActive", "order"])
    .index("by_discipline_and_qualification", [
      "discipline",
      "qualification",
    ]),

  officialResources: defineTable({
    key: v.string(),
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("official-home"),
      v.literal("exam-center"),
      v.literal("exam-materials"),
      v.literal("past-exams"),
      v.literal("answer-guides"),
      v.literal("regulations"),
      v.literal("corrections"),
      v.literal("exam-notice"),
    ),
    sourcePublisher: v.string(),
    sourceDomain: v.string(),
    sourceUrl: v.string(),
    status: v.union(
      v.literal("verified"),
      v.literal("pending-review"),
      v.literal("outdated"),
    ),
    isActive: v.boolean(),
    order: v.number(),
    lastVerifiedAt: v.optional(v.number()),
    lastContentHash: v.optional(v.string()),
    lastSnapshotId: v.optional(v.id("sourceSnapshots")),
    lastSyncAt: v.optional(v.number()),
    lastSyncStatus: v.optional(sourceSyncStatus),
    lastHttpStatus: v.optional(v.number()),
  })
    .index("by_key", ["key"])
    .index("by_category_and_isActive", ["category", "isActive"])
    .index("by_isActive_and_order", ["isActive", "order"])
    .index("by_status", ["status"]),

  users: defineTable({
    authSubject: v.string(),
    email: v.optional(v.string()),
    displayName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    role: userRole,
    status: userStatus,
    onboardingCompleted: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastSeenAt: v.optional(v.number()),
  })
    .index("by_authSubject", ["authSubject"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_status", ["status"])
    .index("by_role_and_status", ["role", "status"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    plan: v.union(v.literal("free"), v.literal("premium")),
    status: subscriptionStatus,
    provider: v.optional(v.string()),
    externalCustomerId: v.optional(v.string()),
    externalSubscriptionId: v.optional(v.string()),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_plan_and_status", ["plan", "status"])
    .index("by_externalSubscriptionId", ["externalSubscriptionId"]),

  auditLogs: defineTable({
    actorUserId: v.optional(v.id("users")),
    actorAuthSubject: v.optional(v.string()),
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.optional(v.string()),
    result: v.union(
      v.literal("success"),
      v.literal("denied"),
      v.literal("failure"),
    ),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_actorUserId_and_createdAt", ["actorUserId", "createdAt"])
    .index("by_action_and_createdAt", ["action", "createdAt"])
    .index("by_resourceType_and_createdAt", ["resourceType", "createdAt"])
    .index("by_createdAt", ["createdAt"]),

  sourceSyncRuns: defineTable({
    trigger: v.union(v.literal("manual"), v.literal("scheduled")),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("partial"),
      v.literal("failed"),
    ),
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
  })
    .index("by_status_and_startedAt", ["status", "startedAt"])
    .index("by_startedAt", ["startedAt"]),

  sourceSnapshots: defineTable({
    runId: v.id("sourceSyncRuns"),
    sourceKey: v.string(),
    sourceUrl: v.string(),
    contentHash: v.string(),
    normalizedText: v.string(),
    byteLength: v.number(),
    contentType: v.string(),
    httpStatus: v.number(),
    etag: v.optional(v.string()),
    lastModified: v.optional(v.string()),
    fetchedAt: v.number(),
    securityStatus: sourceSecurityStatus,
    riskLevel: sourceRisk,
    findings: v.array(v.string()),
    isLastKnownGood: v.boolean(),
    previousSnapshotId: v.optional(v.id("sourceSnapshots")),
    promotedAt: v.optional(v.number()),
    promotedBy: v.optional(v.id("users")),
  })
    .index("by_sourceKey_and_fetchedAt", ["sourceKey", "fetchedAt"])
    .index("by_sourceKey_and_contentHash", ["sourceKey", "contentHash"])
    .index("by_sourceKey_and_isLastKnownGood", [
      "sourceKey",
      "isLastKnownGood",
    ]),

  sourceSyncItems: defineTable({
    runId: v.id("sourceSyncRuns"),
    sourceKey: v.string(),
    sourceUrl: v.string(),
    status: v.union(
      v.literal("baseline"),
      v.literal("unchanged"),
      v.literal("proposal"),
      v.literal("quarantined"),
      v.literal("failed"),
    ),
    httpStatus: v.optional(v.number()),
    snapshotId: v.optional(v.id("sourceSnapshots")),
    proposalId: v.optional(v.id("sourceChangeProposals")),
    message: v.optional(v.string()),
    processedAt: v.number(),
  })
    .index("by_runId_and_processedAt", ["runId", "processedAt"])
    .index("by_sourceKey_and_processedAt", ["sourceKey", "processedAt"]),

  sourceChangeProposals: defineTable({
    sourceKey: v.string(),
    sourceUrl: v.string(),
    title: v.string(),
    summary: v.string(),
    riskLevel: sourceRisk,
    securityReport: v.string(),
    contentHash: v.string(),
    status: sourceProposalStatus,
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
  })
    .index("by_status_and_detectedAt", ["status", "detectedAt"])
    .index("by_sourceKey_and_detectedAt", ["sourceKey", "detectedAt"])
    .index("by_sourceKey_and_contentHash", ["sourceKey", "contentHash"]),
});
