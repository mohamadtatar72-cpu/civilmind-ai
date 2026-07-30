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

  sourceChangeProposals: defineTable({
    sourceKey: v.string(),
    sourceUrl: v.string(),
    title: v.string(),
    summary: v.string(),
    riskLevel: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical"),
    ),
    securityReport: v.string(),
    contentHash: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("quarantined"),
    ),
    detectedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
    reviewNote: v.optional(v.string()),
  })
    .index("by_status_and_detectedAt", ["status", "detectedAt"])
    .index("by_sourceKey_and_detectedAt", ["sourceKey", "detectedAt"]),
});
