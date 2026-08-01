"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type ExamCenterProps = { mode: "exam" | "analytics" };

type GuestExamPreference = {
  discipline: string;
  qualification: string;
};

type QuestionAnalysisState = {
  status: "loading" | "ready" | "blocked" | "error";
  text?: string;
};

const GUEST_EXAM_PREFERENCE_KEY = "civilmind.guest-exam-preference.v1";

const DISCIPLINES = [
  "عمران",
  "معماری",
  "تأسیسات مکانیکی",
  "تأسیسات برقی",
  "نقشه‌برداری",
  "شهرسازی",
  "ترافیک",
];

const QUALIFICATIONS = [
  "نظارت",
  "اجرا",
  "محاسبات",
  "طراحی",
  "بهسازی",
  "گود، پی و سازه نگهبان",
  "عمومی",
];

export default function ExamCenter({ mode }: ExamCenterProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [guestPreference, setGuestPreference] = useState<GuestExamPreference | null>(null);
  const [guestPreferenceReady, setGuestPreferenceReady] = useState(false);
  const analytics = useQuery(api.examEngine.getMyAnalytics, isAuthenticated ? {} : "skip");
  const officialArchiveAccess = useQuery(api.examAccess.listMyEligibleArchive, isAuthenticated ? {} : "skip");
  const publicArchive = useQuery(
    api.examAccess.listPublicArchive,
    !isAuthenticated && guestPreference
      ? guestPreference
      : "skip",
  );
  const seedArchive = useMutation(api.examArchives.seedDey1404OfficialBooklets);
  const seedHistoricalSessions = useMutation(api.examArchives.seedVerifiedHistoricalSessions);
  const startExam = useMutation(api.examEngine.startSampleExam);
  const submitExam = useMutation(api.examEngine.submitExam);
  const submitAIAnalysis = useAction(api.aiRuntime.submitAndExecute);
  const [sessionId, setSessionId] = useState<Id<"examSessions"> | null>(null);
  const session = useQuery(api.examEngine.getSession, sessionId ? { sessionId } : "skip");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [questionAnalyses, setQuestionAnalyses] = useState<Record<string, QuestionAnalysisState>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(GUEST_EXAM_PREFERENCE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<GuestExamPreference>;
      if (typeof parsed.discipline === "string" && typeof parsed.qualification === "string") {
        queueMicrotask(() => setGuestPreference({ discipline: parsed.discipline!, qualification: parsed.qualification! }));
      }
    } catch {
      window.localStorage.removeItem(GUEST_EXAM_PREFERENCE_KEY);
    } finally {
      setGuestPreferenceReady(true);
    }
  }, []);

  function saveGuestPreference(preference: GuestExamPreference) {
    setGuestPreference(preference);
    window.localStorage.setItem(GUEST_EXAM_PREFERENCE_KEY, JSON.stringify(preference));
  }

  async function seedOfficialArchive() {
    setSaving(true);
    setMessage("");
    try {
      const result = await seedArchive({});
      setMessage(result.createdDocuments === 0 ? "این آرشیو از قبل ثبت شده است." : `${result.createdDocuments.toLocaleString("fa-IR")} دفترچهٔ رسمی به آرشیو افزوده شد.`);
    } catch {
      setMessage("ثبت آرشیو رسمی فقط برای مدیر سامانه ممکن است.");
    } finally {
      setSaving(false);
    }
  }

  async function seedHistoricalArchive() {
    setSaving(true);
    setMessage("");
    try {
      const result = await seedHistoricalSessions({});
      setMessage(result.created === 0 ? "دوره‌های تاریخی از قبل ثبت شده‌اند." : `${result.created.toLocaleString("fa-IR")} دورهٔ تاریخی رسمی به آرشیو افزوده شد.`);
    } catch {
      setMessage("ثبت دوره‌های تاریخی فقط برای مدیر سامانه ممکن است.");
    } finally {
      setSaving(false);
    }
  }

  async function begin() {
    setSaving(true);
    setMessage("");
    try {
      setSessionId(await startExam({}));
      setAnswers({});
    } catch {
      setMessage("شروع آزمون ممکن نشد.");
    } finally {
      setSaving(false);
    }
  }

  async function finish() {
    if (!session) return;
    setSaving(true);
    try {
      await submitExam({
        sessionId: session.id,
        answers: session.items.map((item) => ({
          itemId: item.id,
          selectedIndex: answers[item.id],
        })),
      });
      setMessage("آزمون ثبت و تحلیل نقاط ضعف به‌روزرسانی شد.");
    } catch {
      setMessage("ثبت پاسخ‌ها ممکن نشد.");
    } finally {
      setSaving(false);
    }
  }

  async function analyzeQuestion(item: {
    id: string;
    stem: string;
    options: string[];
    selectedIndex?: number;
    correctIndex?: number;
    explanation?: string;
    topicTitle: string;
  }) {
    if (item.correctIndex === undefined) return;
    setQuestionAnalyses((current) => ({ ...current, [item.id]: { status: "loading" } }));
    try {
      const options = item.options
        .map((option, index) => `${index + 1}. ${option}${index === item.correctIndex ? " [پاسخ صحیح آموزشی]" : ""}`)
        .join("\n");
      const result = await submitAIAnalysis({
        capability: "exam-analysis",
        idempotencyKey: crypto.randomUUID(),
        userText: [
          "این سؤال، نمونه آموزشی تولیدشده در CivilMind است و سؤال رسمی آزمون نیست.",
          "تحلیل را با این بخش‌ها ارائه کن: مسیر حل کوتاه، دلیل درستی گزینه صحیح، دلیل نادرستی هر گزینه دیگر، تله رایج، نوع و سطح دشواری، و پیشنهاد مرور بعدی.",
          "هیچ بند، صفحه یا منبع رسمی اختراع نکن. اگر ارجاع رسمی در ورودی نیست، صریحاً بگو ارجاع رسمی موجود نیست.",
          `موضوع: ${item.topicTitle}`,
          `سؤال: ${item.stem}`,
          `گزینه‌ها:\n${options}`,
          `توضیح آموزشی ثبت‌شده: ${item.explanation ?? "موجود نیست"}`,
          `گزینه انتخابی کاربر: ${item.selectedIndex === undefined ? "بدون پاسخ" : item.selectedIndex + 1}`,
        ].join("\n\n"),
        requestedTools: ["exam-history-read", "topic-progress-read"],
      });
      setQuestionAnalyses((current) => ({
        ...current,
        [item.id]: result.status === "completed" && result.responseText
          ? { status: "ready", text: result.responseText }
          : { status: "blocked" },
      }));
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      setQuestionAnalyses((current) => ({
        ...current,
        [item.id]: {
          status: code.includes("CAPABILITY_PREMIUM_REQUIRED") ? "blocked" : "error",
        },
      }));
    }
  }

  if (!isAuthenticated) {
    if (mode === "analytics") {
      return (
        <div className="space-y-6 p-5 md:p-8" dir="rtl">
          <header>
            <p className="text-sm font-bold text-violet-300">تحلیل عملکرد شخصی</p>
            <h1 className="mt-2 text-3xl font-black text-white">برای تحلیل عملکرد وارد شوید</h1>
            <p className="mt-2 max-w-3xl leading-8 text-slate-300">تحلیل نقاط ضعف، روند آزمون و پیشنهاد مطالعه به داده‌های شخصی شما وابسته است. منابع، دفترچه‌ها و پاسخ‌نامه‌های رسمی همچنان بدون ورود در دسترس‌اند.</p>
          </header>
          {isLoading && <p className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-100">اتصال ورود در حال بررسی است؛ برای دیدن آرشیو رسمی لازم نیست منتظر بمانید.</p>}
          <div className="flex flex-wrap gap-3">
            <Link href="/sign-in" className="rounded-xl bg-violet-400 px-5 py-3 font-black text-slate-950">ورود امن</Link>
            <Link href="/exam" className="rounded-xl border border-cyan-300/50 px-5 py-3 font-black text-cyan-100">مشاهده آرشیو رسمی آزمون‌ها</Link>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-6 p-5 md:p-8" dir="rtl">
        <header className="mx-auto max-w-5xl">
          <p className="text-sm font-bold text-cyan-300">آرشیو عمومی CivilMind</p>
          <h1 className="mt-2 text-3xl font-black text-white">{mode === "exam" ? "آرشیو رسمی آزمون‌ها" : "منابع و آزمون‌های رسمی"}</h1>
          <p className="mt-2 max-w-3xl text-slate-300">دفترچه‌های رسمی، کلیدها و پاسخ‌نامه‌های تشریحیِ تأییدشده بدون ورود و بدون اشتراک در دسترس هستند. انتخاب زیر فقط برای نمایش منابع مرتبط روی همین دستگاه ذخیره می‌شود.</p>
        </header>
        {!guestPreferenceReady ? (
          <section className="mx-auto max-w-5xl rounded-2xl border border-slate-600 bg-slate-900 p-6 text-slate-300">در حال بازیابی انتخاب شما…</section>
        ) : (
          <GuestArchivePicker key={`${guestPreference?.discipline ?? "new"}-${guestPreference?.qualification ?? "new"}`} preference={guestPreference} onChange={saveGuestPreference} />
        )}
        {guestPreference && (
          <div className="mx-auto max-w-5xl">
            <OfficialExamArchive archives={publicArchive} onSeed={seedOfficialArchive} onSeedHistory={seedHistoricalArchive} disabled={true} publicMode />
          </div>
        )}
        <div className="mx-auto max-w-5xl rounded-2xl border border-violet-300/30 bg-violet-400/10 p-5 text-slate-100">
          <p className="font-black">ورود فقط برای امکانات شخصی لازم است</p>
          <p className="mt-1 text-sm text-slate-300">ثبت نتیجهٔ آزمون، پیشرفت و تحلیل شخصی پس از ورود فعال می‌شود؛ خود منابع رسمی رایگان می‌مانند.</p>
          <Link href="/sign-in" className="mt-4 inline-flex rounded-xl bg-violet-400 px-5 py-3 font-black text-slate-950">ورود امن</Link>
        </div>
      </div>
    );
  }

  if (session) {
    const completed = session.status === "completed";
    return (
      <div className="space-y-6 p-5 md:p-8" dir="rtl">
        <header>
          <p className="text-sm font-bold text-violet-300">Sprint 2D • Exam Engine</p>
          <h1 className="mt-2 text-3xl font-black text-white">{session.title}</h1>
          <p className="mt-2 text-sm text-amber-200">این بانک، نمونه آموزشی است و سؤال رسمی محسوب نمی‌شود.</p>
        </header>

        {completed && (
          <section className="grid gap-4 sm:grid-cols-4">
            <Stat label="امتیاز" value={(session.scorePercent ?? 0).toLocaleString("fa-IR") + "٪"} />
            <Stat label="درست" value={(session.correctAnswers ?? 0).toLocaleString("fa-IR")} />
            <Stat label="غلط" value={(session.incorrectAnswers ?? 0).toLocaleString("fa-IR")} />
            <Stat label="نزده" value={(session.unanswered ?? 0).toLocaleString("fa-IR")} />
          </section>
        )}

        <section className="space-y-4">
          {session.items.map((item, index) => {
            const analysis = questionAnalyses[item.id];
            return (
            <article key={item.id} className="rounded-2xl border border-slate-600 bg-slate-900 p-5">
              <p className="text-xs font-bold text-cyan-300">{item.topicTitle}</p>
              <h2 className="mt-2 font-bold text-white">
                سؤال {(index + 1).toLocaleString("fa-IR")}: {item.stem}
              </h2>
              <div className="mt-4 grid gap-2">
                {item.options.map((option, optionIndex) => {
                  const selected = completed ? item.selectedIndex === optionIndex : answers[item.id] === optionIndex;
                  const correct = completed && item.correctIndex === optionIndex;
                  const style = correct
                    ? "border-emerald-300 bg-emerald-400/20 text-emerald-100"
                    : selected
                      ? "border-violet-300 bg-violet-400/20 text-white"
                      : "border-slate-600 bg-slate-950 text-slate-200";
                  return (
                    <button
                      key={option}
                      disabled={completed}
                      onClick={() => setAnswers((current) => ({ ...current, [item.id]: optionIndex }))}
                      className={"rounded-xl border px-4 py-3 text-right " + style}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {completed && (
                <>
                  <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50">
                    <p className="font-black">پاسخ آموزشی ثبت‌شده</p>
                    <p className="mt-2 leading-7">{item.isCorrect ? "پاسخ شما صحیح بود. " : "نیاز به مرور: "}{item.explanation}</p>
                    <p className="mt-2 text-xs text-amber-100">این سؤال نمونه آموزشی است؛ پاسخ بالا «کلید رسمی آزمون» محسوب نمی‌شود.</p>
                  </div>
                  <button
                    type="button"
                    disabled={analysis?.status === "loading"}
                    onClick={() => void analyzeQuestion(item)}
                    className="mt-3 rounded-xl border border-cyan-300/40 bg-cyan-400/10 px-4 py-2.5 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20 disabled:opacity-50"
                  >
                    {analysis?.status === "loading" ? "در حال تحلیل سؤال…" : analysis?.status === "ready" ? "تحلیل دوباره با AI" : "تحلیل کامل با CivilMind AI"}
                  </button>
                  {analysis?.status === "ready" && analysis.text && (
                    <div className="mt-3 rounded-xl border border-violet-300/30 bg-violet-400/10 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-violet-100">تحلیل CivilMind AI</p>
                        <span className="rounded-full border border-violet-300/30 px-2 py-1 text-[11px] font-bold text-violet-200">تحلیل غیررسمی</span>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-8 text-slate-100">{analysis.text}</p>
                    </div>
                  )}
                  {analysis?.status === "blocked" && (
                    <p role="status" className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm leading-7 text-amber-100">
                      تحلیل پیشرفته سؤال یک قابلیت Premium است و پس از فعال‌شدن Provider AI اجرا می‌شود. پاسخ آموزشی و منابع رسمی همچنان رایگان می‌مانند.
                    </p>
                  )}
                  {analysis?.status === "error" && (
                    <p role="alert" className="mt-3 rounded-xl border border-rose-300/25 bg-rose-300/10 p-3 text-sm leading-7 text-rose-100">
                      تحلیل AI انجام نشد. پاسخ آموزشی ثبت‌شده بدون تغییر باقی مانده است؛ دوباره تلاش کنید.
                    </p>
                  )}
                </>
              )}
            </article>
            );
          })}
        </section>

        {message && <p className="rounded-xl bg-cyan-400/10 px-4 py-3 text-cyan-100">{message}</p>}
        {!completed ? (
          <button disabled={saving} onClick={finish} className="rounded-xl bg-violet-400 px-6 py-3 font-black text-slate-950 disabled:opacity-50">
            ثبت نهایی و تحلیل
          </button>
        ) : (
          <button onClick={() => setSessionId(null)} className="rounded-xl bg-cyan-500 px-6 py-3 font-black text-slate-950">
            بازگشت به مرکز آزمون
          </button>
        )}
      </div>
    );
  }

  const summary = analytics?.summary ?? { examsCount: 0, averageScore: 0, bestScore: 0, latestScore: 0, trendPoints: 0 };
  const weak = analytics?.topics.filter((topic) => topic.accuracyPercent < 60) ?? [];
  const strong = analytics?.topics.filter((topic) => topic.accuracyPercent >= 75) ?? [];

  return (
    <div className="space-y-8 p-5 md:p-8" dir="rtl">
      <header>
        <p className="text-sm font-bold text-violet-300">{mode === "exam" ? "Sprint 2D • Exam Center" : "Sprint 2D • Performance Analytics"}</p>
        <h1 className="mt-2 text-3xl font-black text-white">{mode === "exam" ? "مرکز آزمون" : "تحلیل عملکرد"}</h1>
        <p className="mt-2 text-slate-300">
          {mode === "exam"
            ? "یک آزمون نمونه را شروع کنید و نتیجه را برای تحلیل ثبت کنید."
            : "آمار، نقاط قوت و ضعف و تاریخچه آزمون‌های ثبت‌شده حساب شما."}
        </p>
      </header>

      {mode === "exam" ? (
        <>
          <section className="rounded-2xl border border-slate-600 bg-slate-900 p-6">
          <h2 className="text-xl font-black text-white">آماده شروع هستید؟</h2>
          <p className="mt-2 text-slate-300">پس از پایان آزمون، نتیجه به‌صورت خودکار در بخش تحلیل عملکرد ثبت می‌شود.</p>
          <button disabled={saving} onClick={begin} className="mt-5 rounded-xl bg-violet-400 px-6 py-3 font-black text-slate-950 disabled:opacity-50">
            شروع آزمون نمونه
          </button>
        </section>
          {!officialArchiveAccess?.preference ? (
            <section className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-5 text-cyan-100">
              آرشیو رسمی برای همهٔ کاربران رایگان است. ابتدا در پروفایل، رشته و صلاحیت آزمون خود را انتخاب کنید تا منابع مرتبط نمایش داده شود.
              <Link href="/profile" className="mr-3 inline-flex rounded-lg border border-cyan-300/60 px-3 py-1.5 text-sm font-bold text-cyan-100">انتخاب رشته و صلاحیت</Link>
            </section>
          ) : (
            <OfficialExamArchive archives={officialArchiveAccess.archives} onSeed={seedOfficialArchive} onSeedHistory={seedHistoricalArchive} disabled={saving} />
          )}
        </>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-4">
            <Stat label="تعداد آزمون" value={summary.examsCount.toLocaleString("fa-IR")} />
            <Stat label="میانگین" value={summary.averageScore.toLocaleString("fa-IR") + "٪"} />
            <Stat label="بهترین نتیجه" value={summary.bestScore.toLocaleString("fa-IR") + "٪"} />
            <Stat label="روند آخر" value={(summary.trendPoints >= 0 ? "+" : "") + summary.trendPoints.toLocaleString("fa-IR")} />
          </section>
          <section className="grid gap-6 lg:grid-cols-2">
            <TopicList title="نقاط نیازمند تمرکز" empty="پس از آزمون، نقاط ضعف اینجا نمایش داده می‌شوند." topics={weak} tone="rose" />
            <TopicList title="نقاط قوت" empty="هنوز داده کافی ثبت نشده است." topics={strong} tone="emerald" />
          </section>
          <section className="rounded-2xl border border-slate-600 bg-slate-900 p-5">
            <h2 className="text-xl font-black text-white">تاریخچه آزمون‌ها</h2>
            <div className="mt-4 space-y-3">
              {(analytics?.recentExams ?? []).length === 0 ? (
                <p className="text-slate-300">هنوز آزمونی تکمیل نشده است.</p>
              ) : analytics?.recentExams.map((exam) => (
                <div key={exam.id} className="flex justify-between rounded-xl border border-slate-600 bg-slate-950 p-4">
                  <div>
                    <p className="font-bold text-white">{exam.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(exam.completedAt).toLocaleDateString("fa-IR")}</p>
                  </div>
                  <p className="text-2xl font-black text-cyan-300">{exam.scorePercent.toLocaleString("fa-IR")}٪</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
      {message && <p className="rounded-xl bg-rose-400/10 px-4 py-3 text-rose-100">{message}</p>}
    </div>
  );
}


function GuestArchivePicker({ preference, onChange }: { preference: GuestExamPreference | null; onChange: (preference: GuestExamPreference) => void }) {
  const [discipline, setDiscipline] = useState(preference?.discipline ?? "عمران");
  const [qualification, setQualification] = useState(preference?.qualification ?? "نظارت");

  return (
    <section className="mx-auto max-w-5xl rounded-2xl border border-cyan-400/30 bg-slate-900 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">رشته و صلاحیت خود را انتخاب کنید</h2>
          <p className="mt-1 text-sm text-slate-300">این فیلتر رایگان است و برای حساب مهمان، فقط در مرورگر شما نگهداری می‌شود.</p>
        </div>
        <button onClick={() => onChange({ discipline, qualification })} className="rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950">نمایش آرشیو رسمی</button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-100">رشته
          <select value={discipline} onChange={(event) => setDiscipline(event.target.value)} className="rounded-xl border border-slate-500 bg-slate-950 px-4 py-3 text-white">
            {DISCIPLINES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-100">صلاحیت
          <select value={qualification} onChange={(event) => setQualification(event.target.value)} className="rounded-xl border border-slate-500 bg-slate-950 px-4 py-3 text-white">
            {QUALIFICATIONS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
    </section>
  );
}

function OfficialExamArchive({ archives, onSeed, onSeedHistory, disabled, publicMode = false }: {
  archives: Array<{ id: string; title: string; yearLabel?: string; sessionLabel?: string; officialPageUrl: string; documents: Array<{ id: string; kind: "question-booklet" | "answer-key" | "descriptive-guide"; title: string; discipline: string; qualification?: string; sourceUrl: string }> }> | undefined;
  onSeed: () => Promise<void>;
  onSeedHistory: () => Promise<void>;
  disabled: boolean;
  publicMode?: boolean;
}) {
  if (archives === undefined) return <section className="rounded-2xl border border-slate-600 bg-slate-900 p-6 text-slate-300">در حال دریافت آرشیو رسمی…</section>;
  const labels = { "question-booklet": "دفترچه سؤال رسمی", "answer-key": "کلید پاسخ رسمی", "descriptive-guide": "راهنمای تشریحی رسمی" } as const;
  return <section className="rounded-2xl border border-slate-600 bg-slate-900 p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold text-cyan-300">آرشیو رسمی آزمون‌ها</p><h2 className="mt-1 text-xl font-black text-white">دفترچه، کلید و راهنمای تشریحیِ تفکیک‌شده</h2></div><div className="flex gap-2"><span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">فقط منبع رسمی INBR</span>{!publicMode && archives.length === 0 && <button disabled={disabled} onClick={() => void onSeed()} className="rounded-lg bg-cyan-400 px-3 py-1 text-xs font-black text-slate-950 disabled:opacity-50">دریافت آرشیو رسمی</button>}{!publicMode && <button disabled={disabled} onClick={() => void onSeedHistory()} className="rounded-lg border border-violet-300/50 px-3 py-1 text-xs font-black text-violet-100 disabled:opacity-50">افزودن دوره‌های گذشته</button>}</div></div>{archives.length === 0 ? <p className="mt-4 text-slate-300">برای این انتخاب، هنوز نسخهٔ تأییدشده‌ای در آرشیو ثبت نشده است.</p> : archives.map((archive) => <article key={archive.id} className="mt-5 rounded-xl border border-slate-600 bg-slate-950 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black text-white">{archive.title}</h3><p className="mt-1 text-sm text-slate-300">{archive.documents.length.toLocaleString("fa-IR")} سند رسمی ثبت‌شده</p></div><a href={archive.officialPageUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-cyan-300 px-3 py-2 text-sm font-bold text-cyan-200">صفحه رسمی دوره</a></div>{(["question-booklet", "answer-key", "descriptive-guide"] as const).map((kind) => { const documents = archive.documents.filter((document) => document.kind === kind); return <section key={kind} className="mt-4"><h4 className="text-sm font-black text-cyan-200">{labels[kind]}</h4>{documents.length === 0 ? <p className="mt-2 rounded-lg border border-dashed border-slate-600 px-3 py-2 text-xs text-slate-400">نسخهٔ رسمیِ تفکیک‌شده برای این بخش هنوز تأیید و ثبت نشده است.</p> : <div className="mt-2 grid gap-3 md:grid-cols-2">{documents.map((document) => <a key={document.id} href={document.sourceUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-600 bg-slate-900 p-3 transition hover:border-cyan-300"><p className="font-bold text-white">{document.title}</p><p className="mt-1 text-xs text-slate-300">{document.discipline}{document.qualification ? ` · ${document.qualification}` : ""}</p><p className="mt-2 text-xs font-bold text-cyan-300">{labels[kind]} ↗</p></a>)}</div>}</section>; })}<p className="mt-4 text-xs text-amber-200">تحلیل CivilMind AI همیشه جدا از اسناد و پاسخ رسمی برچسب می‌خورد و جایگزین آن‌ها نیست.</p></article>)}</section>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-600 bg-slate-900 p-5">
      <p className="text-sm text-slate-300">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function TopicList({ title, empty, topics, tone }: {
  title: string;
  empty: string;
  topics: Array<{ topicKey: string; topicTitle: string; accuracyPercent: number }>;
  tone: "rose" | "emerald";
}) {
  return (
    <div className="rounded-2xl border border-slate-600 bg-slate-900 p-5">
      <h2 className="text-xl font-black text-white">{title}</h2>
      <div className="mt-4 space-y-3">
        {topics.length === 0 ? <p className="text-slate-300">{empty}</p> : topics.map((topic) => (
          <div key={topic.topicKey} className={"rounded-xl border p-4 " + (tone === "rose" ? "border-rose-400 bg-rose-400/10" : "border-emerald-400 bg-emerald-400/10")}>
            <p className="font-bold text-white">{topic.topicTitle}</p>
            <p className="mt-1 text-sm text-slate-200">دقت {topic.accuracyPercent.toLocaleString("fa-IR")}٪</p>
          </div>
        ))}
      </div>
    </div>
  );
}
