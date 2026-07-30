"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useCurrentAccount } from "@/features/auth/convex-repository";
import { AdminAccess } from "./admin-access";
import {
  GlassPanel,
  PageHeader,
  StatusBadge,
} from "@/components/ui/civilmind";

const riskLabels = {
  low: "کم",
  medium: "متوسط",
  high: "زیاد",
  critical: "بحرانی",
} as const;

const runStatusLabels = {
  queued: "در صف",
  running: "در حال اجرا",
  completed: "کامل",
  partial: "ناقص",
  failed: "ناموفق",
} as const;

type Proposal = {
  id: string;
  sourceKey: string;
  sourceUrl: string;
  title: string;
  summary: string;
  riskLevel: keyof typeof riskLabels;
  securityReport: string;
  contentHash: string;
  status: "pending" | "approved" | "rejected" | "quarantined";
  detectedAt: number;
  diffSummary?: string;
  changeKinds?: string[];
  scanFindings?: string[];
};

type SyncRun = {
  id: string;
  trigger: "manual" | "scheduled";
  status: keyof typeof runStatusLabels;
  startedAt: number;
  completedAt?: number;
  sourceCount: number;
  baselineCount: number;
  unchangedCount: number;
  changedCount: number;
  quarantinedCount: number;
  failedCount: number;
  errorSummary?: string;
};

export default function SourceApprovalsDashboard() {
  const account = useCurrentAccount();
  const proposals = useQuery(
    api.sourceApprovals.adminListReviewQueue,
    account.isAdmin ? { limit: 50 } : "skip",
  ) as Proposal[] | undefined;
  const runs = useQuery(
    api.sourceSync.adminListRuns,
    account.isAdmin ? { limit: 10 } : "skip",
  ) as SyncRun[] | undefined;
  const startSync = useMutation(api.sourceSync.adminStartSync);
  const review = useMutation(api.sourceApprovals.adminReview);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function runGuardedSync() {
    setStarting(true);
    setMessage(null);
    try {
      const result = await startSync({});
      setMessage(
        result.reusedActiveRun
          ? "یک اجرای فعال از قبل وجود داشت؛ همان اجرا ادامه پیدا می‌کند."
          : "همگام‌سازی محافظت‌شده در صف اجرا قرار گرفت.",
      );
    } catch {
      setMessage("شروع همگام‌سازی ممکن نشد؛ سطح دسترسی و اتصال Convex بررسی شود.");
    } finally {
      setStarting(false);
    }
  }

  async function submitDecision(
    proposal: Proposal,
    decision: "approved" | "rejected",
  ) {
    const note = notes[proposal.id]?.trim() ?? "";
    if (note.length < 3) {
      setMessage("برای ثبت تصمیم، توضیح کوتاه مدیر لازم است.");
      return;
    }
    if (proposal.status === "quarantined" && decision === "approved") {
      setMessage("Snapshot قرنطینه‌شده قابل تأیید نیست و باید رد شود.");
      return;
    }

    setWorkingId(proposal.id);
    setMessage(null);
    try {
      await review({
        proposalId: proposal.id as Id<"sourceChangeProposals">,
        decision,
        note,
      });
      setMessage(
        decision === "approved"
          ? "Snapshot سالم به Last-Known-Good ارتقا یافت."
          : "تغییر رد شد و نسخه قبلی فعال باقی ماند.",
      );
    } catch {
      setMessage("ثبت تصمیم انجام نشد؛ وضعیت پیشنهاد یا سطح دسترسی بررسی شود.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <AdminAccess>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin • Guarded Source Sync"
          title="همگام‌سازی محافظت‌شده منابع رسمی"
          description="منابع فقط‌خواندنی پایش می‌شوند؛ هیچ تغییر بدون Snapshot، اسکن امنیتی و تصمیم مدیر منتشر نمی‌شود."
          action={
            <button
              type="button"
              onClick={runGuardedSync}
              disabled={starting}
              className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-400 disabled:opacity-50"
            >
              {starting ? "در حال ثبت..." : "اجرای Sync امن"}
            </button>
          }
        />

        <GlassPanel className="border-emerald-400/20 bg-emerald-400/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm leading-7 text-emerald-100/75">
              موتور Sync فعال است: Allowlist دامنه، HTTPS اجباری، کنترل Redirect، محدودیت حجم، SHA-256، قرنطینه و Last-Known-Good.
            </p>
            <StatusBadge tone="success">انتشار خودکار غیرفعال</StatusBadge>
          </div>
        </GlassPanel>

        {message && (
          <GlassPanel className="py-3 text-sm text-slate-200">{message}</GlassPanel>
        )}

        <GlassPanel>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-white">اجرای اخیر موتور Sync</h2>
              <p className="mt-1 text-sm text-slate-500">پایش زمان‌بندی‌شده هر شش ساعت اجرا می‌شود.</p>
            </div>
            <StatusBadge tone="info">Read Only</StatusBadge>
          </div>
          {!runs ? (
            <div className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
          ) : runs.length === 0 ? (
            <p className="text-sm text-slate-500">هنوز اجرایی ثبت نشده است.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-right text-sm">
                <thead className="text-xs text-slate-500">
                  <tr className="border-b border-white/10">
                    <th className="px-3 py-3">زمان</th>
                    <th className="px-3 py-3">نوع</th>
                    <th className="px-3 py-3">وضعیت</th>
                    <th className="px-3 py-3">پایه</th>
                    <th className="px-3 py-3">بدون تغییر</th>
                    <th className="px-3 py-3">تغییر</th>
                    <th className="px-3 py-3">قرنطینه</th>
                    <th className="px-3 py-3">خطا</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b border-white/5 text-slate-300">
                      <td className="px-3 py-3">{new Date(run.startedAt).toLocaleString("fa-IR")}</td>
                      <td className="px-3 py-3">{run.trigger === "manual" ? "دستی" : "زمان‌بندی"}</td>
                      <td className="px-3 py-3">{runStatusLabels[run.status]}</td>
                      <td className="px-3 py-3">{run.baselineCount}</td>
                      <td className="px-3 py-3">{run.unchangedCount}</td>
                      <td className="px-3 py-3">{run.changedCount}</td>
                      <td className="px-3 py-3">{run.quarantinedCount}</td>
                      <td className="px-3 py-3">{run.failedCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassPanel>

        {!proposals ? (
          <div className="h-56 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
        ) : proposals.length === 0 ? (
          <GlassPanel className="py-12 text-center">
            <h2 className="font-bold text-white">تغییری در صف بررسی وجود ندارد</h2>
            <p className="mt-2 text-sm text-slate-500">
              تغییرات جدید یا موارد قرنطینه‌شده پس از اجرای Sync در این بخش ظاهر می‌شوند.
            </p>
          </GlassPanel>
        ) : (
          <div className="space-y-5">
            {proposals.map((proposal) => (
              <GlassPanel
                key={proposal.id}
                className={proposal.status === "quarantined" ? "border-red-400/25 bg-red-400/5" : undefined}
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-white">{proposal.title}</h2>
                      <StatusBadge tone={proposal.riskLevel === "low" ? "success" : "warning"}>
                        ریسک {riskLabels[proposal.riskLevel]}
                      </StatusBadge>
                      {proposal.status === "quarantined" && (
                        <StatusBadge tone="warning">قرنطینه</StatusBadge>
                      )}
                    </div>
                    <p className="mt-3 leading-7 text-slate-400">{proposal.diffSummary ?? proposal.summary}</p>
                    <a
                      href={proposal.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex text-sm font-bold text-blue-300 hover:text-blue-200"
                    >
                      مشاهده منبع رسمی
                    </a>
                    <details className="mt-4 rounded-xl border border-white/10 bg-slate-950/50 p-4">
                      <summary className="cursor-pointer text-sm font-bold text-slate-200">
                        گزارش لایه‌های محافظتی
                      </summary>
                      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-slate-400">
                        {proposal.securityReport}
                      </pre>
                      {proposal.scanFindings && proposal.scanFindings.length > 0 && (
                        <p className="mt-3 text-xs text-amber-300">
                          یافته‌ها: {proposal.scanFindings.join("، ")}
                        </p>
                      )}
                      <p className="mt-3 break-all font-mono text-[11px] text-slate-600" dir="ltr">
                        SHA-256: {proposal.contentHash}
                      </p>
                    </details>
                  </div>

                  <div className="w-full shrink-0 space-y-3 xl:w-80">
                    <textarea
                      value={notes[proposal.id] ?? ""}
                      onChange={(event) =>
                        setNotes((current) => ({
                          ...current,
                          [proposal.id]: event.target.value,
                        }))
                      }
                      maxLength={1000}
                      placeholder="توضیح تصمیم مدیر..."
                      className="min-h-28 w-full rounded-xl border border-white/10 bg-slate-950/70 p-3 text-sm text-white outline-none ring-blue-400/30 focus:ring"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={workingId === proposal.id || proposal.status === "quarantined"}
                        onClick={() => submitDecision(proposal, "approved")}
                        className="rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-bold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        تأیید و ارتقا
                      </button>
                      <button
                        type="button"
                        disabled={workingId === proposal.id}
                        onClick={() => submitDecision(proposal, "rejected")}
                        className="rounded-xl bg-red-500 px-3 py-2.5 text-sm font-bold text-white hover:bg-red-400 disabled:opacity-50"
                      >
                        رد و حفظ نسخه قبل
                      </button>
                    </div>
                  </div>
                </div>
              </GlassPanel>
            ))}
          </div>
        )}
      </div>
    </AdminAccess>
  );
}
