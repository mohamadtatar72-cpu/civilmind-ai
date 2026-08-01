"use client";

import Link from "next/link";
import { useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
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
import { getOfficialTopicLink } from "@/lib/data/official-topic-links";
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
  const { isAuthenticated } = useConvexAuth();
  const [showQuestionAnalysis, setShowQuestionAnalysis] = useState(false);
  const code = Number(routeId);
  const isValidCode =
    /^[1-9]\d*$/.test(routeId) &&
    Number.isSafeInteger(code) &&
    code > 0;
  const result = useQuery(
    asLibraryApi(api).topics.getByCode,
    isValidCode ? { code } : "skip",
  );

  const recentQuestionSignals = useQuery(
    api.examAccess.recentQuestionsForTopic,
    isValidCode && isAuthenticated ? { topicCode: code } : "skip",
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
  const officialTopicLink = getOfficialTopicLink(
    topic.code,
    topic.officialDocumentUrl,
    topic.officialPageUrl,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`مبحث ${topic.code.toLocaleString("fa-IR")}`}
        title={topic.title}
        description={topic.description}
      />

      {(topic.sourcePublisher ||
        topic.latestEdition ||
        officialTopicLink) && (
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
            {officialTopicLink && (
              <a
                href={officialTopicLink}
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
        <div className="mt-5 rounded-xl border border-cyan-400/25 bg-cyan-400/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold text-white">سؤال‌های آزمون‌های اخیر از این مبحث</h3><p className="mt-1 text-sm text-slate-400">فقط سؤال‌های استخراج و تأییدشده از PDFهای رسمی، همراه با ارجاع.</p></div><button type="button" onClick={() => setShowQuestionAnalysis(true)} className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400">از این مبحث چه سؤال‌هایی آمده؟</button></div>
          {!isAuthenticated ? <p className="mt-3 text-sm text-amber-200">برای دیدن تحلیل وارد حساب شوید.</p> : recentQuestionSignals === undefined ? <p className="mt-3 text-sm text-slate-400">در حال بررسی آرشیو رسمی…</p> : !recentQuestionSignals.hasPremiumAccess ? <p className="mt-3 text-sm text-amber-200">این ابزار پس از اشتراک حرفه‌ای فعال می‌شود.</p> : !recentQuestionSignals.preference ? <p className="mt-3 text-sm text-amber-200">ابتدا رشته و صلاحیت آزمون را در پروفایل انتخاب کنید.</p> : recentQuestionSignals.questions.length === 0 ? <p className="mt-3 text-sm text-slate-400">برای این مبحث هنوز سؤال رسمیِ دسته‌بندی‌شده ثبت نشده است.</p> : <ul className="mt-3 space-y-2 text-sm text-slate-200">{recentQuestionSignals.questions.map((q) => <li key={q.id} className="rounded-lg bg-black/20 p-3">سؤال {q.questionNumber.toLocaleString("fa-IR")}{q.sourcePage ? ` · صفحه ${q.sourcePage.toLocaleString("fa-IR")}` : ""}{q.sourceExcerpt ? ` · ${q.sourceExcerpt}` : ""}</li>)}</ul>}
          {showQuestionAnalysis && recentQuestionSignals?.hasPremiumAccess && recentQuestionSignals.preference && recentQuestionSignals.questions.length === 0 && <p className="mt-3 rounded-lg bg-slate-950/60 p-3 text-sm text-slate-300">هنوز دادهٔ قابل‌استناد برای تحلیل ثبت نشده است. پس از استخراج PDF رسمی، تحلیل فقط با استناد به همان منبع نمایش داده می‌شود.</p>}
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
