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

type Proposal = {
  id: string;
  sourceKey: string;
  sourceUrl: string;
  title: string;
  summary: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  securityReport: string;
  contentHash: string;
  status: "pending" | "approved" | "rejected" | "quarantined";
  detectedAt: number;
};

const riskLabels = {
  low: "کم",
  medium: "متوسط",
  high: "زیاد",
  critical: "بحرانی",
} as const;

export default function SourceApprovalsDashboard() {
  const account = useCurrentAccount();
  const proposals = useQuery(
    api.sourceApprovals.adminListPending,
    account.isAdmin ? { limit: 50 } : "skip",
  ) as Proposal[] | undefined;
  const review = useMutation(api.sourceApprovals.adminReview);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function submitDecision(
    proposal: Proposal,
    decision: "approved" | "rejected",
  ) {
    const note = notes[proposal.id]?.trim() ?? "";
    if (note.length < 3) {
      setMessage("برای ثبت تصمیم، توضیح کوتاه مدیر لازم است.");
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
          ? "تغییر تأیید شد و برای مرحله انتشار کنترل‌شده آماده است."
          : "تغییر رد شد و در سابقه تصمیم‌های مدیر ثبت گردید.",
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
          eyebrow="Admin • Official Sources"
          title="تأیید تغییرات منابع رسمی"
          description="هر تغییر ابتدا قرنطینه و بررسی امنیتی می‌شود؛ انتشار مستقیم و بدون تصمیم مدیر مجاز نیست."
          action={<StatusBadge tone="warning">انتشار خودکار غیرفعال</StatusBadge>}
        />

        <GlassPanel className="border-blue-400/20 bg-blue-400/5">
          <p className="text-sm leading-7 text-blue-100/75">
            زیرساخت تأیید منابع آماده است؛ موتور همگام‌سازی محافظت‌شده در Sprint
            بعدی فعال می‌شود. هوش مصنوعی فقط گزارش و پیشنهاد ارائه می‌دهد و حق
            تأیید نهایی ندارد.
          </p>
        </GlassPanel>

        {message && <GlassPanel className="py-3 text-sm text-slate-200">{message}</GlassPanel>}

        {!proposals ? (
          <div className="h-56 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
        ) : proposals.length === 0 ? (
          <GlassPanel className="py-12 text-center">
            <h2 className="font-bold text-white">پیشنهاد در انتظار بررسی وجود ندارد</h2>
            <p className="mt-2 text-sm text-slate-500">
              پس از فعال‌شدن موتور Sync، تغییرات سالم در این صف قرار می‌گیرند.
            </p>
          </GlassPanel>
        ) : (
          <div className="space-y-5">
            {proposals.map((proposal) => (
              <GlassPanel key={proposal.id}>
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-white">{proposal.title}</h2>
                      <StatusBadge
                        tone={
                          proposal.riskLevel === "low"
                            ? "success"
                            : proposal.riskLevel === "medium"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        ریسک {riskLabels[proposal.riskLevel]}
                      </StatusBadge>
                    </div>
                    <p className="mt-3 leading-7 text-slate-400">{proposal.summary}</p>
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
                        disabled={workingId === proposal.id}
                        onClick={() => submitDecision(proposal, "approved")}
                        className="rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-bold text-white hover:bg-emerald-400 disabled:opacity-50"
                      >
                        تأیید
                      </button>
                      <button
                        type="button"
                        disabled={workingId === proposal.id}
                        onClick={() => submitDecision(proposal, "rejected")}
                        className="rounded-xl bg-red-500 px-3 py-2.5 text-sm font-bold text-white hover:bg-red-400 disabled:opacity-50"
                      >
                        رد
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
