import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { requireActiveUser } from "./lib/auth";
import {
  assertPublicCapability,
  getEntitlementContext,
} from "./lib/entitlements";

const preferenceV = v.union(
  v.object({ discipline: v.string(), qualification: v.string() }),
  v.null(),
);

const docV = v.object({
  id: v.id("examArchiveDocuments"),
  kind: v.union(
    v.literal("question-booklet"),
    v.literal("answer-key"),
    v.literal("descriptive-guide"),
  ),
  title: v.string(),
  discipline: v.string(),
  qualification: v.optional(v.string()),
  sourceUrl: v.string(),
});

async function scope(ctx: QueryCtx) {
  const access = await getEntitlementContext(ctx);
  if (!access.user) return { user: null, preference: null, access: false };
  const preference = await ctx.db
    .query("userExamPreferences")
    .withIndex("by_userId", (q) => q.eq("userId", access.user!._id))
    .unique();
  return {
    user: access.user,
    preference,
    access: access.tier === "admin" || access.tier === "premium",
  };
}

export const getPreference = query({
  args: {},
  returns: preferenceV,
  handler: async (ctx) => {
    const { preference } = await scope(ctx);
    return preference
      ? { discipline: preference.discipline, qualification: preference.qualification }
      : null;
  },
});

export const savePreference = mutation({
  args: { discipline: v.string(), qualification: v.string() },
  returns: preferenceV,
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    const discipline = args.discipline.trim();
    const qualification = args.qualification.trim();
    if (!discipline || !qualification || discipline.length > 80 || qualification.length > 80) {
      throw new Error("INVALID_EXAM_PREFERENCE");
    }
    const row = await ctx.db
      .query("userExamPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    const now = Date.now();
    if (row) {
      await ctx.db.patch(row._id, { discipline, qualification, updatedAt: now });
    } else {
      await ctx.db.insert("userExamPreferences", {
        userId: user._id,
        discipline,
        qualification,
        updatedAt: now,
      });
    }
    return { discipline, qualification };
  },
});

export const listMyEligibleArchive = query({
  args: {},
  returns: v.object({
    hasPremiumAccess: v.boolean(),
    preference: preferenceV,
    archives: v.array(
      v.object({
        id: v.id("examArchives"),
        title: v.string(),
        officialPageUrl: v.string(),
        documents: v.array(docV),
      }),
    ),
  }),
  handler: async (ctx) => {
    const { preference, access } = await scope(ctx);
    const publicPreference = preference
      ? { discipline: preference.discipline, qualification: preference.qualification }
      : null;
    if (!preference) {
      return { hasPremiumAccess: access, preference: publicPreference, archives: [] };
    }
    const archives = await ctx.db
      .query("examArchives")
      .withIndex("by_status_and_lastVerifiedAt", (q) => q.eq("status", "verified"))
      .order("desc")
      .take(24);
    const items = await Promise.all(
      archives.map(async (archive) => {
        const documents = (
          await ctx.db
            .query("examArchiveDocuments")
            .withIndex("by_archiveId_and_discipline", (q) =>
              q.eq("archiveId", archive._id).eq("discipline", preference.discipline),
            )
            .take(100)
        ).filter(
          (document) =>
            document.qualification === preference.qualification ||
            document.qualification === undefined,
        );
        return {
          id: archive._id,
          title: archive.title,
          officialPageUrl: archive.officialPageUrl,
          documents: documents.map((document) => ({
            id: document._id,
            kind: document.kind,
            title: document.title,
            discipline: document.discipline,
            qualification: document.qualification,
            sourceUrl: document.sourceUrl,
          })),
        };
      }),
    );
    return {
      hasPremiumAccess: access,
      preference: publicPreference,
      archives: items.filter((item) => item.documents.length > 0),
    };
  },
});

export const recentQuestionsForTopic = query({
  args: { topicCode: v.number() },
  returns: v.array(
    v.object({
      id: v.id("examQuestionReferences"),
      questionNumber: v.number(),
      topicTitle: v.string(),
      discipline: v.string(),
      qualification: v.optional(v.string()),
      sourcePage: v.optional(v.number()),
      sourceExcerpt: v.optional(v.string()),
      stem: v.optional(v.string()),
      options: v.optional(v.array(v.string())),
      officialCorrectIndex: v.optional(v.number()),
      officialClause: v.optional(v.string()),
      sourceEdition: v.optional(v.string()),
      officialAnswerSourceUrl: v.optional(v.string()),
      analysisReady: v.boolean(),
      documentTitle: v.string(),
      sourceUrl: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    assertPublicCapability("official_content.read");
    assertPublicCapability("content.filter");
    if (!Number.isInteger(args.topicCode) || args.topicCode < 1 || args.topicCode > 99) {
      throw new Error("INVALID_TOPIC_CODE");
    }
    const rows = await ctx.db
      .query("examQuestionReferences")
      .withIndex("by_topicCode_and_discipline", (q) => q.eq("topicCode", args.topicCode))
      .order("desc")
      .take(30);
    const questions = await Promise.all(
      rows.map(async (row) => {
        const document = await ctx.db.get(row.archiveDocumentId);
        if (!document || document.status !== "verified") return null;
        return {
          id: row._id,
          questionNumber: row.questionNumber,
          topicTitle: row.topicTitle,
          discipline: row.discipline,
          qualification: row.qualification,
          sourcePage: row.sourcePage,
          sourceExcerpt: row.sourceExcerpt,
          stem: row.stem,
          options: row.options,
          officialCorrectIndex: row.officialCorrectIndex,
          officialClause: row.officialClause,
          sourceEdition: row.sourceEdition,
          officialAnswerSourceUrl: row.officialAnswerSourceUrl,
          analysisReady: Boolean(
            row.stem &&
            row.options &&
            row.options.length >= 2 &&
            row.officialCorrectIndex !== undefined &&
            row.officialCorrectIndex >= 0 &&
            row.officialCorrectIndex < row.options.length,
          ),
          documentTitle: document.title,
          sourceUrl: document.sourceUrl,
        };
      }),
    );
    return questions.filter((question) => question !== null);
  },
});

export const listPublicArchive = query({
  args: { discipline: v.string(), qualification: v.string() },
  returns: v.array(
    v.object({
      id: v.id("examArchives"),
      title: v.string(),
      officialPageUrl: v.string(),
      documents: v.array(docV),
    }),
  ),
  handler: async (ctx, args) => {
    assertPublicCapability("official_content.read");
    assertPublicCapability("content.filter");
    const discipline = args.discipline.trim();
    const qualification = args.qualification.trim();
    if (!discipline || !qualification || discipline.length > 80 || qualification.length > 80) {
      throw new Error("INVALID_EXAM_PREFERENCE");
    }
    const archives = await ctx.db
      .query("examArchives")
      .withIndex("by_status_and_lastVerifiedAt", (q) => q.eq("status", "verified"))
      .order("desc")
      .take(24);
    const items = await Promise.all(
      archives.map(async (archive) => {
        const documents = (
          await ctx.db
            .query("examArchiveDocuments")
            .withIndex("by_archiveId_and_discipline", (q) =>
              q.eq("archiveId", archive._id).eq("discipline", discipline),
            )
            .take(100)
        )
          .filter(
            (document) =>
              document.qualification === qualification ||
              document.qualification === undefined,
          )
          .map((document) => ({
            id: document._id,
            kind: document.kind,
            title: document.title,
            discipline: document.discipline,
            qualification: document.qualification,
            sourceUrl: document.sourceUrl,
          }));
        return {
          id: archive._id,
          title: archive.title,
          officialPageUrl: archive.officialPageUrl,
          documents,
        };
      }),
    );
    return items.filter((archive) => archive.documents.length > 0);
  },
});
