"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { LockKeyhole, ShieldAlert } from "lucide-react";
import { useCurrentAccount } from "@/features/auth/convex-repository";
import { GlassPanel } from "@/components/ui/civilmind";

export function AdminAccess({ children }: { children: ReactNode }) {
  const account = useCurrentAccount();

  if (account.loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]"
          />
        ))}
      </div>
    );
  }

  if (!account.isAuthenticated) {
    return (
      <GlassPanel className="py-14 text-center">
        <LockKeyhole className="mx-auto size-10 text-blue-300" />
        <h2 className="mt-4 text-xl font-bold text-white">ورود مدیر لازم است</h2>
        <p className="mx-auto mt-2 max-w-lg leading-7 text-slate-400">
          برای مشاهده مرکز مدیریت ابتدا وارد حساب شوید. ورود به‌تنهایی دسترسی مدیر
          ایجاد نمی‌کند.
        </p>
        <Link
          href="/sign-in"
          className="mt-6 inline-flex rounded-xl bg-blue-500 px-5 py-3 text-sm font-bold text-white hover:bg-blue-400"
        >
          ورود امن
        </Link>
      </GlassPanel>
    );
  }

  if (!account.isAdmin) {
    return (
      <GlassPanel className="border-red-400/20 bg-red-400/5 py-14 text-center">
        <ShieldAlert className="mx-auto size-10 text-red-300" />
        <h2 className="mt-4 text-xl font-bold text-red-100">دسترسی غیرمجاز</h2>
        <p className="mx-auto mt-2 max-w-xl leading-7 text-red-100/65">
          نقش فعلی حساب اجازه مشاهده ابزارهای مدیریتی را ندارد. این محدودیت علاوه بر
          رابط کاربری، در تمام توابع Convex نیز اعمال می‌شود.
        </p>
      </GlassPanel>
    );
  }

  return children;
}
