"use client";

import { useMemo, useState } from "react";
import { useAction, useQuery } from "convex/react";
import {
  AlertTriangle,
  BookOpen,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import {
  asLibraryApi,
  mapPublicTopic,
} from "@/features/library/convex-repository";
import { getOfficialTopicLink } from "@/lib/data/official-topic-links";
import {
  REGULATION_EXPLANATION_LEVELS,
  REGULATION_LEVEL_LABELS,
  classifyRegulationExplainerError,
  createRegulationExplanationPrompt,
  hasVerifiedRegulationSource,
  type RegulationExplanationLevel,
  type RegulationExplanationResult,
  type RegulationSource,
} from "@/features/regulation-explainer/contracts";

type RecentTopicQuestion = {
  id: string;
  questionNumber: number;
  sourcePage?: number;
  sourceExcerpt?: string;
  officialClause?: string;
  sourceEdition?: string;
  documentTitle?: string;
  sourceUrl?: string;
  officialAnswerSourceUrl?: string;
  sourceVerified?: boolean;
  analysisReady?: boolean;
};

const statusMessages: Record<
  Exclude<RegulationExplanationResult["status"], "idle" | "loading" | "success">,
  { title: string; description: string }
> = {
  "no-source": {
    title: "مرجع رسمی کافی پیدا نشد",
    description:
      "تا زمانی که متن، سند، ویرایش و پیوند رسمی تأییدشده وجود نداشته باشد، CivilMind AI توضیح تولید نمی‌کند.",
  },
  "provider-missing": {
    title: "AI Provider تنظیم نشده است",
    description:
      "منبع رسمی آماده است، اما تولید پاسخ مدل تا زمان ثبت Provider معتبر سمت سرور غیرفعال می‌ماند.",
  },
  "entitlement-required": {
    title: "دسترسی این قابلیت محدود است",
    description:
      "برای اجرای تحلیل هوشمند باید وارد حساب دارای دسترسی مناسب شوید. متن و منبع رسمی همچنان رایگان باقی می‌مانند.",
  },
  "retryable-error": {
    title: "اجرای تحلیل موقتاً ناموفق بود",
    description:
      "منبع رسمی حفظ شده است. چند لحظه بعد دوباره تلاش کنید؛ پاسخ ساختگی نمایش داده نمی‌شود.",
  },
};

export function RegulationExplainer() {
  const [topicCode, setTopicCode] = useState(19);
  const [question, setQuestion] = useState(
    "این بند را به زبان ساده و با ذکر نکات مهم آزمونی توضیح بده.",
  );
  const [level, setLevel] =
    useState<RegulationExplanationLevel>("simple");
  const [result, setResult] =
    useState<RegulationExplanationResult>({ status: "idle" });

  const topicResult = useQuery(
    asLibraryApi(api).topics.getByCode,
    Number.isInteger(topicCode) && topicCode > 0
      ? { code: topicCode }
      : "skip",
  );

  const questionSignals = useQuery(
    api.examAccess.recentQuestionsForTopic,
    Number.isInteger(topicCode) && topicCode > 0
      ? { topicCode }
      : "skip",
  ) as
    | RecentTopicQuestion[]
    | { questions?: RecentTopicQuestion[] }
    | undefined;

  const submitAndExecute = useAction(api.aiRuntime.submitAndExecute);

  const topic = topicResult ? mapPublicTopic(topicResult) : null;

  const recentQuestions = Array.isArray(questionSignals)
    ? questionSignals
    : questionSignals?.questions ?? [];

  const source = useMemo<RegulationSource | null>(() => {
    if (!topic) return null;

    const verifiedQuestion = recentQuestions.find(
      (item) =>
        item.sourceVerified === true &&
        item.analysisReady === true &&
        Boolean(item.sourceExcerpt?.trim()),
    );

    if (!verifiedQuestion?.sourceExcerpt) {
      return null;
    }

    const officialTopicLink = getOfficialTopicLink(
      topic.code,
      topic.officialDocumentUrl,
      topic.officialPageUrl,
    );

    const sourceUrl =
      verifiedQuestion.sourceUrl ??
      verifiedQuestion.officialAnswerSourceUrl ??
      officialTopicLink;

    if (!sourceUrl) {
      return null;
    }

    return {
      documentTitle:
        verifiedQuestion.documentTitle ?? topic.title,
      edition:
        verifiedQuestion.sourceEdition ??
        topic.latestEdition ??
        "ویرایش ثبت‌شده در منبع رسمی",
      page: verifiedQuestion.sourcePage,
      clause: verifiedQuestion.officialClause,
      sourceUrl,
      officialText: verifiedQuestion.sourceExcerpt,
    };
  }, [recentQuestions, topic]);

  const sourceReady = hasVerifiedRegulationSource(source);
  const loading =
    topicResult === undefined || questionSignals === undefined;

  async function explain() {
    if (!sourceReady) {
      setResult({ status: "no-source" });
      return;
    }

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setResult({ status: "retryable-error" });
      return;
    }

    setResult({ status: "loading" });

    try {
      const response = await submitAndExecute({
        capability: "exam-analysis",
        idempotencyKey: crypto.randomUUID(),
        userText: createRegulationExplanationPrompt({
          level,
          question: trimmedQuestion,
          source,
        }),
        requestedTools: [
          "document-search",
          "citation-retrieval",
        ],
      });

      if (
        response.status === "completed" &&
        response.responseText?.trim()
      ) {
        setResult({
          status: "success",
          text: response.responseText,
        });
        return;
      }

      setResult({ status: "provider-missing" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      setResult({
        status: classifyRegulationExplainerError(message),
      });
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-cyan-400/20 bg-slate-950/80 p-6 shadow-2xl shadow-cyan-950/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-300">
              <Sparkles className="size-5" />
              <span className="text-sm font-bold">
                CivilMind AI Regulation Explainer
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-black text-white">
              توضیح هوشمند مقررات
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              متن رسمی ابتدا بازیابی و کنترل می‌شود. توضیح CivilMind AI
              هیچ‌وقت جای متن رسمی، بند، صفحه یا تفسیر مرجع را نمی‌گیرد.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-200">
            <div className="flex items-center gap-2 font-bold">
              <ShieldCheck className="size-4" />
              Retrieval First
            </div>
            <p className="mt-1 text-xs text-emerald-200/70">
              بدون منبع تأییدشده، پاسخ تولید نمی‌شود.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.035] p-5">
          <div>
            <label
              htmlFor="topic-code"
              className="text-sm font-bold text-white"
            >
              شماره مبحث
            </label>
            <input
              id="topic-code"
              type="number"
              min={1}
              value={topicCode}
              onChange={(event) => {
                setTopicCode(Number(event.target.value));
                setResult({ status: "idle" });
              }}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <p className="text-sm font-bold text-white">
              سطح توضیح
            </p>
            <div className="mt-2 grid gap-2">
              {REGULATION_EXPLANATION_LEVELS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setLevel(item);
                    setResult({ status: "idle" });
                  }}
                  className={`rounded-xl border px-4 py-3 text-right text-sm transition ${
                    level === item
                      ? "border-cyan-400 bg-cyan-400/10 text-cyan-100"
                      : "border-white/10 bg-slate-950/50 text-slate-300 hover:border-white/20"
                  }`}
                >
                  {REGULATION_LEVEL_LABELS[item]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="regulation-question"
              className="text-sm font-bold text-white"
            >
              سؤال یا درخواست توضیح
            </label>
            <textarea
              id="regulation-question"
              value={question}
              onChange={(event) => {
                setQuestion(event.target.value);
                setResult({ status: "idle" });
              }}
              rows={5}
              className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm leading-7 text-white outline-none focus:border-cyan-400"
            />
          </div>

          <button
            type="button"
            onClick={explain}
            disabled={loading || result.status === "loading"}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 font-black text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {result.status === "loading" ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                در حال بررسی منبع و تولید توضیح
              </>
            ) : (
              <>
                <Sparkles className="size-5" />
                تولید توضیح مستند
              </>
            )}
          </button>
        </div>

        <div className="space-y-5">
          <section className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.045] p-5">
            <div className="flex items-center gap-2">
              <BookOpen className="size-5 text-emerald-300" />
              <h2 className="font-black text-white">
                متن و مشخصات منبع رسمی
              </h2>
            </div>

            {loading ? (
              <p className="mt-4 text-sm text-slate-400">
                در حال دریافت اطلاعات منبع…
              </p>
            ) : sourceReady ? (
              <div className="mt-4 space-y-4">
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">سند</dt>
                    <dd className="mt-1 font-bold text-white">
                      {source.documentTitle}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">ویرایش</dt>
                    <dd className="mt-1 font-bold text-white">
                      {source.edition}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">صفحه</dt>
                    <dd className="mt-1 font-bold text-white">
                      {source.page ?? "ثبت نشده"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">بند</dt>
                    <dd className="mt-1 font-bold text-white">
                      {source.clause ?? "ثبت نشده"}
                    </dd>
                  </div>
                </dl>

                <blockquote className="rounded-2xl border border-emerald-400/15 bg-slate-950/70 p-4 text-sm leading-8 text-slate-200">
                  {source.officialText}
                </blockquote>

                <a
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-300 hover:text-emerald-200"
                >
                  مشاهده منبع اصلی
                  <ExternalLink className="size-4" />
                </a>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
                <div className="flex items-center gap-2 font-bold text-amber-200">
                  <AlertTriangle className="size-4" />
                  منبع تأییدشده کافی نیست
                </div>
                <p className="mt-2 text-sm leading-6 text-amber-100/70">
                  این وضعیت عمداً Fail-Closed است و پاسخ حدسی تولید
                  نمی‌شود.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-violet-400/20 bg-violet-400/[0.045] p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-violet-300" />
              <h2 className="font-black text-white">
                توضیح CivilMind AI
              </h2>
            </div>

            {result.status === "idle" && (
              <p className="mt-4 text-sm leading-7 text-slate-400">
                سطح توضیح را انتخاب کن و درخواستت را بنویس. خروجی این
                بخش تفسیر رسمی محسوب نمی‌شود.
              </p>
            )}

            {result.status === "loading" && (
              <div
                role="status"
                className="mt-4 flex items-center gap-3 text-sm text-violet-200"
              >
                <Loader2 className="size-5 animate-spin" />
                منبع بررسی شد؛ در حال اجرای تحلیل…
              </div>
            )}

            {result.status === "success" && result.text && (
              <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-violet-400/15 bg-slate-950/70 p-4 text-sm leading-8 text-slate-200">
                {result.text}
              </div>
            )}

            {!["idle", "loading", "success"].includes(
              result.status,
            ) && (
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
                <div className="flex items-center gap-2 font-bold text-amber-200">
                  <AlertTriangle className="size-4" />
                  {
                    statusMessages[
                      result.status as keyof typeof statusMessages
                    ].title
                  }
                </div>
                <p className="mt-2 text-sm leading-7 text-amber-100/70">
                  {
                    statusMessages[
                      result.status as keyof typeof statusMessages
                    ].description
                  }
                </p>
              </div>
            )}

            <p className="mt-4 border-t border-white/10 pt-4 text-xs leading-6 text-slate-500">
              متن رسمی در کارت سبز نمایش داده می‌شود و توضیح CivilMind
              AI فقط در این کارت بنفش قرار می‌گیرد.
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}
