"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentAccount } from "@/features/auth/convex-repository";
import { AdminAccess } from "./admin-access";
import {
  GlassPanel,
  PageHeader,
  StatusBadge,
} from "@/components/ui/civilmind";

type AuditEntry = {
  id: string;
  actorUserId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  result: "success" | "denied" | "failure";
  metadata?: unknown;
  createdAt: number;
};

const resultLabels = {
  success: "موفق",
  denied: "ردشده",
  failure: "ناموفق",
} as const;

export default function AdminAuditLog() {
  const account = useCurrentAccount();
  const logs = useQuery(
    api.auditLogs.adminListRecent,
    account.isAdmin ? { limit: 100 } : "skip",
  ) as AuditEntry[] | undefined;

  return (
    <AdminAccess>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin • Audit"
          title="گزارش رویدادهای حساس"
          description="تغییر نقش، وضعیت حساب، Claim مدیر و تصمیم‌های منابع رسمی با نتیجه عملیات ثبت می‌شوند."
        />
        {!logs ? (
          <div className="h-56 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
        ) : logs.length === 0 ? (
          <GlassPanel className="py-12 text-center text-slate-400">
            هنوز رویداد حساسی ثبت نشده است.
          </GlassPanel>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <GlassPanel key={log.id} className="py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-mono text-sm font-bold text-white">{log.action}</h2>
                      <StatusBadge
                        tone={
                          log.result === "success"
                            ? "success"
                            : log.result === "denied"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {resultLabels[log.result]}
                      </StatusBadge>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {log.resourceType}
                      {log.resourceId ? ` • ${log.resourceId}` : ""}
                    </p>
                    {log.metadata !== undefined && (
                      <pre className="mt-3 max-w-full overflow-x-auto rounded-xl bg-slate-950/70 p-3 text-left text-xs leading-6 text-slate-400" dir="ltr">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                  <time className="shrink-0 text-xs text-slate-500">
                    {new Intl.DateTimeFormat("fa-IR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(log.createdAt))}
                  </time>
                </div>
              </GlassPanel>
            ))}
          </div>
        )}
      </div>
    </AdminAccess>
  );
}
