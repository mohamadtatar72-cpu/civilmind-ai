"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Archive, FileSearch, ShieldAlert, ShieldCheck } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useCurrentAccount } from "@/features/auth/convex-repository";
import { AdminAccess } from "./admin-access";
import {
  GlassPanel,
  PageHeader,
  SectionTitle,
  StatusBadge,
} from "@/components/ui/civilmind";

type QuarantinedDocument = {
  id: string;
  title: string;
  fileName: string;
  byteLength: number;
  checksumSha256: string;
  visibility: "private" | "premium" | "public";
  lifecycle: "quarantined";
  quarantineReason?: string;
  updatedAt: number;
};

type ProcessingJob = {
  id: string;
  documentId: string;
  attempt: number;
  status: "queued" | "running" | "completed" | "failed" | "quarantined" | "cancelled";
  stage: "register" | "extract" | "chunk" | "index";
  errorCode?: string;
  errorMessage?: string;
  createdAt: number;
};

const statusLabels = {
  queued: "در صف",
  running: "در حال اجرا",
  completed: "کامل",
  failed: "ناموفق",
  quarantined: "قرنطینه",
  cancelled: "لغوشده",
} as const;

const stageLabels = {
  register: "ثبت",
  extract: "استخراج",
  chunk: "قطعه‌بندی",
  index: "ایندکس",
} as const;

export default function PdfReviewDashboard() {
  const account = useCurrentAccount();
  const documents = useQuery(
    api.pdfLibrary.adminListQuarantined,
    account.isAdmin ? { limit: 50 } : "skip",
  ) as QuarantinedDocument[] | undefined;
  const jobs = useQuery(
    api.pdfLibrary.adminListRecentJobs,
    account.isAdmin ? { limit: 30 } : "skip",
  ) as ProcessingJob[] | undefined;
  const review = useMutation(api.pdfLibrary.adminReviewQuarantine);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function submitDecision(
    document: QuarantinedDocument,
    decision: "release" | "archive",
  ) {
    const note = notes[document.id]?.replace(/\s+/g, " ").trim() ?? "";
    if (note.length < 3) {
      setMessage("برای تصمیم مدیر، توضیح کوتاه لازم است.");
      return;
    }

    setWorkingId(document.id);
    setMessage(null);
    try {
      await review({
        documentId: document.id as Id<"pdfDocuments">,
        decision,
        note,
      });
      setMessage(
        decision === "release"
          ? "سند از قرنطینه خارج و برای پردازش مجدد آماده شد."
          : "سند بایگانی شد و وارد کتابخانه فعال نخواهد شد.",
      );
    } catch {
      setMessage("ثبت تصمیم انجام نشد؛ وضعیت سند و دسترسی مدیر بررسی شود.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <AdminAccess>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin • PDF Governance"
          title="کنترل اسناد PDF و صف قرنطینه"
          description="فقط مدیر می‌تواند درباره سند قرنطینه‌شده تصمیم بگیرد؛ آزادسازی نیز فایل را مستقیم منتشر نمی‌کند و فقط آن را به مرحله ثبت بازمی‌گرداند."
          action={<StatusBadge tone="warning">انتشار خودکار غیرفعال</StatusBadge>}
        />

        {message && <GlassPanel className="py-3 text-sm text-slate-200">{message}</GlassPanel>}

        <div className="grid gap-4 md:grid-cols-3">
          <GlassPanel>
            <ShieldAlert className="size-7 text-amber-300" />
            <p className="mt-4 text-2xl font-black text-white">
              {documents?.length.toLocaleString("fa-IR") ?? "—"}
            </p>
            <p className="mt-1 text-sm text-slate-500">سند در قرنطینه</p>
          </GlassPanel>
          <GlassPanel>
            <FileSearch className="size-7 text-blue-300" />
            <p className="mt-4 text-2xl font-black text-white">
              {jobs?.filter((job) => ["queued", "running"].includes(job.status)).length.toLocaleString("fa-IR") ?? "—"}
            </p>
            <p className="mt-1 text-sm text-slate-500">پردازش فعال</p>
          </GlassPanel>
          <GlassPanel>
            <ShieldCheck className="size-7 text-emerald-300" />
            <p className="mt-4 text-2xl font-black text-white">۳</p>
            <p className="mt-1 text-sm text-slate-500">حداکثر تلاش مجدد</p>
          </GlassPanel>
        </div>

        <GlassPanel>
          <SectionTitle
            title="اسناد نیازمند تصمیم مدیر"
            description="Checksum، دلیل قرنطینه و سابقه تصمیم در Audit Log ثبت می‌شود."
          />
          {!documents ? (
            <div className="h-32 animate-pulse rounded-xl bg-white/[0.04]" />
          ) : documents.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              سندی در صف قرنطینه وجود ندارد.
            </p>
          ) : (
            <div className="space-y-4">
              {documents.map((document) => (
                <article
                  key={document.id}
                  className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-white">{document.title}</h3>
                        <StatusBadge tone="warning">قرنطینه</StatusBadge>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">{document.fileName}</p>
                      <p className="mt-3 text-sm leading-7 text-amber-100/75">
                        {document.quarantineReason ?? "دلیل امنیتی ثبت شده و نیازمند بررسی مدیر است."}
                      </p>
                      <p className="mt-3 break-all font-mono text-[10px] text-slate-600" dir="ltr">
                        SHA-256: {document.checksumSha256}
                      </p>
                    </div>
                    <div className="w-full shrink-0 space-y-3 xl:w-80">
                      <textarea
                        value={notes[document.id] ?? ""}
                        onChange={(event) =>
                          setNotes((current) => ({
                            ...current,
                            [document.id]: event.target.value,
                          }))
                        }
                        maxLength={1000}
                        placeholder="توضیح تصمیم مدیر..."
                        className="min-h-24 w-full rounded-xl border border-white/10 bg-slate-950/70 p-3 text-sm text-white outline-none ring-blue-400/30 focus:ring"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={workingId === document.id}
                          onClick={() => submitDecision(document, "release")}
                          className="rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-bold text-white hover:bg-emerald-400 disabled:opacity-50"
                        >
                          آزادسازی کنترل‌شده
                        </button>
                        <button
                          type="button"
                          disabled={workingId === document.id}
                          onClick={() => submitDecision(document, "archive")}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-700 px-3 py-2.5 text-sm font-bold text-white hover:bg-slate-600 disabled:opacity-50"
                        >
                          <Archive className="size-4" />
                          بایگانی
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </GlassPanel>

        <GlassPanel>
          <SectionTitle
            title="Processing Ledger اخیر"
            description="خطاهای نمایش‌داده‌شده Sanitized هستند و شامل متن PDF یا Secret نیستند."
          />
          {!jobs ? (
            <div className="h-28 animate-pulse rounded-xl bg-white/[0.04]" />
          ) : jobs.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">هنوز پردازشی ثبت نشده است.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-right text-sm">
                <thead className="text-xs text-slate-500">
                  <tr className="border-b border-white/10">
                    <th className="px-3 py-3">زمان</th>
                    <th className="px-3 py-3">مرحله</th>
                    <th className="px-3 py-3">وضعیت</th>
                    <th className="px-3 py-3">تلاش</th>
                    <th className="px-3 py-3">کد خطا</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b border-white/5 text-slate-300">
                      <td className="px-3 py-3">{new Date(job.createdAt).toLocaleString("fa-IR")}</td>
                      <td className="px-3 py-3">{stageLabels[job.stage]}</td>
                      <td className="px-3 py-3">{statusLabels[job.status]}</td>
                      <td className="px-3 py-3">{job.attempt.toLocaleString("fa-IR")}</td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-500">
                        {job.errorCode ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassPanel>
      </div>
    </AdminAccess>
  );
}
