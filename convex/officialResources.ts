import { v } from "convex/values";
import type {
  DataModelFromSchemaDefinition,
  DocumentByName,
  QueryBuilder,
} from "convex/server";
import { query } from "./_generated/server";
import schema from "./schema";

const categoryValidator = v.union(
  v.literal("official-home"),
  v.literal("exam-center"),
  v.literal("exam-materials"),
  v.literal("past-exams"),
  v.literal("answer-guides"),
  v.literal("regulations"),
  v.literal("corrections"),
  v.literal("exam-notice"),
);

export const publicOfficialResourceValidator = v.object({
  key: v.string(),
  title: v.string(),
  description: v.string(),
  category: categoryValidator,
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
});

type OfficialResourcesDataModel = DataModelFromSchemaDefinition<typeof schema>;
type OfficialResourceDocument = DocumentByName<
  OfficialResourcesDataModel,
  "officialResources"
>;
const officialResourceQuery = query as unknown as QueryBuilder<
  OfficialResourcesDataModel,
  "public"
>;

function toPublicOfficialResource(resource: OfficialResourceDocument) {
  return {
    key: resource.key,
    title: resource.title,
    description: resource.description,
    category: resource.category,
    sourcePublisher: resource.sourcePublisher,
    sourceDomain: resource.sourceDomain,
    sourceUrl: resource.sourceUrl,
    status: resource.status,
    isActive: resource.isActive,
    order: resource.order,
    ...(resource.lastVerifiedAt === undefined
      ? {}
      : { lastVerifiedAt: resource.lastVerifiedAt }),
  };
}

export const listActive = officialResourceQuery({
  args: {},
  returns: v.array(publicOfficialResourceValidator),
  handler: async (ctx) => {
    const resources = await ctx.db
      .query("officialResources")
      .withIndex("by_isActive_and_order", (q) => q.eq("isActive", true))
      .order("asc")
      .take(50);
    return resources.map(toPublicOfficialResource);
  },
});

export const listByCategory = officialResourceQuery({
  args: { category: categoryValidator },
  returns: v.array(publicOfficialResourceValidator),
  handler: async (ctx, args) => {
    const resources = await ctx.db
      .query("officialResources")
      .withIndex("by_category_and_isActive", (q) =>
        q.eq("category", args.category).eq("isActive", true),
      )
      .take(50);
    return resources.map(toPublicOfficialResource);
  },
});

export const getByKey = officialResourceQuery({
  args: { key: v.string() },
  returns: v.union(publicOfficialResourceValidator, v.null()),
  handler: async (ctx, args) => {
    const resource = await ctx.db
      .query("officialResources")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    return resource === null ? null : toPublicOfficialResource(resource);
  },
});
