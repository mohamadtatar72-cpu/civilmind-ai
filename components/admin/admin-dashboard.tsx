"use client";

import Link from "next/link";
import {
  Bot,
  ClipboardCheck,
  FileClock,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AdminAccess } from "./admin-access";
import { GlassPanel, PageHeader, StatusBadge } from "@/components/ui/civilmind";

const sections = [
  {
    title: "مدیریت کاربران",
    description: "مشاهده حساب‌ها، نقش‌ها و وضعیت دسترسی کاربران.",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "گزارش رویدادها",
    description: "بررسی Audit Log عملیات حساس و تلاش‌های ردشده.",
    href: "/admin/audit",
    icon: FileClock,
  },
  {
    title: "تأیید منابع رسمی",
    description: "بررسی گزارش امنیتی و تأیید یا رد تغییرات منبع رسمی.",
    href: "/admin/source-approvals",
    icon: ClipboardCheck,
  },
  {
    title: "درگاه هوش مصنوعی",
    description: "مدیریت سهمیه، بودجه، Provider Registry و Circuit Breaker.",
    href: "/admin/ai-gateway",
    icon: Bot,
  },
] as const;

export default function AdminDashboard() {
  return (
    <AdminAccess>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin Control"
          title="مرکز مدیریت CivilMind"
          description="ابزارهای حساس سامانه فقط پس از احراز هویت و تأیید نقش مدیر در Convex فعال می‌شوند."
          action={<StatusBadge tone="info">دسترسی مدیر تأیید شد</StatusBadge>}
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href} className="group">
                <GlassPanel className="h-full transition group-hover:-translate-y-1 group-hover:border-blue-400/30">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-blue-400/10 text-blue-300">
                    <Icon className="size-5" />
                  </span>
                  <h2 className="mt-5 text-lg font-bold text-white">{section.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-400">{section.description}</p>
                </GlassPanel>
              </Link>
            );
          })}
        </div>
        <GlassPanel className="border-emerald-400/20 bg-emerald-400/5">
          <div className="flex items-start gap-4">
            <ShieldCheck className="mt-1 size-6 shrink-0 text-emerald-300" />
            <div>
              <h2 className="font-bold text-emerald-100">مرز امنیتی Backend فعال است</h2>
              <p className="mt-2 text-sm leading-7 text-emerald-100/65">
                مخفی‌کردن منو تنها برای تجربه کاربری است. هر Query و Mutation مدیریتی
                دوباره هویت، وضعیت حساب و نقش مدیر را در Convex بررسی می‌کند.
              </p>
            </div>
          </div>
        </GlassPanel>
      </div>
    </AdminAccess>
  );
}
