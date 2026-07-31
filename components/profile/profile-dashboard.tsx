"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { SignOutButton, useAuth as useClerkAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import {
  BadgeCheck,
  CalendarClock,
  Crown,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useCurrentAccount } from "@/features/auth/convex-repository";
import {
  roleLabels,
  subscriptionStatusLabels,
  userStatusLabels,
} from "@/features/auth/domain";
import {
  GlassPanel,
  MetricCard,
  PageHeader,
  StatusBadge,
} from "@/components/ui/civilmind";

export default function ProfileDashboard() {
  const account = useCurrentAccount();
  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn } = useClerkAuth();
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const claimInitialAdmin = useMutation(api.users.claimInitialAdmin);
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await completeOnboarding({ displayName });
      setDisplayName("");
      setMessage("پروفایل با موفقیت تکمیل شد.");
    } catch {
      setMessage("نام واردشده معتبر نیست یا ذخیره‌سازی انجام نشد.");
    } finally {
      setSubmitting(false);
    }
  }

  async function bootstrapAdmin() {
    setSubmitting(true);
    setMessage(null);
    try {
      await claimInitialAdmin({});
      setMessage("دسترسی مدیر اولیه فعال شد.");
    } catch {
      setMessage(
        "فعال‌سازی مدیر انجام نشد. ایمیل تأییدشده، تنظیم محیط و نبود مدیر قبلی بررسی می‌شود.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (account.loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="پروفایل"
          title="در حال آماده‌سازی حساب"
          description="هویت احراز شده و پروفایل امن Convex در حال همگام‌سازی است."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!account.isAuthenticated) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="پروفایل"
          title="برای مشاهده پروفایل وارد شوید"
          description="اطلاعات شخصی، پلن و دسترسی‌ها فقط پس از احراز هویت نمایش داده می‌شوند."
        />
        <GlassPanel className="py-12 text-center">
          <UserRound className="mx-auto size-10 text-blue-300" />
          <h2 className="mt-4 text-xl font-bold text-white">حساب کاربری متصل نیست</h2>
          <p className="mx-auto mt-2 max-w-lg leading-7 text-slate-400">
            CivilMind هیچ داده هویتی ساختگی نمایش نمی‌دهد. برای ساخت یا مشاهده حساب
            وارد سامانه شوید.
          </p>
          {clerkLoaded && clerkSignedIn ? (
            <SignOutButton redirectUrl="/sign-in">
              <button
                type="button"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-bold text-white hover:bg-blue-400"
              >
                <LogOut className="size-4" />
                بازنشانی نشست و ورود دوباره
              </button>
            </SignOutButton>
          ) : (
            <Link
              href="/sign-in"
              className="mt-6 inline-flex rounded-xl bg-blue-500 px-5 py-3 text-sm font-bold text-white hover:bg-blue-400"
            >
              ورود امن
            </Link>
          )}
        </GlassPanel>
      </div>
    );
  }

  if (account.provisionError || !account.user) {
    return (
      <GlassPanel className="border-red-400/20 bg-red-400/5 py-12 text-center">
        <h2 className="font-bold text-red-200">پروفایل در دسترس نیست</h2>
        <p className="mt-2 text-sm text-red-100/70">
          اتصال هویت برقرار است، اما ایجاد پروفایل Backend کامل نشد. نشست را بازنشانی
          کنید و دوباره وارد شوید.
        </p>
        <SignOutButton redirectUrl="/sign-in">
          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white hover:bg-red-400"
          >
            <LogOut className="size-4" />
            بازنشانی نشست و ورود دوباره
          </button>
        </SignOutButton>
      </GlassPanel>
    );
  }

  const user = account.user;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="پروفایل"
        title={user.displayName ?? "پروفایل مهندس"}
        description="هویت، سطح دسترسی و وضعیت اشتراک شما از Backend امن CivilMind خوانده می‌شود."
        action={
          <SignOutButton redirectUrl="/dashboard">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5"
            >
              <LogOut className="size-4" />
              خروج امن
            </button>
          </SignOutButton>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="سطح دسترسی"
          value={roleLabels[user.role]}
          detail="بررسی‌شده در Convex Backend"
          icon={ShieldCheck}
          tone={user.role === "admin" ? "violet" : "blue"}
        />
        <MetricCard
          label="پلن حساب"
          value={user.plan === "premium" ? "حرفه‌ای" : "رایگان"}
          detail={subscriptionStatusLabels[user.subscriptionStatus]}
          icon={Crown}
          tone={user.plan === "premium" ? "amber" : "green"}
        />
        <MetricCard
          label="وضعیت حساب"
          value={userStatusLabels[user.status]}
          detail={user.onboardingCompleted ? "پروفایل تکمیل شده" : "نیازمند تکمیل پروفایل"}
          icon={BadgeCheck}
          tone={user.status === "active" ? "green" : "amber"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <GlassPanel>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">اطلاعات حساب</h2>
              <p className="mt-1 text-sm text-slate-500">
                اطلاعات حساس هویتی و شناسه‌های داخلی نمایش داده نمی‌شوند.
              </p>
            </div>
            <StatusBadge tone={user.role === "admin" ? "info" : "success"}>
              {roleLabels[user.role]}
            </StatusBadge>
          </div>
          <dl className="mt-6 divide-y divide-white/10 text-sm">
            <div className="flex justify-between gap-4 py-4">
              <dt className="text-slate-500">نام نمایشی</dt>
              <dd className="font-semibold text-slate-200">{user.displayName ?? "ثبت نشده"}</dd>
            </div>
            <div className="flex justify-between gap-4 py-4">
              <dt className="text-slate-500">ایمیل</dt>
              <dd className="font-semibold text-slate-200">{user.email ?? "در دسترس نیست"}</dd>
            </div>
            <div className="flex justify-between gap-4 py-4">
              <dt className="text-slate-500">تاریخ ایجاد حساب</dt>
              <dd className="font-semibold text-slate-200">
                {new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(
                  new Date(user.createdAt),
                )}
              </dd>
            </div>
          </dl>
        </GlassPanel>

        <GlassPanel>
          <div className="flex items-center gap-3">
            <CalendarClock className="size-5 text-blue-300" />
            <h2 className="font-bold text-white">تکمیل پروفایل</h2>
          </div>
          <form onSubmit={submitProfile} className="mt-5 space-y-4">
            <label className="block text-sm text-slate-400">
              نام نمایشی
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                minLength={2}
                maxLength={80}
                required
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-blue-400/30 focus:ring"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-blue-500 px-4 py-3 text-sm font-bold text-white hover:bg-blue-400 disabled:opacity-50"
            >
              ذخیره پروفایل
            </button>
          </form>

          {user.role !== "admin" && (
            <button
              type="button"
              onClick={bootstrapAdmin}
              disabled={submitting}
              className="mt-3 w-full rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 py-3 text-sm font-bold text-violet-200 hover:bg-violet-400/15 disabled:opacity-50"
            >
              فعال‌سازی مدیر اولیه
            </button>
          )}
          <button
            type="button"
            disabled
            className="mt-3 w-full rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-200 opacity-70"
          >
            ارتقا به پلن حرفه‌ای — در حال توسعه
          </button>
          {message && <p className="mt-4 text-sm leading-6 text-slate-300">{message}</p>}
        </GlassPanel>
      </div>
    </div>
  );
}
