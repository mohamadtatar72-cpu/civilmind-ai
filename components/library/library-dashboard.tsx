"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Library,
  Search,
  ExternalLink,
} from "lucide-react";
import {
  asLibraryApi,
  mapPublicTopics,
  type PublicTopicListResult,
} from "@/features/library/convex-repository";
import { api } from "@/convex/_generated/api";
import {
  EmptyState,
  GlassPanel,
  PageHeader,
  StatusBadge,
} from "@/components/ui/civilmind";
import { normalizePersianSearch } from "@/lib/persian-normalization";

function TopicSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.045] p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="h-11 w-11 rounded-xl bg-white/8" />
        <div className="h-5 w-16 rounded-full bg-white/8" />
      </div>
      <div className="mt-5 h-5 w-3/4 rounded bg-white/10" />
      <div className="mt-3 h-4 w-full rounded bg-white/6" />
      <div className="mt-2 h-4 w-5/6 rounded bg-white/6" />
      <div className="mt-6 h-10 w-full rounded-xl bg-white/8" />
    </div>
  );
}

function LoadingGrid() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">در حال دریافت فهرست مباحث…</span>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <TopicSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

function LibraryContent({ result }: { result: PublicTopicListResult }) {
  const [search, setSearch] = useState("");
  const topics = useMemo(() => mapPublicTopics(result), [result]);
  const visibleTopics = useMemo(() => {
    const normalized = normalizePersianSearch(search);
    if (!normalized) {
      return topics;
    }

    return topics.filter((topic) =>
      normalizePersianSearch(
        `${topic.code} ${topic.title} ${topic.shortTitle} ${topic.description}`,
      ).includes(normalized),
    );
  }, [search, topics]);
  const questionTotal = topics.reduce(
    (total, topic) => total + topic.questionCount,
    0,
  );
  const resourceTotal = topics.reduce(
    (total, topic) => total + topic.resourceCount,
    0,
  );

  if (topics.length === 0) {
    return (
      <EmptyState
        title="هنوز مبحثی در کتابخانه ثبت نشده است"
        description="پس از ورود داده‌های رسمی مباحث در Convex، فهرست منابع به‌صورت خودکار در این بخش نمایش داده می‌شود."
      />
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <GlassPanel>
          <p className="text-sm text-slate-400">مباحث فعال</p>
          <p data-numeric className="mt-3 text-3xl font-black text-white">
            {topics.length.toLocaleString("fa-IR")}
          </p>
        </GlassPanel>
        <GlassPanel>
          <p className="text-sm text-slate-400">سؤال ثبت‌شده</p>
          <p data-numeric className="mt-3 text-3xl font-black text-blue-300">
            {questionTotal.toLocaleString("fa-IR")}
          </p>
        </GlassPanel>
        <GlassPanel>
          <p className="text-sm text-slate-400">منبع ثبت‌شده</p>
          <p data-numeric className="mt-3 text-3xl font-black text-emerald-300">
            {resourceTotal.toLocaleString("fa-IR")}
          </p>
        </GlassPanel>
      </div>

      <GlassPanel>
        <label
          htmlFor="topic-search"
          className="mb-2 block text-sm font-semibold text-slate-200"
        >
          جستجو در مباحث
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-slate-500" />
          <input
            id="topic-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="عنوان، شماره یا کلیدواژه مبحث…"
            className="w-full rounded-xl border border-white/10 bg-black/20 py-3.5 pr-11 pl-4 text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/10"
          />
        </div>
      </GlassPanel>

      {visibleTopics.length === 0 ? (
        <EmptyState
          title="مبحثی با این عبارت پیدا نشد"
          description="شماره مبحث یا عبارت کوتاه‌تری مانند بتن، فولاد یا انرژی را امتحان کنید."
        />
      ) : (
        <section aria-labelledby="topics-heading">
          <div className="mb-5">
            <h2 id="topics-heading" className="text-lg font-bold text-white">
              مباحث مقررات ملی ساختمان
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              داده‌ها به‌صورت زنده از کتابخانه CivilMind دریافت می‌شوند.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleTopics.map((topic) => (
              <article
                key={topic.code}
                className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_16px_50px_-30px_rgba(0,0,0,.8)] transition hover:-translate-y-0.5 hover:border-blue-400/30 hover:bg-blue-400/[0.06]"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
                    <BookOpen className="size-5" />
                  </span>
                  <div className="flex flex-wrap justify-end gap-2">
                    {topic.sourceStatus === "verified" && (
                      <StatusBadge tone="success">منبع رسمی</StatusBadge>
                    )}
                    <span
                      data-numeric
                      className="rounded-full border border-white/10 bg-black/15 px-3 py-1 text-xs font-bold text-slate-300"
                    >
                      مبحث {topic.code.toLocaleString("fa-IR")}
                    </span>
                  </div>
                </div>
                <h3 className="mt-5 text-lg font-bold leading-8 text-white">
                  {topic.shortTitle}
                </h3>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-7 text-slate-400">
                  {topic.description}
                </p>
                {(topic.sourcePublisher || topic.latestEdition) && (
                  <div className="mt-4 space-y-1 text-xs text-slate-500">
                    {topic.sourcePublisher && <p>{topic.sourcePublisher}</p>}
                    {topic.latestEdition && <p>ویرایش {topic.latestEdition}</p>}
                  </div>
                )}
                <dl className="mt-5 flex flex-wrap gap-3 border-t border-white/8 pt-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <FileText className="size-4 text-blue-400" />
                    <dt className="sr-only">تعداد سؤال</dt>
                    <dd>{topic.questionCount.toLocaleString("fa-IR")} سؤال</dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Library className="size-4 text-emerald-400" />
                    <dt className="sr-only">تعداد منبع</dt>
                    <dd>{topic.resourceCount.toLocaleString("fa-IR")} منبع</dd>
                  </div>
                </dl>
                <Link
                  href={`/library/${topic.code}`}
                  aria-label={`ورود به ${topic.title}`}
                  className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                >
                  مشاهده مبحث
                  <ArrowLeft className="size-4" />
                </Link>
                {(topic.officialDocumentUrl || topic.officialPageUrl) && (
                  <a
                    href={topic.officialDocumentUrl ?? topic.officialPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/10"
                  >
                    مشاهده در منبع رسمی
                    <ExternalLink className="size-4" />
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export default function LibraryDashboard() {
  const result = useQuery(asLibraryApi(api).topics.listActive, {});

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="مرکز دانش CivilMind"
        title="کتابخانه هوشمند مباحث مقررات ملی"
        description="مرجع یکپارچه مباحث، منابع و بانک سؤال آزمون نظام مهندسی عمران"
      />
      {result === undefined ? (
        <LoadingGrid />
      ) : (
        <LibraryContent result={result} />
      )}
    </div>
  );
}
