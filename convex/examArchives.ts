import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { VERIFIED_KHORDAD_1404_QUESTION } from "./data/verifiedOfficialQuestions.mjs";
import { requireAdmin } from "./lib/auth";

const kindV = v.union(v.literal("question-booklet"), v.literal("answer-key"), v.literal("descriptive-guide"));
const documentV = v.object({ id: v.id("examArchiveDocuments"), kind: kindV, title: v.string(), discipline: v.string(), qualification: v.optional(v.string()), sourceUrl: v.string() });

export const listVerified = query({
  args: {},
  returns: v.array(v.object({ id: v.id("examArchives"), title: v.string(), yearLabel: v.string(), sessionLabel: v.string(), officialPageUrl: v.string(), documents: v.array(documentV) })),
  handler: async (ctx) => {
    const archives = await ctx.db.query("examArchives").withIndex("by_status_and_lastVerifiedAt", (q) => q.eq("status", "verified")).order("desc").take(24);
    return await Promise.all(archives.map(async (archive) => ({
      id: archive._id, title: archive.title, yearLabel: archive.yearLabel, sessionLabel: archive.sessionLabel, officialPageUrl: archive.officialPageUrl,
      documents: (await ctx.db.query("examArchiveDocuments").withIndex("by_archiveId_and_kind", (q) => q.eq("archiveId", archive._id)).take(100)).map((d) => ({ id: d._id, kind: d.kind, title: d.title, discipline: d.discipline, qualification: d.qualification, sourceUrl: d.sourceUrl })),
    })));
  },
});

const DOCS = [
  ["دفترچه معماری (اجرا)","معماری","اجرا","معماری-اجرا2.pdf"],["دفترچه معماری (نظارت)","معماری","نظارت","معماری-نظارت2.pdf"],["دفترچه عمران (محاسبات)","عمران","محاسبات","عمران-محاسبات2.pdf"],["دفترچه عمران (اجرا)","عمران","اجرا","عمران-اجرا2.pdf"],["دفترچه عمران (نظارت)","عمران","نظارت","عمران-نظارت2.pdf"],["دفترچه عمران (ارزیابی، طرح و اجرای بهسازی)","عمران","بهسازی","عمران-بهسازی1.pdf"],["دفترچه عمران (طرح و اجرای گود، پی و سازه نگهبان)","عمران","گود، پی و سازه نگهبان","گودبرداری1.pdf"],["دفترچه تاسیسات مکانیکی (طراحی)","تأسیسات مکانیکی","طراحی","مکانیک-طراحی1.pdf"],["دفترچه تاسیسات مکانیکی (اجرا)","تأسیسات مکانیکی","اجرا","مکانیک-اجرا1.pdf"],["دفترچه تاسیسات مکانیکی (نظارت)","تأسیسات مکانیکی","نظارت","مکانیک-نظارت1.pdf"],["دفترچه تاسیسات برقی (طراحی)","تأسیسات برقی","طراحی","برق-طراحی1.pdf"],["دفترچه تاسیسات برقی (اجرا)","تأسیسات برقی","اجرا","برق-اجرا1.pdf"],["دفترچه تاسیسات برقی (نظارت)","تأسیسات برقی","نظارت","برق-نظارت1.pdf"],["دفترچه شهرسازی","شهرسازی",null,"شهرسازی1.pdf"],["دفترچه نقشه‌برداری","نقشه‌برداری",null,"نقشه-برداری1.pdf"],["دفترچه ترافیک","ترافیک",null,"ترافیک1.pdf"],
] as const;
const BASE = "https://inbr.ir/wp-content/uploads/2026/01/";

export const seedDey1404OfficialBooklets = mutation({
  args: {}, returns: v.object({ archiveId: v.id("examArchives"), createdDocuments: v.number() }),
  handler: async (ctx) => {
    await requireAdmin(ctx); const now = Date.now();
    let archive = await ctx.db.query("examArchives").withIndex("by_key", (q) => q.eq("key", "inbr-dey-1404")).unique();
    if (!archive) { const id = await ctx.db.insert("examArchives", { key: "inbr-dey-1404", title: "نمونه سؤالات آزمون مهندسی دی‌ماه ۱۴۰۴", yearLabel: "۱۴۰۴", sessionLabel: "دی‌ماه", officialPageUrl: "https://inbr.ir/نمونه-سوالات-آزمون-مهندسی-دی-ماه-1404/", sourcePublisher: "دفتر مقررات ملی و کنترل ساختمان", sourceDomain: "inbr.ir", status: "verified", discoveredAt: now, lastVerifiedAt: now }); archive = (await ctx.db.get(id))!; }
    let createdDocuments = 0;
    for (const [title, discipline, qualification, file] of DOCS) { const sourceUrl = BASE + encodeURIComponent(file); const found = await ctx.db.query("examArchiveDocuments").withIndex("by_archiveId_and_sourceUrl", (q) => q.eq("archiveId", archive._id).eq("sourceUrl", sourceUrl)).take(1); if (found[0]) continue; await ctx.db.insert("examArchiveDocuments", { archiveId: archive._id, kind: "question-booklet", title, discipline, ...(qualification ? { qualification } : {}), sourceUrl, sourcePublisher: "دفتر مقررات ملی و کنترل ساختمان", status: "verified", discoveredAt: now, lastVerifiedAt: now }); createdDocuments += 1; }
    return { archiveId: archive._id, createdDocuments };
  },
});


const HISTORICAL_SESSIONS = [
  {
    key: "inbr-khordad-1404",
    title: "نمونه سؤالات آزمون مهندسی خردادماه ۱۴۰۴",
    yearLabel: "۱۴۰۴",
    sessionLabel: "خردادماه",
    officialPageUrl: "https://inbr.ir/نمونه-سوالات-آزمون-مهندسی-خرداد-1404/",
  },
  {
    key: "inbr-aban-1403",
    title: "نمونه سؤالات آزمون مهندسی آبان‌ماه ۱۴۰۳",
    yearLabel: "۱۴۰۳",
    sessionLabel: "آبان‌ماه",
    officialPageUrl: "https://inbr.ir/نمونه-سوالات-آزمون-مهندسی-آبان-1403/",
  },
  {
    key: "inbr-mordad-1403",
    title: "نمونه سؤالات آزمون مهندسی مردادماه ۱۴۰۳",
    yearLabel: "۱۴۰۳",
    sessionLabel: "مردادماه",
    officialPageUrl: "https://inbr.ir/نمونه-سوالات-آزمون-مهندسی-مرداد-1403/",
  },
  {
    key: "inbr-mehr-1402",
    title: "نمونه سؤالات آزمون مهندسی مهرماه ۱۴۰۲",
    yearLabel: "۱۴۰۲",
    sessionLabel: "مهرماه",
    officialPageUrl: "https://inbr.ir/نمونه-سوالات-آزمون-مهندسی-مهر-۱۴۰۲/",
  },
] as const;


const KHORDAD_1404_DOCUMENTS = [
  ["دفترچه سؤال و کلید رسمی تأسیسات برقی (طراحی)","تأسیسات برقی","طراحی","https://inbr.ir/wp-content/uploads/2025/07/تاسیسات-برقی-طراحی-خرداد1404.pdf"],
  ["دفترچه سؤال و کلید رسمی تأسیسات برقی (نظارت)","تأسیسات برقی","نظارت","https://inbr.ir/wp-content/uploads/2025/07/تاسیسات-برقی-نظارت-خرداد1404.pdf"],
  ["دفترچه سؤال و کلید رسمی تأسیسات برقی (اجرا)","تأسیسات برقی","اجرا","https://inbr.ir/wp-content/uploads/2025/07/تاسیسات-برقی-اجرا-خرداد1404-1.pdf"],
  ["دفترچه سؤال و کلید رسمی تأسیسات مکانیکی (طراحی)","تأسیسات مکانیکی","طراحی","https://inbr.ir/wp-content/uploads/2025/07/تاسیسات-مکانیکی-طراحی-خرداد1404-1.pdf"],
  ["دفترچه سؤال و کلید رسمی تأسیسات مکانیکی (نظارت)","تأسیسات مکانیکی","نظارت","https://inbr.ir/wp-content/uploads/2025/07/تاسیسات-مکانیکی-نظارت-خرداد1404.pdf"],
  ["دفترچه سؤال و کلید رسمی تأسیسات مکانیکی (اجرا)","تأسیسات مکانیکی","اجرا","https://inbr.ir/wp-content/uploads/2025/07/تاسیسات-مکانیکی-اجرا-خرداد1404.pdf"],
  ["دفترچه سؤال و کلید رسمی عمران (اجرا)","عمران","اجرا","https://inbr.ir/wp-content/uploads/2025/07/عمران-اجرا-خرداد-1404-3.pdf"],
  ["دفترچه سؤال و کلید رسمی عمران (نظارت)","عمران","نظارت","https://inbr.ir/wp-content/uploads/2025/07/عمران-نظارت-خرداد1404-3.pdf"],
  ["دفترچه سؤال و کلید رسمی عمران (محاسبات)","عمران","محاسبات","https://inbr.ir/wp-content/uploads/2025/07/عمران-محاسبات-خرداد1404-3.pdf"],
  ["دفترچه سؤال و کلید رسمی معماری (نظارت)","معماری","نظارت","https://inbr.ir/wp-content/uploads/2025/07/معماری-نظارت-خرداد1404-3.pdf"],
  ["دفترچه سؤال و کلید رسمی معماری (اجرا)","معماری","اجرا","https://inbr.ir/wp-content/uploads/2025/07/معماری-اجرا-خرداد-1404-3.pdf"],
  ["دفترچه سؤال و کلید رسمی نقشه‌برداری","نقشه‌برداری",null,"https://inbr.ir/wp-content/uploads/2025/07/نقشه-برداری-خرداد1404-1.pdf"],
  ["دفترچه سؤال و کلید رسمی ترافیک","ترافیک",null,"https://inbr.ir/wp-content/uploads/2025/07/ترافیک-خرداد1404-1.pdf"],
  ["دفترچه سؤال و کلید رسمی شهرسازی","شهرسازی",null,"https://inbr.ir/wp-content/uploads/2025/07/شهرسازی-خرداد1404.pdf"],
  ["دفترچه سؤال و کلید رسمی عمران (بهسازی)","عمران","بهسازی","https://inbr.ir/wp-content/uploads/2025/07/عمران-بهسازی-خرداد1404-1.pdf"],
  ["دفترچه سؤال و کلید رسمی عمران (گود، پی و سازه نگهبان)","عمران","گود، پی و سازه نگهبان","https://inbr.ir/wp-content/uploads/2025/07/عمران-گود-خرداد1404.pdf"],
] as const;


const ABAN_1403_DOCUMENTS = [
  ["دفترچه سؤال و کلید رسمی تأسیسات برقی (طراحی)","تأسیسات برقی","طراحی","https://inbr.ir/wp-content/uploads/2024/11/برق-طراحی-آبان-1403-v2.pdf"],
  ["دفترچه سؤال و کلید رسمی تأسیسات برقی (نظارت)","تأسیسات برقی","نظارت","https://inbr.ir/wp-content/uploads/2024/11/برق-نظارت-آبان-1403-v2.pdf"],
  ["دفترچه سؤال و کلید رسمی تأسیسات برقی (اجرا)","تأسیسات برقی","اجرا","https://inbr.ir/wp-content/uploads/2024/11/برق-اجرا-آبان-1403-v2.pdf"],
  ["دفترچه سؤال و کلید رسمی تأسیسات مکانیکی (طراحی)","تأسیسات مکانیکی","طراحی","https://inbr.ir/wp-content/uploads/2024/11/مکانیک-طراحی-آبان-1403-v2.pdf"],
  ["دفترچه سؤال و کلید رسمی تأسیسات مکانیکی (نظارت)","تأسیسات مکانیکی","نظارت","https://inbr.ir/wp-content/uploads/2024/11/مکانیک-نظارت-آبان-1403-v2.pdf"],
  ["دفترچه سؤال و کلید رسمی تأسیسات مکانیکی (اجرا)","تأسیسات مکانیکی","اجرا","https://inbr.ir/wp-content/uploads/2024/11/مکانیک-اجرا-آبان-1403-v2.pdf"],
  ["دفترچه سؤال و کلید رسمی عمران (اجرا)","عمران","اجرا","https://inbr.ir/wp-content/uploads/2024/11/عمران-اجرا-آبان-1403-v2.pdf"],
  ["دفترچه سؤال و کلید رسمی عمران (نظارت)","عمران","نظارت","https://inbr.ir/wp-content/uploads/2024/11/عمران-نظارت-آبان-1403-v2.pdf"],
  ["دفترچه سؤال و کلید رسمی عمران (محاسبات)","عمران","محاسبات","https://inbr.ir/wp-content/uploads/2024/11/عمران-محاسبات-آبان-1403-v2.pdf"],
  ["دفترچه سؤال و کلید رسمی معماری (نظارت)","معماری","نظارت","https://inbr.ir/wp-content/uploads/2024/11/معماری-نظارت-آبان-1403-v2.pdf"],
  ["دفترچه سؤال و کلید رسمی معماری (اجرا)","معماری","اجرا","https://inbr.ir/wp-content/uploads/2024/11/معماری-اجرا-آبان-1403-v2.pdf"],
  ["دفترچه سؤال و کلید رسمی نقشه‌برداری","نقشه‌برداری",null,"https://inbr.ir/wp-content/uploads/2024/11/نقشه-برداری-آبان-1403-v2.pdf"],
  ["دفترچه سؤال و کلید رسمی ترافیک","ترافیک",null,"https://inbr.ir/wp-content/uploads/2024/11/ترافیک-آبان-1403-v2.pdf"],
  ["دفترچه سؤال و کلید رسمی شهرسازی","شهرسازی",null,"https://inbr.ir/wp-content/uploads/2024/11/شهرسازی-آبان-1403-v2.pdf"],
  ["دفترچه سؤال و کلید رسمی عمران (بهسازی)","عمران","بهسازی","https://inbr.ir/wp-content/uploads/2024/11/عمران-بهسازی-آبان-1403-v2.pdf"],
  ["دفترچه سؤال و کلید رسمی عمران (گود، پی و سازه نگهبان)","عمران","گود، پی و سازه نگهبان","https://inbr.ir/wp-content/uploads/2024/11/عمران-گودبرداری-آبان-1403-v2.pdf"],
] as const;

const MORDAD_1403_DOCUMENTS = [
  ["دفترچه سؤال و کلید رسمی تأسیسات برقی (طراحی)","تأسیسات برقی","طراحی","https://inbr.ir/wp-content/uploads/2024/08/برق-طراحی-مرداد-1403.pdf"],
  ["دفترچه سؤال و کلید رسمی تأسیسات برقی (نظارت)","تأسیسات برقی","نظارت","https://inbr.ir/wp-content/uploads/2024/08/برق-نظارت-مرداد-1403.pdf"],
  ["دفترچه سؤال و کلید رسمی تأسیسات برقی (اجرا)","تأسیسات برقی","اجرا","https://inbr.ir/wp-content/uploads/2024/08/برق-اجرا-مرداد-1403.pdf"],
  ["دفترچه سؤال و کلید رسمی تأسیسات مکانیکی (طراحی)","تأسیسات مکانیکی","طراحی","https://inbr.ir/wp-content/uploads/2024/08/مکانیک-طراحی-مرداد-1403.pdf"],
  ["دفترچه سؤال و کلید رسمی تأسیسات مکانیکی (نظارت)","تأسیسات مکانیکی","نظارت","https://inbr.ir/wp-content/uploads/2024/08/مکانیک-نظارت-مرداد-1403.pdf"],
  ["دفترچه سؤال و کلید رسمی تأسیسات مکانیکی (اجرا)","تأسیسات مکانیکی","اجرا","https://inbr.ir/wp-content/uploads/2024/08/مکانیک-اجرا-مرداد-1403.pdf"],
  ["دفترچه سؤال و کلید رسمی عمران (اجرا)","عمران","اجرا","https://inbr.ir/wp-content/uploads/2024/08/عمران-اجرا-مرداد-1403.pdf"],
  ["دفترچه سؤال و کلید رسمی عمران (نظارت)","عمران","نظارت","https://inbr.ir/wp-content/uploads/2024/08/عمران-نظارت-مرداد-1403.pdf"],
  ["دفترچه سؤال و کلید رسمی عمران (محاسبات)","عمران","محاسبات","https://inbr.ir/wp-content/uploads/2024/08/عمران-محاسبات-مرداد-1403.pdf"],
  ["دفترچه سؤال و کلید رسمی معماری (نظارت)","معماری","نظارت","https://inbr.ir/wp-content/uploads/2024/08/معماری-نظارت-مرداد-1403.pdf"],
  ["دفترچه سؤال و کلید رسمی معماری (اجرا)","معماری","اجرا","https://inbr.ir/wp-content/uploads/2024/08/معماری-اجرا-مرداد-1403.pdf"],
  ["دفترچه سؤال و کلید رسمی نقشه‌برداری","نقشه‌برداری",null,"https://inbr.ir/wp-content/uploads/2024/08/نقشه-برداری-مرداد-1403.pdf"],
  ["دفترچه سؤال و کلید رسمی ترافیک","ترافیک",null,"https://inbr.ir/wp-content/uploads/2024/08/ترافیک-مرداد-1403.pdf"],
  ["دفترچه سؤال و کلید رسمی شهرسازی","شهرسازی",null,"https://inbr.ir/wp-content/uploads/2024/08/شهرسازی-مرداد-1403.pdf"],
  ["دفترچه سؤال و کلید رسمی عمران (بهسازی)","عمران","بهسازی","https://inbr.ir/wp-content/uploads/2024/08/عمران-بهسازی-مرداد-1403.pdf"],
  ["دفترچه سؤال و کلید رسمی عمران (گود، پی و سازه نگهبان)","عمران","گود، پی و سازه نگهبان","https://inbr.ir/wp-content/uploads/2024/08/عمران-گودبرداری-مرداد-1403.pdf"],
] as const;

const MEHR_1402_DOCUMENTS = [
  ["دفترچه سؤال و کلید رسمی تأسیسات برقی (طراحی)","تأسیسات برقی","طراحی","https://inbr.ir/wp-content/uploads/2023/10/برق-طراحی-مهر-1402.pdf"],
  ["دفترچه سؤال و کلید رسمی تأسیسات برقی (نظارت)","تأسیسات برقی","نظارت","https://inbr.ir/wp-content/uploads/2023/10/برق-نظارت-مهر-1402.pdf"],
  ["دفترچه سؤال و کلید رسمی تأسیسات برقی (اجرا)","تأسیسات برقی","اجرا","https://inbr.ir/wp-content/uploads/2023/10/برق-اجرا-مهر-1402.pdf"],
  ["دفترچه سؤال و کلید رسمی تأسیسات مکانیکی (طراحی)","تأسیسات مکانیکی","طراحی","https://inbr.ir/wp-content/uploads/2023/10/مکانیک-طراحی-مهر-1402.pdf"],
  ["دفترچه سؤال و کلید رسمی تأسیسات مکانیکی (نظارت)","تأسیسات مکانیکی","نظارت","https://inbr.ir/wp-content/uploads/2023/10/مکانیک-نظارت-مهر-1402.pdf"],
  ["دفترچه سؤال و کلید رسمی تأسیسات مکانیکی (اجرا)","تأسیسات مکانیکی","اجرا","https://inbr.ir/wp-content/uploads/2023/10/مکانیک-اجرا-مهر-1402.pdf"],
  ["دفترچه سؤال و کلید رسمی عمران (اجرا)","عمران","اجرا","https://inbr.ir/wp-content/uploads/2023/10/عمران-اجرا-مهر-1402.pdf"],
  ["دفترچه سؤال و کلید رسمی عمران (نظارت)","عمران","نظارت","https://inbr.ir/wp-content/uploads/2023/10/عمران-نظارت-مهر-1402.pdf"],
  ["دفترچه سؤال و کلید رسمی عمران (محاسبات)","عمران","محاسبات","https://inbr.ir/wp-content/uploads/2023/10/عمران-محاسبات-مهر-1402.pdf"],
  ["دفترچه سؤال و کلید رسمی معماری (نظارت)","معماری","نظارت","https://inbr.ir/wp-content/uploads/2023/10/معماری-نظارت-مهر-1402.pdf"],
  ["دفترچه سؤال و کلید رسمی معماری (اجرا)","معماری","اجرا","https://inbr.ir/wp-content/uploads/2023/10/معماری-اجرا-مهر-1402.pdf"],
  ["دفترچه سؤال و کلید رسمی نقشه‌برداری","نقشه‌برداری",null,"https://inbr.ir/wp-content/uploads/2023/10/نقشه‌برداری-مهر-1402.pdf"],
  ["دفترچه سؤال و کلید رسمی ترافیک","ترافیک",null,"https://inbr.ir/wp-content/uploads/2023/10/ترافیک-مهر-1402.pdf"],
  ["دفترچه سؤال و کلید رسمی شهرسازی","شهرسازی",null,"https://inbr.ir/wp-content/uploads/2023/10/شهرسازی-مهر-1402.pdf"],
  ["دفترچه سؤال و کلید رسمی عمران (بهسازی)","عمران","بهسازی","https://inbr.ir/wp-content/uploads/2023/10/عمران-بهسازی-مهر-1402.pdf"],
  ["دفترچه سؤال و کلید رسمی عمران (گود، پی و سازه نگهبان)","عمران","گود، پی و سازه نگهبان","https://inbr.ir/wp-content/uploads/2023/10/عمران-گود-مهر-1402.pdf"],
] as const;
export const seedVerifiedHistoricalSessions = mutation({
  args: {},
  returns: v.object({ created: v.number(), existing: v.number() }),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const now = Date.now();
    let created = 0;
    let existing = 0;

    for (const session of HISTORICAL_SESSIONS) {
      const current = await ctx.db
        .query("examArchives")
        .withIndex("by_key", (index) => index.eq("key", session.key))
        .unique();

      if (current) {
        existing += 1;
        continue;
      }

      await ctx.db.insert("examArchives", {
        ...session,
        sourcePublisher: "دفتر مقررات ملی و کنترل ساختمان",
        sourceDomain: "inbr.ir",
        status: "verified",
        discoveredAt: now,
        lastVerifiedAt: now,
      });
      created += 1;
    }

    const seedDocuments = async (
      archiveKey: string,
      documents: readonly (readonly [string, string, string | null, string])[],
    ) => {
      const archive = await ctx.db
        .query("examArchives")
        .withIndex("by_key", (index) => index.eq("key", archiveKey))
        .unique();
      if (!archive) return;

      for (const [title, discipline, qualification, sourceUrl] of documents) {
        const current = await ctx.db
          .query("examArchiveDocuments")
          .withIndex("by_archiveId_and_sourceUrl", (index) =>
            index.eq("archiveId", archive._id).eq("sourceUrl", sourceUrl),
          )
          .unique();
        if (current) continue;

        await ctx.db.insert("examArchiveDocuments", {
          archiveId: archive._id,
          kind: "question-booklet",
          title,
          discipline,
          ...(qualification ? { qualification } : {}),
          sourceUrl,
          sourcePublisher: "دفتر مقررات ملی و کنترل ساختمان",
          status: "verified",
          discoveredAt: now,
          lastVerifiedAt: now,
        });
      }
    };

    await seedDocuments("inbr-khordad-1404", KHORDAD_1404_DOCUMENTS);
    await seedDocuments("inbr-aban-1403", ABAN_1403_DOCUMENTS);
    await seedDocuments("inbr-mordad-1403", MORDAD_1403_DOCUMENTS);
    await seedDocuments("inbr-mehr-1402", MEHR_1402_DOCUMENTS);

    return { created, existing };
  },
});

export const seedVerifiedKhordad1404Question = mutation({
  args: {},
  returns: v.object({
    questionId: v.id("examQuestionReferences"),
    operation: v.union(v.literal("created"), v.literal("updated")),
    analysisReady: v.literal(true),
  }),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const verified = VERIFIED_KHORDAD_1404_QUESTION;
    let archive = await ctx.db
      .query("examArchives")
      .withIndex("by_key", (index) => index.eq("key", verified.archiveKey))
      .unique();

    if (!archive) {
      const archiveId = await ctx.db.insert("examArchives", {
        key: verified.archiveKey,
        title: "نمونه سؤالات آزمون مهندسی خردادماه ۱۴۰۴",
        yearLabel: "۱۴۰۴",
        sessionLabel: "خردادماه",
        officialPageUrl: "https://inbr.ir/نمونه-سوالات-آزمون-مهندسی-خرداد-1404/",
        sourcePublisher: "دفتر مقررات ملی و کنترل ساختمان",
        sourceDomain: "inbr.ir",
        status: "verified",
        discoveredAt: now,
        lastVerifiedAt: now,
      });
      archive = (await ctx.db.get(archiveId))!;
    }

    let booklet = await ctx.db
      .query("examArchiveDocuments")
      .withIndex("by_archiveId_and_sourceUrl", (index) =>
        index.eq("archiveId", archive._id).eq("sourceUrl", verified.sourceUrl),
      )
      .unique();
    if (!booklet) {
      const bookletId = await ctx.db.insert("examArchiveDocuments", {
        archiveId: archive._id,
        kind: "question-booklet",
        title: verified.bookletTitle,
        discipline: verified.discipline,
        qualification: verified.qualification,
        sourceUrl: verified.sourceUrl,
        sourcePublisher: "دفتر مقررات ملی و کنترل ساختمان",
        status: "verified",
        discoveredAt: now,
        lastVerifiedAt: now,
      });
      booklet = (await ctx.db.get(bookletId))!;
    }

    const existing = await ctx.db
      .query("examQuestionReferences")
      .withIndex("by_archiveDocumentId_and_questionNumber", (index) =>
        index.eq("archiveDocumentId", booklet._id).eq("questionNumber", verified.questionNumber),
      )
      .unique();
    const record = {
      archiveDocumentId: booklet._id,
      questionNumber: verified.questionNumber,
      discipline: verified.discipline,
      qualification: verified.qualification,
      topicCode: verified.topicCode,
      topicTitle: verified.topicTitle,
      sourcePage: verified.sourcePage,
      sourceExcerpt: verified.stem,
      stem: verified.stem,
      options: [...verified.options],
      officialCorrectIndex: verified.officialCorrectIndex,
      sourceEdition: verified.sourceEdition,
      officialAnswerSourceUrl: verified.officialAnswerSourceUrl,
      analysisStatus: verified.analysisStatus,
      createdAt: existing?.createdAt ?? now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, record);
      return { questionId: existing._id, operation: "updated" as const, analysisReady: true as const };
    }
    const questionId = await ctx.db.insert("examQuestionReferences", record);
    return { questionId, operation: "created" as const, analysisReady: true as const };
  },
});
