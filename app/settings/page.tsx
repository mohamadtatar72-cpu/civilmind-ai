"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import AppShell from "@/components/layout/app-shell";
import { GlassPanel, PageHeader, StatusBadge } from "@/components/ui/civilmind";
import { api } from "@/convex/_generated/api";
import { useCurrentAccount } from "@/features/auth/convex-repository";

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
  const [syncing, setSyncing] = useState(false);
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
                try { await syncNow(); } finally { setSyncing(false); }
              }}
              className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-400 disabled:opacity-50"
            >
              {syncing ? "در حال همگام‌سازی…" : "همگام‌سازی اکنون"}
            </button>
          </GlassPanel>
        )}
      </div>
    </AppShell>
  );
}
