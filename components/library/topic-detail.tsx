"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  BookOpen,
  FileQuestion,
  FileText,
  Library,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  asLibraryApi,
  mapPublicTopic,
} from "@/features/library/convex-repository";
import { api } from "@/convex/_generated/api";
import {
  EmptyState,
  GlassPanel,
  PageHeader,
  StatusBadge,
} from "@/components/ui/civilmind";

function TopicLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">در حال دریافت اطلاعات مبحث…</span>
      <div className="animate-pulse">
        <div className="h-8 w-2/3 rounded bg-white/10" />
        <div className="mt-4 h-4 w-full max-w-2xl rounded bg-white/6" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            aria-hidden="true"
            className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/[0.045]"
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        className="h-56 animate-pulse rounded-2xl border border-white/10 bg-white/[0.045]"
      />
    </div>
  );
}

function TopicNotFound({ invalidRoute = false }: { invalidRoute?: boolean }) {
  return (
    <EmptyState
      title={invalidRoute ? "نشانی مبحث معتبر نیست" : "این مبحث پیدا نشد"}
      description={
        invalidRoute
          ? "شماره مبحث باید یک عدد صحیح مثبت باشد. از فهرست کتابخانه، مبحث مورد نظر را انتخاب کنید."
          : "ممکن است این مبحث هنوز وارد کتابخانه نشده یا موقتاً غیرفعال باشد."
      }
    />
  );
}

export function TopicDetail({ routeId }: { routeId: string }) {
  const code = Number(routeId);
  const isValidCode =
    /^[1-9]\d*$/.test(routeId) &&
    Number.isSafeInteger(code) &&
    code > 0;
  const result = useQuery(
    asLibraryApi(api).topics.getByCode,
    isValidCode ? { code } : "skip",
  );

  if (!isValidCode) {
    return <TopicNotFound invalidRoute />;
  }

  if (result === undefined) {
    return <TopicLoading />;
  }

  if (result === null) {
    return <TopicNotFound />;
  }

  const topic = mapPublicTopic(result);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`مبحث ${topic.code.toLocaleString("fa-IR")}`}
        title={topic.title}
        description={topic.description}
      />

      {(topic.sourcePublisher ||
        topic.latestEdition ||
        topic.officialDocumentUrl ||
        topic.officialPageUrl) && (
        <GlassPanel>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold text-white">اطلاعات منبع</h2>
                {topic.sourceStatus === "verified" && (
                  <StatusBadge tone="success">منبع رسمی</StatusBadge>
                )}
              </div>
              {topic.sourcePublisher && (
                <p className="mt-2 text-sm text-slate-400">
                  ناشر: {topic.sourcePublisher}
                </p>
              )}
              {topic.latestEdition && (
                <p className="mt-1 text-sm text-slate-400">
                  آخرین ویرایش: {topic.latestEdition}
                </p>
              )}
            </div>
            {(topic.officialDocumentUrl || topic.officialPageUrl) && (
              <a
                href={topic.officialDocumentUrl ?? topic.officialPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
              >
                مشاهده در منبع رسمی
                <ExternalLink className="size-4" />
              </a>
            )}
          </div>
        </GlassPanel>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <GlassPanel>
          <FileQuestion className="size-5 text-blue-300" />
          <p className="mt-4 text-sm text-slate-400">سؤال ثبت‌شده</p>
          <p data-numeric className="mt-2 text-3xl font-black text-white">
            {topic.questionCount.toLocaleString("fa-IR")}
          </p>
        </GlassPanel>
        <GlassPanel>
          <Library className="size-5 text-emerald-300" />
          <p className="mt-4 text-sm text-slate-400">منبع ثبت‌شده</p>
          <p data-numeric className="mt-2 text-3xl font-black text-white">
            {topic.resourceCount.toLocaleString("fa-IR")}
          </p>
        </GlassPanel>
        <GlassPanel>
          <BookOpen className="size-5 text-violet-300" />
          <p className="mt-4 text-sm text-slate-400">صلاحیت</p>
          <p className="mt-2 text-xl font-black text-white">عمومی</p>
        </GlassPanel>
      </div>

      <GlassPanel>
        <h2 className="text-lg font-bold text-white">ابزارهای مطالعه</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          زیرساخت محتوایی مبحث آماده است؛ ابزارهای شخصی پس از احراز هویت و
          تکمیل Sprint 1C فعال می‌شوند.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            { label: "مشاهده PDF مبحث", icon: FileText },
            { label: "خلاصه هوشمند", icon: Sparkles },
            { label: "آزمون مبحثی", icon: FileQuestion },
            { label: "فلش‌کارت و تحلیل عملکرد", icon: BookOpen },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/15 p-4"
              >
                <span className="flex items-center gap-3 font-semibold text-slate-200">
                  <Icon className="size-5 text-slate-500" />
                  {action.label}
                </span>
                <StatusBadge tone="info">در حال توسعه</StatusBadge>
              </div>
            );
          })}
        </div>
      </GlassPanel>

      <Link
        href="/library"
        className="inline-flex items-center gap-2 rounded-xl px-1 py-2 text-sm font-semibold text-blue-300 hover:text-blue-200"
      >
        <ArrowRight className="size-4" />
        بازگشت به فهرست مباحث
      </Link>
    </div>
  );
}
