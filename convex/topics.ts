import { v } from "convex/values";
import type {
  DataModelFromSchemaDefinition,
  DocumentByName,
  QueryBuilder,
} from "convex/server";
import { query } from "./_generated/server";
import schema from "./schema";

type TopicsDataModel = DataModelFromSchemaDefinition<typeof schema>;
type TopicDocument = DocumentByName<TopicsDataModel, "topics">;
const topicQuery = query as unknown as QueryBuilder<TopicsDataModel, "public">;

export const publicTopicValidator = v.object({
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
});

export type PublicTopic = {
  code: number;
  slug: string;
  title: string;
  shortTitle: string;
  discipline: "civil";
  qualification: "supervision" | "execution" | "calculation" | "general";
  order: number;
  description: string;
  questionCount: number;
  resourceCount: number;
  isActive: boolean;
  latestEdition?: string;
  sourcePublisher?: string;
  sourceDomain?: string;
  officialPageUrl?: string;
  officialDocumentUrl?: string;
  sourceStatus?: "verified" | "pending-review" | "outdated";
  lastVerifiedAt?: number;
};

export function toPublicTopic(topic: TopicDocument): PublicTopic {
  return {
    code: topic.code,
    slug: topic.slug,
    title: topic.title,
    shortTitle: topic.shortTitle,
    discipline: topic.discipline,
    qualification: topic.qualification,
    order: topic.order,
    description: topic.description,
    questionCount: topic.questionCount,
    resourceCount: topic.resourceCount,
    isActive: topic.isActive,
    ...(topic.latestEdition === undefined
      ? {}
      : { latestEdition: topic.latestEdition }),
    ...(topic.sourcePublisher === undefined
      ? {}
      : { sourcePublisher: topic.sourcePublisher }),
    ...(topic.sourceDomain === undefined
      ? {}
      : { sourceDomain: topic.sourceDomain }),
    ...(topic.officialPageUrl === undefined
      ? {}
      : { officialPageUrl: topic.officialPageUrl }),
    ...(topic.officialDocumentUrl === undefined
      ? {}
      : { officialDocumentUrl: topic.officialDocumentUrl }),
    ...(topic.sourceStatus === undefined
      ? {}
      : { sourceStatus: topic.sourceStatus }),
    ...(topic.lastVerifiedAt === undefined
      ? {}
      : { lastVerifiedAt: topic.lastVerifiedAt }),
  };
}

export const listActive = topicQuery({
  args: {},
  returns: v.array(publicTopicValidator),
  handler: async (ctx) => {
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_isActive_and_order", (q) => q.eq("isActive", true))
      .order("asc")
      .take(50);

    return topics.map(toPublicTopic);
  },
});

export const getByCode = topicQuery({
  args: {
    code: v.number(),
  },
  returns: v.union(publicTopicValidator, v.null()),
  handler: async (ctx, args) => {
    const topic = await ctx.db
      .query("topics")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    return topic === null ? null : toPublicTopic(topic);
  },
});

export const getBySlug = topicQuery({
  args: {
    slug: v.string(),
  },
  returns: v.union(publicTopicValidator, v.null()),
  handler: async (ctx, args) => {
    const topic = await ctx.db
      .query("topics")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    return topic === null ? null : toPublicTopic(topic);
  },
});
