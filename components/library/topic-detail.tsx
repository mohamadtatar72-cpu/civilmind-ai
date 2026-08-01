"use client";

import Link from "next/link";
import { useState } from "react";
import { useAction, useQuery } from "convex/react";
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

type RecentTopicQuestion = {
  id: string;
  questionNumber: number;
  topicTitle: string;
  discipline?: string;
  qualification?: string;
  sourcePage?: number;
  sourceExcerpt?: string;
  stem?: string;
  options?: string[];
  officialCorrectIndex?: number;
  officialClause?: string;
  sourceEdition?: string;
  officialAnswerSourceUrl?: string;
  analysisReady?: boolean;
  documentTitle?: string;
  sourceUrl?: string;
};

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

function sourcePageUrl(sourceUrl: string, page?: number) {
  if (!page) return sourceUrl;
  const separator = sourceUrl.includes("#") ? "&" : "#";
  return `${sourceUrl}${separator}page=${page}`;
}

export function TopicDetail({ routeId }: { routeId: string }) {
  const [showQuestionAnalysis, setShowQuestionAnalysis] = useState(false);
  const [analysisByQuestion, setAnalysisByQuestion] = useState<Record<string, { status: "loading" | "ready" | "blocked" | "error"; text?: string }>>({});
  const submitAIAnalysis = useAction(api.aiRuntime.submitAndExecute);
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
    isValidCode ? { topicCode: code } : "skip",
  ) as RecentTopicQuestion[] | { questions?: RecentTopicQuestion[] } | undefined;

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
  const studyActions = [
    {
      label: "مشاهده PDF مبحث",
      detail: "بازکردن متن رسمی مبحث",
      icon: FileText,
      href: officialTopicLink ?? `/pdf?query=${encodeURIComponent(topic.title)}`,
      external: Boolean(officialTopicLink),
    },
    {
      label: "خلاصه هوشمند",
      detail: "پرسش مستند از CivilMind AI",
      icon: Sparkles,
      href: `/ai?topic=${topic.code}`,
      external: false,
    },
    {
      label: "آزمون مبحثی",
      detail: "رفتن به مرکز آزمون",
      icon: FileQuestion,
      href: `/exam?topic=${topic.code}`,
      external: false,
    },
    {
      label: "فلش‌کارت و تحلیل عملکرد",
      detail: "مشاهده ابزارهای مرور و تحلیل",
      icon: BookOpen,
      href: `/analytics?topic=${topic.code}`,
      external: false,
    },
  ];
  const recentQuestions = Array.isArray(recentQuestionSignals)
    ? recentQuestionSignals
    : recentQuestionSignals?.questions ?? [];

  async function analyzeOfficialQuestion(question: RecentTopicQuestion) {
    if (!question.analysisReady || !question.stem || !question.options || question.officialCorrectIndex === undefined) return;
    setAnalysisByQuestion((current) => ({ ...current, [question.id]: { status: "loading" } }));
    try {
      const result = await submitAIAnalysis({
        capability: "exam-analysis",
        idempotencyKey: crypto.randomUUID(),
        userText: [
          "این رکورد از دفترچه و کلید رسمی تأییدشده استخراج شده است. متن رسمی، کلید رسمی و تحلیل CivilMind AI را کاملاً جدا نگه دار.",
          "تحلیل را شامل مسیر حل، علت درستی گزینه رسمی، علت نادرستی سایر گزینه‌ها، تله رایج، حساسیت به ویرایش و عدم قطعیت ارائه کن.",
          "فقط به اطلاعات رسمی داخل این ورودی استناد کن و هیچ صفحه، بند، آمار یا منبعی اختراع نکن.",
          `سؤال رسمی شماره ${question.questionNumber}: ${question.stem}`,
          `گزینه‌ها:\n${question.options.map((option, index) => `${index + 1}. ${option}`).join("\n")}`,
          `گزینه صحیح طبق کلید رسمی: ${question.officialCorrectIndex + 1}`,
          `سند: ${question.documentTitle ?? "نامشخص"}`,
          `ویرایش/دوره: ${question.sourceEdition ?? "ثبت نشده"}`,
          `صفحه: ${question.sourcePage ?? "ثبت نشده"}`,
          `بند مرتبط: ${question.officialClause ?? "ثبت نشده"}`,
        ].join("\n\n"),
        requestedTools: ["exam-history-read", "topic-progress-read"],
      });
      setAnalysisByQuestion((current) => ({
        ...current,
        [question.id]: result.status === "completed" && result.responseText
          ? { status: "ready", text: result.responseText }
          : { status: "blocked" },
      }));
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      setAnalysisByQuestion((current) => ({
        ...current,
        [question.id]: { status: code.includes("CAPABILITY_PREMIUM_REQUIRED") || code.includes("UNAUTHENTICATED") ? "blocked" : "error" },
      }));
    }
  }

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
          هر گزینه اکنون به مسیر واقعی خودش متصل است. منابع و سؤال‌های رسمی بدون
          ورود و بدون Premium در دسترس می‌مانند.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {studyActions.map((action) => {
            const Icon = action.icon;
            const content = (
              <>
                <span className="flex items-center gap-3">
                  <Icon className="size-5 text-slate-500" />
                  <span>
                    <span className="block font-semibold text-slate-100">{action.label}</span>
                    <span className="mt-1 block text-xs text-slate-500">{action.detail}</span>
                  </span>
                </span>
                <span className="text-sm font-bold text-blue-300">باز کردن</span>
              </>
            );
            const className = "flex min-h-20 items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/15 p-4 transition hover:border-blue-400/35 hover:bg-blue-400/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400";
            return action.external ? (
              <a key={action.label} href={action.href} target="_blank" rel="noopener noreferrer" className={className}>
                {content}
              </a>
            ) : (
              <Link key={action.label} href={action.href} className={className}>
                {content}
              </Link>
            );
          })}
        </div>
        <div className="mt-5 rounded-xl border border-cyan-400/25 bg-cyan-400/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white">سؤال‌های آزمون‌های اخیر از این مبحث</h3>
              <p className="mt-1 text-sm text-slate-400">فقط سؤال‌های استخراج و تأییدشده از PDFهای رسمی، همراه با ارجاع.</p>
            </div>
            <button type="button" aria-expanded={showQuestionAnalysis} onClick={() => setShowQuestionAnalysis((visible) => !visible)} className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400">
              {showQuestionAnalysis ? "بستن فهرست" : "از این مبحث چه سؤال‌هایی آمده؟"}
            </button>
          </div>
          {showQuestionAnalysis ? (
            recentQuestionSignals === undefined ? (
              <p role="status" className="mt-3 text-sm text-slate-400">در حال بررسی آرشیو رسمی…</p>
            ) : recentQuestions.length === 0 ? (
              <p className="mt-3 rounded-lg bg-slate-950/60 p-3 text-sm text-slate-300">برای این مبحث هنوز سؤال رسمیِ دسته‌بندی‌شده ثبت نشده است.</p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm text-slate-200">
                {recentQuestions.map((question) => {
                  const analysis = analysisByQuestion[question.id];
                  return (
                  <li key={question.id} className="rounded-lg border border-white/8 bg-black/20 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold">سؤال {question.questionNumber.toLocaleString("fa-IR")}{question.documentTitle ? ` · ${question.documentTitle}` : ""}</span>
                      {question.sourceUrl ? (
                        <a href={sourcePageUrl(question.sourceUrl, question.sourcePage)} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-emerald-400/25 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-400/10">
                          مشاهده سؤال رسمی{question.sourcePage ? ` در صفحه ${question.sourcePage.toLocaleString("fa-IR")}` : ""}
                        </a>
                      ) : null}
                    </div>
                    {question.discipline ? <p className="mt-2 text-xs text-slate-400">{question.discipline}{question.qualification ? ` · ${question.qualification}` : ""}</p> : null}
                    {question.sourceExcerpt ? <p className="mt-2 leading-7 text-slate-300">{question.sourceExcerpt}</p> : null}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {question.analysisReady ? (
                        <button type="button" disabled={analysis?.status === "loading"} onClick={() => void analyzeOfficialQuestion(question)} className="rounded-lg border border-violet-300/35 bg-violet-400/10 px-3 py-2 text-xs font-black text-violet-100 hover:bg-violet-400/20 disabled:opacity-50">
                          {analysis?.status === "loading" ? "در حال تحلیل مستند…" : analysis?.status === "ready" ? "تحلیل دوباره" : "تحلیل کامل با CivilMind AI"}
                        </button>
                      ) : (
                        <span className="rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-100">تحلیل AI پس از استخراج متن، گزینه‌ها و کلید رسمی فعال می‌شود</span>
                      )}
                      <span className="rounded-full border border-emerald-300/25 px-2 py-1 text-[11px] font-bold text-emerald-200">سؤال رسمی</span>
                    </div>
                    {analysis?.status === "ready" && analysis.text ? (
                      <div className="mt-3 rounded-lg border border-violet-300/30 bg-violet-400/10 p-3">
                        <p className="font-black text-violet-100">تحلیل CivilMind AI <span className="mr-2 text-[11px] font-bold text-violet-200">غیررسمی</span></p>
                        <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-200">{analysis.text}</p>
                      </div>
                    ) : null}
                    {analysis?.status === "blocked" ? <p role="status" className="mt-3 rounded-lg bg-amber-300/10 p-3 text-xs leading-6 text-amber-100">برای تحلیل پیشرفته وارد حساب Premium شوید و Provider AI را فعال کنید. مشاهده سؤال و کلید رسمی رایگان است.</p> : null}
                    {analysis?.status === "error" ? <p role="alert" className="mt-3 rounded-lg bg-rose-300/10 p-3 text-xs leading-6 text-rose-100">تحلیل AI انجام نشد؛ سؤال و ارجاع رسمی بدون تغییر در دسترس‌اند.</p> : null}
                  </li>
                  );
                })}
              </ul>
            )
          ) : (
            <p className="mt-3 text-sm text-cyan-100/70">برای نمایش فهرست مستند سؤال‌ها، دکمه بالا را بزنید.</p>
          )}
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
