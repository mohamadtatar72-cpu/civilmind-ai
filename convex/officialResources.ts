import { v } from "convex/values";
import type {
  DataModelFromSchemaDefinition,
  DocumentByName,
  QueryBuilder,
} from "convex/server";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
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

const syncStatusValidator = v.union(
  v.literal("baseline"),
  v.literal("unchanged"),
  v.literal("pending-review"),
  v.literal("quarantined"),
  v.literal("failed"),
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
  lastSyncAt: v.optional(v.number()),
  lastSyncStatus: v.optional(syncStatusValidator),
  lastHttpStatus: v.optional(v.number()),
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
    ...(resource.lastSyncAt === undefined
      ? {}
      : { lastSyncAt: resource.lastSyncAt }),
    ...(resource.lastSyncStatus === undefined
      ? {}
      : { lastSyncStatus: resource.lastSyncStatus }),
    ...(resource.lastHttpStatus === undefined
      ? {}
      : { lastHttpStatus: resource.lastHttpStatus }),
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


const officialCatalog = [
  {
    key: "inbr-home",
    title: "پایگاه رسمی دفتر مقررات ملی و کنترل ساختمان",
    description: "مرجع اصلی انتشار مقررات، اطلاعیه‌ها و خدمات آزمون‌های ورود به حرفه.",
    category: "official-home" as const,
    sourceUrl: "https://inbr.ir/",
    order: 10,
  },
  {
    key: "inbr-exam-portal",
    title: "سامانه آزمون‌های ورود به حرفه مهندسان",
    description: "درگاه رسمی مواد آزمون، نمونه‌سؤال‌ها، پاسخنامه‌ها و راهنمای شرکت در آزمون.",
    category: "exam-center" as const,
    sourceUrl: "https://inbr.ir/سامانه-آزمون-های-ورود-به-حرفه-مهندسان/",
    order: 20,
  },
  {
    key: "inbr-exam-materials",
    title: "مواد آزمون و نمونه‌سؤال‌های رسمی",
    description: "مسیر رسمی دسترسی به مواد آزمون و دفترچه‌های منتشرشده برای رشته‌ها و صلاحیت‌های مختلف.",
    category: "exam-materials" as const,
    sourceUrl: "https://inbr.ir/مواد-آزمون-مهندسی-ساختمان/",
    order: 30,
  },
  {
    key: "inbr-past-exams",
    title: "آرشیو نمونه‌سؤال‌های آزمون مهندسی",
    description: "آرشیو رسمی دوره‌های آزمون؛ هر دوره پس از تأیید، به‌تفکیک دفترچه و صلاحیت در CivilMind ثبت می‌شود.",
    category: "past-exams" as const,
    sourceUrl: "https://inbr.ir/سامانه-آزمون-های-ورود-به-حرفه-مهندسان/نمونه-سوالات/",
    order: 40,
  },
  {
    key: "inbr-answer-guides",
    title: "پاسخنامه و راهنمای تشریحی رسمی",
    description: "دسترسی به پاسخنامه‌ها و راهنماهای تشریحی منتشرشده توسط دفتر مقررات ملی.",
    category: "answer-guides" as const,
    sourceUrl: "https://inbr.ir/راهنمای-پاسخنامه-تشریحی/",
    order: 50,
  },
  {
    key: "inbr-regulations",
    title: "مباحث مقررات ملی ساختمان",
    description: "فهرست رسمی مباحث و پیوندهای انتشار‌یافته توسط دفتر مقررات ملی و کنترل ساختمان.",
    category: "regulations" as const,
    sourceUrl: "https://inbr.ir/مباحث-مقررات-ملی/",
    order: 60,
  },
  {
    key: "inbr-corrections",
    title: "اصلاحیه‌ها و الحاقیه‌های رسمی",
    description: "منبع رسمی اصلاحیه‌ها؛ CivilMind متن اصلی را جایگزین نمی‌کند و تغییرات تأییدشده را به‌صورت پیوست نمایش می‌دهد.",
    category: "corrections" as const,
    sourceUrl: "https://inbr.ir/category/اصلاحیه-مباحث/",
    order: 70,
  },
  {
    key: "inbr-dey-1404-notice",
    title: "اطلاعیه درج سؤال‌ها و پاسخنامه‌های دی‌ماه ۱۴۰۴",
    description: "اطلاعیه رسمی انتشار سؤال‌ها و پاسخنامه‌های آزمون ورود به حرفه دی‌ماه ۱۴۰۴.",
    category: "exam-notice" as const,
    sourceUrl: "https://inbr.ir/اطلاعیه-درج-سوالات-و-پاسخنامه-دی-ماه-1404/",
    order: 80,
  },
];

export const seedVerifiedOfficialCatalog = mutation({
  args: {},
  returns: v.object({ created: v.number(), existing: v.number() }),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const now = Date.now();
    let created = 0;
    let existing = 0;

    for (const resource of officialCatalog) {
      const current = await ctx.db
        .query("officialResources")
        .withIndex("by_key", (index) => index.eq("key", resource.key))
        .unique();

      const sameUrl = await ctx.db
        .query("officialResources")
        .withIndex("by_sourceUrl", (index) => index.eq("sourceUrl", resource.sourceUrl))
        .unique();

      if (current || sameUrl) {
        existing += 1;
        continue;
      }

      await ctx.db.insert("officialResources", {
        ...resource,
        sourcePublisher: "دفتر مقررات ملی و کنترل ساختمان",
        sourceDomain: "inbr.ir",
        status: "verified",
        isActive: true,
        lastVerifiedAt: now,
      });
      created += 1;
    }

    return { created, existing };
  },
});
