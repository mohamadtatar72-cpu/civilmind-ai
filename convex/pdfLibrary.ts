import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { writeAuditLog } from "./lib/audit";
import {
  getCurrentUser,
  requireActiveUser,
  requireAdmin,
} from "./lib/auth";

const visibilityValidator = v.union(
  v.literal("private"),
  v.literal("premium"),
  v.literal("public"),
);

const lifecycleValidator = v.union(
  v.literal("registered"),
  v.literal("processing"),
  v.literal("ready"),
  v.literal("failed"),
  v.literal("quarantined"),
  v.literal("archived"),
);

const jobStatusValidator = v.union(
  v.literal("queued"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("quarantined"),
  v.literal("cancelled"),
);

const jobStageValidator = v.union(
  v.literal("register"),
  v.literal("extract"),
  v.literal("chunk"),
  v.literal("index"),
);

const publicDocumentValidator = v.object({
  id: v.id("pdfDocuments"),
  ownerUserId: v.optional(v.id("users")),
  title: v.string(),
  fileName: v.string(),
  mimeType: v.literal("application/pdf"),
  byteLength: v.number(),
  checksumSha256: v.string(),
  visibility: visibilityValidator,
  lifecycle: lifecycleValidator,
  sourceUrl: v.optional(v.string()),
  pageCount: v.optional(v.number()),
  activeVersion: v.number(),
  parentDocumentId: v.optional(v.id("pdfDocuments")),
  createdAt: v.number(),
  updatedAt: v.number(),
  processedAt: v.optional(v.number()),
  quarantineReason: v.optional(v.string()),
});

const publicJobValidator = v.object({
  id: v.id("pdfProcessingJobs"),
  documentId: v.id("pdfDocuments"),
  requestedBy: v.optional(v.id("users")),
  attempt: v.number(),
  status: jobStatusValidator,
  stage: jobStageValidator,
  errorCode: v.optional(v.string()),
  errorMessage: v.optional(v.string()),
  createdAt: v.number(),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
});

const citationValidator = v.object({
  chunkId: v.id("pdfChunks"),
  documentId: v.id("pdfDocuments"),
  documentTitle: v.string(),
  pageNumber: v.number(),
  citationLabel: v.string(),
  excerpt: v.string(),
});

const MAX_FILE_BYTES = 50_000_000;
const MAX_RETRY_ATTEMPTS = 3;
const MAX_RESULTS = 20;

function normalizeText(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function assertSha256(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    throw new Error("PDF_CHECKSUM_INVALID");
  }
  return normalized;
}

function assertHttpsUrl(value: string | undefined) {
  if (!value) return undefined;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("PDF_SOURCE_URL_INVALID");
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("PDF_SOURCE_URL_NOT_ALLOWED");
  }
  return url.toString();
}

function hashForAudit(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function toPublicDocument(document: Doc<"pdfDocuments">) {
  return {
    id: document._id,
    ownerUserId: document.ownerUserId,
    title: document.title,
    fileName: document.fileName,
    mimeType: document.mimeType,
    byteLength: document.byteLength,
    checksumSha256: document.checksumSha256,
    visibility: document.visibility,
    lifecycle: document.lifecycle,
    sourceUrl: document.sourceUrl,
    pageCount: document.pageCount,
    activeVersion: document.activeVersion,
    parentDocumentId: document.parentDocumentId,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    processedAt: document.processedAt,
    quarantineReason: document.quarantineReason,
  };
}

function toPublicJob(job: Doc<"pdfProcessingJobs">) {
  return {
    id: job._id,
    documentId: job.documentId,
    requestedBy: job.requestedBy,
    attempt: job.attempt,
    status: job.status,
    stage: job.stage,
    errorCode: job.errorCode,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
  };
}

function canReadDocument(
  document: Doc<"pdfDocuments">,
  user: Doc<"users"> | null,
) {
  if (document.lifecycle !== "ready") return false;
  if (document.visibility === "public") return true;
  if (!user) return false;
  if (user.role === "admin") return true;
  if (document.ownerUserId === user._id) return true;
  return document.visibility === "premium" && user.role === "premium";
}

function canManageDocument(
  document: Doc<"pdfDocuments">,
  user: Doc<"users">,
) {
  return user.role === "admin" || document.ownerUserId === user._id;
}

export const listAccessible = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(publicDocumentValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error("INVALID_LIMIT");
    }

    const user = await getCurrentUser(ctx);
    const [publicDocuments, premiumDocuments, ownedDocuments] = await Promise.all([
      ctx.db
        .query("pdfDocuments")
        .withIndex("by_visibility_and_lifecycle", (index) =>
          index.eq("visibility", "public").eq("lifecycle", "ready"),
        )
        .order("desc")
        .take(limit),
      user && (user.role === "premium" || user.role === "admin")
        ? ctx.db
            .query("pdfDocuments")
            .withIndex("by_visibility_and_lifecycle", (index) =>
              index.eq("visibility", "premium").eq("lifecycle", "ready"),
            )
            .order("desc")
            .take(limit)
        : Promise.resolve([]),
      user
        ? ctx.db
            .query("pdfDocuments")
            .withIndex("by_ownerUserId_and_createdAt", (index) =>
              index.eq("ownerUserId", user._id),
            )
            .order("desc")
            .take(limit)
        : Promise.resolve([]),
    ]);

    const merged = new Map<string, Doc<"pdfDocuments">>();
    for (const document of [
      ...ownedDocuments,
      ...premiumDocuments,
      ...publicDocuments,
    ]) {
      if (canReadDocument(document, user)) {
        merged.set(document._id, document);
      }
    }

    return [...merged.values()]
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .slice(0, limit)
      .map(toPublicDocument);
  },
});

export const getAccessibleById = query({
  args: { documentId: v.id("pdfDocuments") },
  returns: v.union(publicDocumentValidator, v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const document = await ctx.db.get(args.documentId);
    if (!document || !canReadDocument(document, user)) return null;
    return toPublicDocument(document);
  },
});

export const requestProcessing = mutation({
  args: { documentId: v.id("pdfDocuments") },
  returns: publicJobValidator,
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error("PDF_DOCUMENT_NOT_FOUND");
    if (!canManageDocument(document, user)) throw new Error("ACCESS_DENIED");
    if (!["registered", "failed"].includes(document.lifecycle)) {
      throw new Error("PDF_DOCUMENT_NOT_PROCESSABLE");
    }

    const activeJob = await ctx.db
      .query("pdfProcessingJobs")
      .withIndex("by_documentId_and_createdAt", (index) =>
        index.eq("documentId", document._id),
      )
      .order("desc")
      .first();

    if (activeJob && ["queued", "running"].includes(activeJob.status)) {
      return toPublicJob(activeJob);
    }

    const attempt = (activeJob?.attempt ?? 0) + 1;
    if (attempt > MAX_RETRY_ATTEMPTS) {
      throw new Error("PDF_RETRY_LIMIT_REACHED");
    }

    const now = Date.now();
    const jobId = await ctx.db.insert("pdfProcessingJobs", {
      documentId: document._id,
      requestedBy: user._id,
      attempt,
      status: "queued",
      stage: "extract",
      createdAt: now,
    });
    await ctx.db.patch(document._id, {
      lifecycle: "processing",
      updatedAt: now,
    });

    await writeAuditLog(ctx, {
      actorUserId: user._id,
      actorAuthSubject: user.authSubject,
      action: "pdf.processing_requested",
      resourceType: "pdfDocument",
      resourceId: document._id,
      result: "success",
      metadata: { attempt },
    });

    return toPublicJob((await ctx.db.get(jobId))!);
  },
});

export const searchWithCitations = mutation({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    queryHash: v.string(),
    citations: v.array(citationValidator),
  }),
  handler: async (ctx, args) => {
    const normalizedQuery = normalizeText(args.query, 300);
    if (normalizedQuery.length < 2) throw new Error("PDF_QUERY_TOO_SHORT");
    const limit = args.limit ?? 10;
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_RESULTS) {
      throw new Error("INVALID_LIMIT");
    }

    const user = await requireActiveUser(ctx);
    const perBucket = Math.min(limit, 10);
    const searches: Array<Promise<Doc<"pdfChunks">[]>> = [
      ctx.db
        .query("pdfChunks")
        .withSearchIndex("search_text", (search) =>
          search
            .search("text", normalizedQuery)
            .eq("visibility", "public")
            .eq("documentLifecycle", "ready"),
        )
        .take(perBucket),
    ];

    if (user && (user.role === "premium" || user.role === "admin")) {
      searches.push(
        ctx.db
          .query("pdfChunks")
          .withSearchIndex("search_text", (search) =>
            search
              .search("text", normalizedQuery)
              .eq("visibility", "premium")
              .eq("documentLifecycle", "ready"),
          )
          .take(perBucket),
      );
    }

    if (user) {
      searches.push(
        ctx.db
          .query("pdfChunks")
          .withSearchIndex("search_text", (search) =>
            search
              .search("text", normalizedQuery)
              .eq("ownerUserId", user._id)
              .eq("documentLifecycle", "ready"),
          )
          .take(perBucket),
      );
    }

    const candidates = (await Promise.all(searches)).flat();
    const uniqueChunks = new Map<string, Doc<"pdfChunks">>();
    for (const chunk of candidates) uniqueChunks.set(chunk._id, chunk);

    const citations: Array<{
      chunkId: Id<"pdfChunks">;
      documentId: Id<"pdfDocuments">;
      documentTitle: string;
      pageNumber: number;
      citationLabel: string;
      excerpt: string;
    }> = [];

    for (const chunk of [...uniqueChunks.values()].slice(0, limit * 2)) {
      const document = await ctx.db.get(chunk.documentId);
      if (!document || !canReadDocument(document, user)) continue;
      citations.push({
        chunkId: chunk._id,
        documentId: document._id,
        documentTitle: document.title,
        pageNumber: chunk.pageNumber,
        citationLabel: chunk.citationLabel,
        excerpt: chunk.text.slice(0, 700),
      });
      if (citations.length >= limit) break;
    }

    const queryHash = hashForAudit(normalizedQuery);
    await ctx.db.insert("pdfRetrievalLogs", {
      userId: user?._id,
      queryHash,
      resultCount: citations.length,
      createdAt: Date.now(),
    });

    await writeAuditLog(ctx, {
      actorUserId: user?._id,
      actorAuthSubject: user?.authSubject,
      action: "pdf.citation_search",
      resourceType: "pdfRetrieval",
      result: "success",
      metadata: {
        queryHash,
        resultCount: citations.length,
      },
    });

    return { queryHash, citations };
  },
});

export const adminListQuarantined = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(publicDocumentValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = args.limit ?? 50;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error("INVALID_LIMIT");
    }
    const documents = await ctx.db
      .query("pdfDocuments")
      .withIndex("by_lifecycle_and_updatedAt", (index) =>
        index.eq("lifecycle", "quarantined"),
      )
      .order("desc")
      .take(limit);
    return documents.map(toPublicDocument);
  },
});

export const adminListRecentJobs = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(publicJobValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = args.limit ?? 50;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error("INVALID_LIMIT");
    }
    const jobs = await ctx.db
      .query("pdfProcessingJobs")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
    return jobs.map(toPublicJob);
  },
});

export const adminReviewQuarantine = mutation({
  args: {
    documentId: v.id("pdfDocuments"),
    decision: v.union(v.literal("release"), v.literal("archive")),
    note: v.string(),
  },
  returns: publicDocumentValidator,
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const note = normalizeText(args.note, 1000);
    if (note.length < 3) throw new Error("PDF_REVIEW_NOTE_REQUIRED");
    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error("PDF_DOCUMENT_NOT_FOUND");
    if (document.lifecycle !== "quarantined") {
      throw new Error("PDF_DOCUMENT_NOT_QUARANTINED");
    }

    const now = Date.now();
    await ctx.db.patch(document._id, {
      lifecycle: args.decision === "release" ? "registered" : "archived",
      quarantineReason:
        args.decision === "release" ? undefined : document.quarantineReason,
      updatedAt: now,
    });

    await writeAuditLog(ctx, {
      actorUserId: admin._id,
      actorAuthSubject: admin.authSubject,
      action: `pdf.quarantine_${args.decision}`,
      resourceType: "pdfDocument",
      resourceId: document._id,
      result: "success",
      metadata: { note },
    });

    return toPublicDocument((await ctx.db.get(document._id))!);
  },
});

export const internalRegisterVerifiedDocument = internalMutation({
  args: {
    ownerUserId: v.optional(v.id("users")),
    requestedBy: v.optional(v.id("users")),
    title: v.string(),
    fileName: v.string(),
    byteLength: v.number(),
    checksumSha256: v.string(),
    visibility: visibilityValidator,
    sourceUrl: v.optional(v.string()),
    parentDocumentId: v.optional(v.id("pdfDocuments")),
    activeVersion: v.optional(v.number()),
    quarantined: v.optional(v.boolean()),
    quarantineReason: v.optional(v.string()),
  },
  returns: v.object({
    documentId: v.id("pdfDocuments"),
    deduplicated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const checksumSha256 = assertSha256(args.checksumSha256);
    const title = normalizeText(args.title, 180);
    const fileName = normalizeText(args.fileName, 220);
    if (!title || !fileName) throw new Error("PDF_METADATA_INVALID");
    if (
      !Number.isInteger(args.byteLength) ||
      args.byteLength < 1 ||
      args.byteLength > MAX_FILE_BYTES
    ) {
      throw new Error("PDF_SIZE_INVALID");
    }

    const checksumMatches = await ctx.db
      .query("pdfDocuments")
      .withIndex("by_checksumSha256", (index) =>
        index.eq("checksumSha256", checksumSha256),
      )
      .take(10);
    const duplicate = checksumMatches.find(
      (document) => document.lifecycle !== "archived",
    );
    if (duplicate) {
      return { documentId: duplicate._id, deduplicated: true };
    }

    const now = Date.now();
    const quarantined = args.quarantined ?? false;
    const documentId = await ctx.db.insert("pdfDocuments", {
      ownerUserId: args.ownerUserId,
      title,
      fileName,
      mimeType: "application/pdf",
      byteLength: args.byteLength,
      checksumSha256,
      visibility: args.visibility,
      lifecycle: quarantined ? "quarantined" : "registered",
      sourceUrl: assertHttpsUrl(args.sourceUrl),
      activeVersion: args.activeVersion ?? 1,
      parentDocumentId: args.parentDocumentId,
      createdAt: now,
      updatedAt: now,
      quarantineReason: quarantined
        ? normalizeText(args.quarantineReason ?? "security-review-required", 500)
        : undefined,
    });

    await writeAuditLog(ctx, {
      actorUserId: args.requestedBy,
      action: quarantined ? "pdf.registered_quarantined" : "pdf.registered",
      resourceType: "pdfDocument",
      resourceId: documentId,
      result: "success",
      metadata: {
        checksumPrefix: checksumSha256.slice(0, 12),
        byteLength: args.byteLength,
        visibility: args.visibility,
      },
    });

    return { documentId, deduplicated: false };
  },
});

export const internalStartProcessingJob = internalMutation({
  args: { jobId: v.id("pdfProcessingJobs") },
  returns: publicJobValidator,
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("PDF_JOB_NOT_FOUND");
    if (job.status !== "queued") throw new Error("PDF_JOB_NOT_QUEUED");
    const now = Date.now();
    await ctx.db.patch(job._id, {
      status: "running",
      stage: "extract",
      startedAt: now,
    });
    return toPublicJob((await ctx.db.get(job._id))!);
  },
});

export const internalPersistPage = internalMutation({
  args: {
    jobId: v.id("pdfProcessingJobs"),
    documentId: v.id("pdfDocuments"),
    pageNumber: v.number(),
    text: v.string(),
    textHash: v.string(),
    chunks: v.array(
      v.object({
        chunkIndex: v.number(),
        text: v.string(),
        textHash: v.string(),
        charStart: v.number(),
        charEnd: v.number(),
        citationLabel: v.string(),
      }),
    ),
  },
  returns: v.object({
    pageId: v.id("pdfPages"),
    chunkCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    const document = await ctx.db.get(args.documentId);
    if (!job || !document || job.documentId !== document._id) {
      throw new Error("PDF_JOB_DOCUMENT_MISMATCH");
    }
    if (job.status !== "running") throw new Error("PDF_JOB_NOT_RUNNING");
    if (!Number.isInteger(args.pageNumber) || args.pageNumber < 1) {
      throw new Error("PDF_PAGE_NUMBER_INVALID");
    }
    if (args.chunks.length > 100) throw new Error("PDF_PAGE_CHUNK_LIMIT");

    const existingPage = await ctx.db
      .query("pdfPages")
      .withIndex("by_documentId_and_pageNumber", (index) =>
        index
          .eq("documentId", document._id)
          .eq("pageNumber", args.pageNumber),
      )
      .unique();
    if (existingPage) throw new Error("PDF_PAGE_ALREADY_PERSISTED");

    const pageText = args.text.slice(0, 100_000);
    const now = Date.now();
    const pageId = await ctx.db.insert("pdfPages", {
      documentId: document._id,
      pageNumber: args.pageNumber,
      text: pageText,
      textHash: assertSha256(args.textHash),
      charCount: pageText.length,
      createdAt: now,
    });

    for (const chunk of args.chunks) {
      if (
        !Number.isInteger(chunk.chunkIndex) ||
        chunk.chunkIndex < 0 ||
        chunk.charStart < 0 ||
        chunk.charEnd < chunk.charStart
      ) {
        throw new Error("PDF_CHUNK_RANGE_INVALID");
      }
      const text = chunk.text.slice(0, 4_000);
      await ctx.db.insert("pdfChunks", {
        documentId: document._id,
        pageId,
        ownerUserId: document.ownerUserId,
        visibility: document.visibility,
        documentLifecycle: "processing",
        pageNumber: args.pageNumber,
        chunkIndex: chunk.chunkIndex,
        text,
        textHash: assertSha256(chunk.textHash),
        charStart: chunk.charStart,
        charEnd: chunk.charEnd,
        citationLabel: normalizeText(chunk.citationLabel, 240),
        createdAt: now,
      });
    }

    await ctx.db.patch(job._id, { stage: "chunk" });
    return { pageId, chunkCount: args.chunks.length };
  },
});

export const internalCompleteProcessingJob = internalMutation({
  args: {
    jobId: v.id("pdfProcessingJobs"),
    pageCount: v.number(),
  },
  returns: publicDocumentValidator,
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("PDF_JOB_NOT_FOUND");
    const document = await ctx.db.get(job.documentId);
    if (!document) throw new Error("PDF_DOCUMENT_NOT_FOUND");
    if (job.status !== "running") throw new Error("PDF_JOB_NOT_RUNNING");
    if (!Number.isInteger(args.pageCount) || args.pageCount < 1) {
      throw new Error("PDF_PAGE_COUNT_INVALID");
    }

    const now = Date.now();
    const chunks = await ctx.db
      .query("pdfChunks")
      .withIndex("by_documentId_and_chunkIndex", (index) =>
        index.eq("documentId", document._id),
      )
      .take(5_000);
    for (const chunk of chunks) {
      await ctx.db.patch(chunk._id, { documentLifecycle: "ready" });
    }

    await ctx.db.patch(document._id, {
      lifecycle: "ready",
      pageCount: args.pageCount,
      processedAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(job._id, {
      status: "completed",
      stage: "index",
      completedAt: now,
    });

    await writeAuditLog(ctx, {
      actorUserId: job.requestedBy,
      action: "pdf.processing_completed",
      resourceType: "pdfDocument",
      resourceId: document._id,
      result: "success",
      metadata: { pageCount: args.pageCount, chunkCount: chunks.length },
    });

    return toPublicDocument((await ctx.db.get(document._id))!);
  },
});

export const internalFailProcessingJob = internalMutation({
  args: {
    jobId: v.id("pdfProcessingJobs"),
    errorCode: v.string(),
    errorMessage: v.string(),
    quarantined: v.optional(v.boolean()),
  },
  returns: publicJobValidator,
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("PDF_JOB_NOT_FOUND");
    const document = await ctx.db.get(job.documentId);
    if (!document) throw new Error("PDF_DOCUMENT_NOT_FOUND");

    const errorCode = normalizeText(args.errorCode, 80);
    const errorMessage = normalizeText(args.errorMessage, 500);
    const quarantined = args.quarantined ?? false;
    const now = Date.now();
    await ctx.db.patch(job._id, {
      status: quarantined ? "quarantined" : "failed",
      errorCode,
      errorMessage,
      completedAt: now,
    });
    await ctx.db.patch(document._id, {
      lifecycle: quarantined ? "quarantined" : "failed",
      quarantineReason: quarantined ? errorMessage : undefined,
      updatedAt: now,
    });

    await writeAuditLog(ctx, {
      actorUserId: job.requestedBy,
      action: quarantined ? "pdf.processing_quarantined" : "pdf.processing_failed",
      resourceType: "pdfDocument",
      resourceId: document._id,
      result: "failure",
      metadata: { errorCode, attempt: job.attempt },
    });

    return toPublicJob((await ctx.db.get(job._id))!);
  },
});
