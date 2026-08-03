"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Bot,
  CalendarDays,
  ChevronLeft,
  FileQuestion,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  LogIn,
  Menu,
  Network,
  Search,
  Settings,
  ShieldCheck,
  Target,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCurrentAccount } from "@/features/auth/convex-repository";
import { roleLabels } from "@/features/auth/domain";

const publicNavigation = [
  { label: "مرکز مأموریت", description: "Mission Control", href: "/dashboard", icon: LayoutDashboard },
  { label: "مربی هوشمند", description: "AI Coach", href: "/ai", icon: Bot },
  { label: "مرکز مطالعه", description: "Study Center", href: "/planner", icon: CalendarDays },
  { label: "مرکز آزمون", description: "Exam Center", href: "/exam", icon: FileQuestion },
  { label: "تحلیل عملکرد", description: "Analytics", href: "/analytics", icon: BarChart3 },
] as const;

const utilities = [
  { label: "ابرکتابخانه مهندسی", href: "/resources", icon: BookOpen },
  { label: "کتابخانه مقررات", href: "/library", icon: BookOpen },
  { label: "آرشیو سؤال و پاسخ‌نامه", href: "/exam", icon: FileQuestion },
  { label: "مرکز آمادگی", href: "/prediction", icon: Target },
  { label: "جامعه مهندسان", href: "/community", icon: Users },
  { label: "نقشه دانش", href: "/graph", icon: Network },
  { label: "کتابخانه PDF", href: "/pdf", icon: GraduationCap },
  { label: "منابع رسمی", href: "/official-sources", icon: Landmark },
  { label: "جستجوی هوشمند", href: "/search", icon: Search },
  { label: "تنظیمات", href: "/settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
}

function Navigation({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const account = useCurrentAccount();
  const navigation = [
    ...publicNavigation,
    ...(account.isAuthenticated
      ? [
          {
            label: "پروفایل من",
            description: "Profile",
            href: "/profile",
            icon: UserRound,
          },
        ]
      : []),
    ...(account.isAdmin
      ? [
          {
            label: "مدیریت سامانه",
            description: "Admin Control",
            href: "/admin",
            icon: ShieldCheck,
          },
        ]
      : []),
  ];

  return (
    <>
      <div className="border-b border-white/10 p-6">
        <Link href="/dashboard" onClick={onNavigate} className="block">
          <span className="text-xl font-black tracking-tight text-white">CivilMind AI</span>
          <span className="mt-1 block text-xs text-slate-400">سیستم هوشمند آمادگی آزمون‌های مهندسی</span>
        </Link>
        {account.user && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
            <p className="truncate font-bold text-slate-200">
              {account.user.displayName ?? account.user.email ?? "کاربر CivilMind"}
            </p>
            <p className="mt-1 text-slate-500">{roleLabels[account.user.role]}</p>
          </div>
        )}
      </div>

      <nav aria-label="ناوبری اصلی" className="flex-1 space-y-6 overflow-y-auto p-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                  active
                    ? "bg-blue-500/15 text-blue-200 ring-1 ring-blue-400/25"
                    : "text-slate-300 hover:bg-white/6 hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "size-4.5 shrink-0",
                    active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{item.label}</span>
                  <span className="block truncate text-[10px] text-slate-500">{item.description}</span>
                </span>
                <ChevronLeft className="size-3.5 opacity-40" />
              </Link>
            );
          })}
        </div>

        <div>
          <p className="mb-2 px-3 text-[11px] font-bold text-slate-500">ابزارها</p>
          {utilities.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                  active
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/6 hover:text-white",
                )}
              >
                <Icon className="size-4.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        {!account.loading && !account.isAuthenticated && (
          <Link
            href="/sign-in"
            onClick={onNavigate}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-400"
          >
            <LogIn className="size-4" />
            ورود امن
          </Link>
        )}
        <p className="mt-3 text-center text-[11px] text-slate-600">Sprint 1C • Auth & RBAC</p>
      </div>
    </>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-72 flex-col border-l border-white/10 bg-slate-950/80 backdrop-blur-2xl lg:flex">
        <Navigation pathname={pathname} />
      </aside>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 bg-slate-950/75 px-4 backdrop-blur-xl lg:hidden">
        <Link href="/dashboard" className="font-black">CivilMind AI</Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="باز کردن منو"
          className="rounded-xl border border-white/10 p-2"
        >
          <Menu className="size-5" />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="بستن منو"
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 right-0 flex w-[min(88vw,20rem)] flex-col border-l border-white/10 bg-slate-950 shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="بستن منو"
              className="absolute left-4 top-4 z-10 rounded-lg p-2 text-slate-400 hover:bg-white/10"
            >
              <X className="size-5" />
            </button>
            <Navigation pathname={pathname} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
      <main className="min-w-0 lg:mr-72">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
