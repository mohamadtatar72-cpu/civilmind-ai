"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import AppShell from "@/components/layout/app-shell";
import { GlassPanel, PageHeader, StatusBadge } from "@/components/ui/civilmind";
import { api } from "@/convex/_generated/api";
import { useCurrentAccount } from "@/features/auth/convex-repository";

type SeedResult = {
  questionId: string;
  operation: "created" | "updated";
  analysisReady: true;
};

export default function SettingsPage() {
  const account = useCurrentAccount();
  const entitlement = useQuery(
    api.access.current,
    account.isAuthenticated ? {} : "skip",
  );
  const persistedSync = useQuery(
    api.dataSync.current,
    account.isAuthenticated ? {} : "skip",
  );
  const syncNow = useMutation(api.dataSync.syncNow);
  const seedVerifiedQuestion = useMutation(
    api.examArchives.seedVerifiedKhordad1404Question,
  );
  const [syncing, setSyncing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  const syncState = account.loading
    ? ["همگام‌سازی داده‌ها", "در حال اتصال ایمن به Convex…", "در حال بررسی"]
    : account.isAuthenticated
      ? [
          "همگام‌سازی داده‌ها",
          persistedSync
            ? `${persistedSync.studySessions.toLocaleString("fa-IR")} مطالعه، ${persistedSync.practiceAttempts.toLocaleString("fa-IR")} آزمون و ${persistedSync.plannerTasks.toLocaleString("fa-IR")} برنامه از Convex همگام شده‌اند.`
            : `حساب ${entitlement?.tier === "admin" ? "مدیر" : "کاربر"} متصل است؛ برای ثبت اولین همگام‌سازی، دکمهٔ زیر را بزنید.`,
          persistedSync?.status === "completed" ? "همگام شد" : "آماده همگام‌سازی",
        ]
      : [
          "همگام‌سازی داده‌ها",
          "برای همگام‌سازی پروفایل، انتخاب رشته و تاریخچهٔ شخصی وارد حساب شوید.",
          "نیازمند ورود",
        ];

  const settings = [
    ["زبان و جهت نمایش", "فارسی — راست‌به‌چپ", "فعال"],
    ["اعلان‌های برنامه مطالعه", "پس از اتصال حساب کاربری قابل تنظیم است", "در حال توسعه"],
    syncState,
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="تنظیمات"
          title="تنظیم تجربه CivilMind"
          description="وضعیت تنظیمات پایه و اتصال ایمن داده‌های شخصی."
        />

        <GlassPanel className="divide-y divide-white/8 p-0">
          {settings.map(([title, description, status]) => (
            <div key={title} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold">{title}</h2>
                <p className="mt-1 text-sm text-slate-400">{description}</p>
              </div>
              <StatusBadge tone={status === "فعال" || status === "متصل" ? "success" : "info"}>{status}</StatusBadge>
            </div>
          ))}
        </GlassPanel>

        {account.isAuthenticated && (
          <GlassPanel className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-7 text-slate-300">همگام‌سازی واقعی، شمار و وضعیت داده‌های شخصی ذخیره‌شده در Convex را ثبت می‌کند.</p>
            <button
              type="button"
              disabled={syncing}
              onClick={async () => {
                setSyncing(true);
                try {
                  await syncNow();
                } finally {
                  setSyncing(false);
                }
              }}
              className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-400 disabled:opacity-50"
            >
              {syncing ? "در حال همگام‌سازی…" : "همگام‌سازی اکنون"}
            </button>
          </GlassPanel>
        )}

        {entitlement?.tier === "admin" && (
          <GlassPanel className="space-y-4 border border-amber-300/20">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">ابزار امن مدیر</p>
                <h2 className="mt-2 text-lg font-black text-white">ثبت سؤال رسمی خرداد ۱۴۰۴</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                  این عملیات فقط برای مدیر اجرا می‌شود و سؤال تأییدشده دفترچه ۲۱۵A را به‌صورت تکرارپذیر در Convex ایجاد یا به‌روزرسانی می‌کند.
                </p>
              </div>
              <button
                type="button"
                disabled={seeding}
                onClick={async () => {
                  setSeeding(true);
                  setSeedError(null);
                  try {
                    const result = await seedVerifiedQuestion();
                    setSeedResult({
                      questionId: String(result.questionId),
                      operation: result.operation,
                      analysisReady: result.analysisReady,
                    });
                  } catch (error) {
                    setSeedResult(null);
                    setSeedError(error instanceof Error ? error.message : "اجرای Seed ناموفق بود.");
                  } finally {
                    setSeeding(false);
                  }
                }}
                className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {seeding ? "در حال ثبت…" : "ثبت سؤال رسمی خرداد ۱۴۰۴"}
              </button>
            </div>

            {seedResult ? (
              <div className="rounded-xl border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm leading-7 text-emerald-100">
                <p className="font-black">ثبت با موفقیت انجام شد.</p>
                <p>عملیات: {seedResult.operation === "created" ? "ایجاد" : "به‌روزرسانی"}</p>
                <p>آماده تحلیل AI: {seedResult.analysisReady ? "بله" : "خیر"}</p>
                <p className="break-all text-xs text-emerald-200/80">شناسه سؤال: {seedResult.questionId}</p>
              </div>
            ) : null}

            {seedError ? (
              <div className="rounded-xl border border-rose-300/25 bg-rose-400/10 p-4 text-sm leading-7 text-rose-100">
                <p className="font-black">ثبت سؤال انجام نشد.</p>
                <p className="mt-1 break-words">{seedError}</p>
              </div>
            ) : null}
          </GlassPanel>
        )}
      </div>
    </AppShell>
  );
}
