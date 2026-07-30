import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
});
