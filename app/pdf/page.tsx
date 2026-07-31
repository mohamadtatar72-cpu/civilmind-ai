"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  BookOpenCheck,
  FileCheck2,
  FileClock,
  Search,
  ShieldCheck,
} from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import {
  EmptyState,
  GlassPanel,
  PageHeader,
  SectionTitle,
  StatusBadge,
} from "@/components/ui/civilmind";
import { api } from "@/convex/_generated/api";

const lifecycleLabels = {
  registered: "ثبت‌شده",
  processing: "در حال پردازش",
  ready: "آماده",
  failed: "ناموفق",
  quarantined: "قرنطینه",
  archived: "بایگانی",
} as const;

const visibilityLabels = {
  private: "خصوصی",
  premium: "پریمیوم",
  public: "عمومی",
} as const;

type PdfDocument = {
  id: string;
  title: string;
  fileName: string;
  byteLength: number;
  checksumSha256: string;
  visibility: keyof typeof visibilityLabels;
  lifecycle: keyof typeof lifecycleLabels;
  sourceUrl?: string;
  pageCount?: number;
  activeVersion: number;
  updatedAt: number;
};

type Citation = {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  pageNumber: number;
  citationLabel: string;
  excerpt: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1_000) return `${bytes.toLocaleString("fa-IR")} بایت`;
  if (bytes < 1_000_000) {
    return `${(bytes / 1_000).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} کیلوبایت`;
  }
  return `${(bytes / 1_000_000).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} مگابایت`;
}

export default function PdfLibraryPage() {
  const documents = useQuery(api.pdfLibrary.listAccessible, {
    limit: 50,
  }) as PdfDocument[] | undefined;
  const retrieve = useMutation(api.pdfLibrary.searchWithCitations);
  const [query, setQuery] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = query.replace(/\s+/g, " ").trim();
    if (normalized.length < 2) {
      setMessage("برای جست‌وجو حداقل دو نویسه وارد کن.");
      return;
    }

    setSearching(true);
    setMessage(null);
    try {
      const result = await retrieve({ query: normalized, limit: 10 });
      setCitations(result.citations as Citation[]);
      setMessage(
        result.citations.length === 0
          ? "در اسناد قابل‌دسترسی نتیجه‌ای پیدا نشد."
          : `${result.citations.length.toLocaleString("fa-IR")} ارجاع معتبر پیدا شد.`,
      );
    } catch {
      setCitations([]);
      setMessage("جست‌وجوی Citation انجام نشد؛ وضعیت ورود و اتصال Convex بررسی شود.");
    } finally {
      setSearching(false);
    }
  }

  const readyCount = documents?.filter((document) => document.lifecycle === "ready").length;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Smart PDF • Citation Retrieval"
          title="کتابخانه PDF با منبع و شماره صفحه"
          description="اسناد پس از ثبت Checksum، پردازش کنترل‌شده و بررسی مجوز در دسترس قرار می‌گیرند؛ پاسخ بدون Citation نمایش داده نمی‌شود."
          action={
            <StatusBadge tone="success">
              {documents === undefined
                ? "در حال دریافت"
                : `${(readyCount ?? 0).toLocaleString("fa-IR")} سند آماده`}
            </StatusBadge>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <GlassPanel>
            <ShieldCheck className="size-7 text-emerald-300" />
            <h2 className="mt-4 font-bold text-white">Deduplication امن</h2>
            <p className="mt-2 text-sm leading-7 text-slate-400">
              هر سند با SHA-256 ثبت می‌شود و نسخه تکراری پیش از پردازش شناسایی خواهد شد.
            </p>
          </GlassPanel>
          <GlassPanel>
            <FileClock className="size-7 text-blue-300" />
            <h2 className="mt-4 font-bold text-white">Processing Ledger</h2>
            <p className="mt-2 text-sm leading-7 text-slate-400">
              مرحله، تلاش مجدد و خطای پاک‌سازی‌شده هر پردازش در Backend ثبت می‌شود.
            </p>
          </GlassPanel>
          <GlassPanel>
            <BookOpenCheck className="size-7 text-violet-300" />
            <h2 className="mt-4 font-bold text-white">Citation اجباری</h2>
            <p className="mt-2 text-sm leading-7 text-slate-400">
              نتیجه بازیابی شامل نام سند، شماره صفحه و برچسب ارجاع قابل پیگیری است.
            </p>
          </GlassPanel>
        </div>

        <GlassPanel>
          <SectionTitle
            title="جست‌وجوی هوشمند داخل PDFها"
            description="متن پرسش در Database ذخیره نمی‌شود؛ فقط یک اثرانگشت غیرقابل‌بازخوانی برای Audit ثبت می‌شود."
          />
          <form onSubmit={submitSearch} className="flex flex-col gap-3 md:flex-row">
            <label className="sr-only" htmlFor="pdf-search">
              جست‌وجوی داخل PDFها
            </label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-slate-500" />
              <input
                id="pdf-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                maxLength={300}
                placeholder="مثلاً ضوابط وصله میلگرد در کدام صفحه آمده است؟"
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 py-3 pl-4 pr-12 text-sm text-white outline-none ring-blue-400/30 focus:ring"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-bold text-white hover:bg-blue-400 disabled:opacity-50"
            >
              {searching ? "در حال جست‌وجو..." : "جست‌وجو با Citation"}
            </button>
          </form>
          {message && <p className="mt-3 text-sm text-slate-400">{message}</p>}

          {citations.length > 0 && (
            <div className="mt-5 space-y-3">
              {citations.map((citation) => (
                <article
                  key={citation.chunkId}
                  className="rounded-xl border border-white/10 bg-black/15 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-bold text-white">{citation.documentTitle}</h3>
                    <StatusBadge tone="info">
                      صفحه {citation.pageNumber.toLocaleString("fa-IR")}
                    </StatusBadge>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                    {citation.excerpt}
                  </p>
                  <p className="mt-3 text-xs font-semibold text-blue-300">
                    {citation.citationLabel}
                  </p>
                </article>
              ))}
            </div>
          )}
        </GlassPanel>

        {documents === undefined ? (
          <GlassPanel>
            <div role="status" className="h-40 animate-pulse rounded-xl bg-white/6">
              <span className="sr-only">در حال دریافت اسناد…</span>
            </div>
          </GlassPanel>
        ) : documents.length === 0 ? (
          <EmptyState
            title="هنوز سند پردازش‌شده‌ای وجود ندارد"
            description="Registry و Processing Ledger آماده‌اند؛ اسناد فقط از مسیر پردازش مورد اعتماد و پس از کنترل امنیتی وارد کتابخانه می‌شوند."
          />
        ) : (
          <GlassPanel>
            <SectionTitle
              title="اسناد قابل‌دسترسی"
              description="نمایش هر سند مطابق مالکیت، نقش حساب و سطح دسترسی انجام می‌شود."
            />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {documents.map((document) => (
                <article
                  key={document.id}
                  className="rounded-xl border border-white/8 bg-black/10 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <FileCheck2 className="mt-1 size-6 shrink-0 text-emerald-300" />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-bold text-slate-100">
                        {document.title}
                      </h2>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {document.fileName}
                      </p>
                    </div>
                    <StatusBadge tone="success">
                      {lifecycleLabels[document.lifecycle]}
                    </StatusBadge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <span>{visibilityLabels[document.visibility]}</span>
                    <span>{formatBytes(document.byteLength)}</span>
                    <span>
                      {document.pageCount
                        ? `${document.pageCount.toLocaleString("fa-IR")} صفحه`
                        : "تعداد صفحه نامشخص"}
                    </span>
                    <span>نسخه {document.activeVersion.toLocaleString("fa-IR")}</span>
                  </div>
                  <p className="mt-3 truncate font-mono text-[10px] text-slate-600" dir="ltr">
                    SHA-256: {document.checksumSha256}
                  </p>
                </article>
              ))}
            </div>
          </GlassPanel>
        )}
      </div>
    </AppShell>
  );
}
