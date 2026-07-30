"use client";

import { useQuery } from "convex/react";
import { ExternalLink, Upload, Sparkles } from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import {
  EmptyState,
  GlassPanel,
  PageHeader,
  SectionTitle,
  StatusBadge,
} from "@/components/ui/civilmind";
import {
  asLibraryApi,
  mapPublicTopics,
} from "@/features/library/convex-repository";
import { api } from "@/convex/_generated/api";

export default function PdfLibraryPage() {
  const result = useQuery(asLibraryApi(api).topics.listActive, {});
  const topics = result === undefined ? undefined : mapPublicTopics(result);
  const available = topics?.filter(
    (topic) =>
      topic.sourceStatus === "verified" &&
      (topic.officialDocumentUrl || topic.officialPageUrl),
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="کتابخانه PDF"
          title="منابع آزمون در یک نمای مطمئن"
          description="فهرست منابع ثبت‌شده؛ نمایشگر و بارگذاری فایل در حال توسعه است."
          action={
            <StatusBadge tone="info">
              {available === undefined
                ? "در حال دریافت"
                : `${available.length.toLocaleString("fa-IR")} منبع ثبت‌شده`}
            </StatusBadge>
          }
        />
        {available === undefined ? (
          <GlassPanel>
            <div
              role="status"
              className="h-32 animate-pulse rounded-xl bg-white/6"
            >
              <span className="sr-only">در حال دریافت منابع…</span>
            </div>
          </GlassPanel>
        ) : available.length === 0 ? (
          <EmptyState
            title="منبعی ثبت نشده است"
            description="پس از ثبت منابع رسمی، فهرست آن‌ها در این صفحه نمایش داده می‌شود."
          />
        ) : (
          <GlassPanel>
            <SectionTitle
              title="مباحث مقررات ملی"
              description="پیوندها مستقیماً به وب‌سایت ناشر رسمی باز می‌شوند و فایل‌ها در CivilMind میزبانی نمی‌شوند."
            />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {available.map((topic) => (
                <a
                  key={topic.code}
                  href={topic.officialDocumentUrl ?? topic.officialPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-xl border border-white/8 bg-black/10 p-4 transition hover:border-blue-400/30 hover:bg-blue-400/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-bold leading-7 text-slate-100">
                        {topic.title}
                      </h2>
                      <p className="mt-2 text-xs text-slate-500">
                        {topic.questionCount.toLocaleString("fa-IR")} سؤال مرتبط
                      </p>
                    </div>
                    <StatusBadge tone="success">منبع رسمی</StatusBadge>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">
                    لینک منبع رسمی
                    <ExternalLink className="size-4" />
                  </span>
                </a>
              ))}
            </div>
          </GlassPanel>
        )}
        <GlassPanel>
          <SectionTitle
            title="ابزارهای PDF"
            description="قابلیت‌های پردازش فایل هنوز فعال نیستند."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "بارگذاری PDF", icon: Upload },
              { label: "تحلیل PDF با هوش مصنوعی", icon: Sparkles },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black/15 p-4"
                >
                  <span className="flex items-center gap-3 text-sm font-semibold text-slate-300">
                    <Icon className="size-5 text-slate-500" />
                    {item.label}
                  </span>
                  <StatusBadge tone="info">در حال توسعه</StatusBadge>
                </div>
              );
            })}
          </div>
        </GlassPanel>
      </div>
    </AppShell>
  );
}
