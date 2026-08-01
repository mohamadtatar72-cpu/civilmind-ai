"use client";

import { useState } from "react";
import Link from "next/link";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type ExamCenterProps = { mode: "exam" | "analytics" };

export default function ExamCenter({ mode }: ExamCenterProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const analytics = useQuery(api.examEngine.getMyAnalytics, isAuthenticated ? {} : "skip");
  const officialArchiveAccess = useQuery(api.examAccess.listMyEligibleArchive, isAuthenticated ? {} : "skip");
  const seedArchive = useMutation(api.examArchives.seedDey1404OfficialBooklets);
  const startExam = useMutation(api.examEngine.startSampleExam);
  const submitExam = useMutation(api.examEngine.submitExam);
  const [sessionId, setSessionId] = useState<Id<"examSessions"> | null>(null);
  const session = useQuery(api.examEngine.getSession, sessionId ? { sessionId } : "skip");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

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

  if (isLoading) return <div className="p-8 text-slate-300">در حال بررسی ورود امن…</div>;

  if (!isAuthenticated) {
    return (
      <div className="p-8" dir="rtl">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-600 bg-slate-900 p-8 text-center">
          <h1 className="text-2xl font-black text-white">{mode === "exam" ? "مرکز آزمون" : "تحلیل عملکرد"}</h1>
          <p className="mt-3 text-slate-300">{mode === "exam" ? "برای شروع آزمون و ذخیره نتیجه وارد حساب شوید." : "برای مشاهده آمار و تحلیل شخصی وارد حساب شوید."}</p>
          <Link href="/sign-in" className="mt-6 inline-flex rounded-xl bg-violet-400 px-5 py-3 font-black text-slate-950">ورود امن</Link>
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
          {session.items.map((item, index) => (
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
                <p className="mt-4 rounded-xl bg-slate-800 px-4 py-3 text-sm text-slate-100">
                  {item.isCorrect ? "پاسخ صحیح بود. " : "نیاز به مرور: "}
                  {item.explanation}
                </p>
              )}
            </article>
          ))}
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
          {!officialArchiveAccess?.hasPremiumAccess ? (
            <section className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-amber-100">برای مشاهده آرشیو تفکیک‌شدهٔ دفترچه و پاسخنامه، اشتراک حرفه‌ای فعال کنید.</section>
          ) : !officialArchiveAccess.preference ? (
            <section className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-5 text-cyan-100">ابتدا در پروفایل، رشته و صلاحیت آزمون خود را انتخاب کنید.</section>
          ) : (
            <OfficialExamArchive archives={officialArchiveAccess.archives} onSeed={seedOfficialArchive} disabled={saving} />
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


function OfficialExamArchive({ archives, onSeed, disabled }: {
  archives: Array<{ id: string; title: string; yearLabel: string; sessionLabel: string; officialPageUrl: string; documents: Array<{ id: string; title: string; discipline: string; qualification?: string; sourceUrl: string }> }> | undefined;
  onSeed: () => Promise<void>;
  disabled: boolean;
}) {
  if (archives === undefined) return <section className="rounded-2xl border border-slate-600 bg-slate-900 p-6 text-slate-300">در حال دریافت آرشیو رسمی…</section>;
  return <section className="rounded-2xl border border-slate-600 bg-slate-900 p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold text-cyan-300">آرشیو رسمی آزمون‌ها</p><h2 className="mt-1 text-xl font-black text-white">دفترچه و پاسخنامه، تفکیک‌شده بر اساس دوره و گرایش</h2></div><div className="flex gap-2"><span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">فقط منبع رسمی INBR</span>{archives.length === 0 && <button disabled={disabled} onClick={() => void onSeed()} className="rounded-lg bg-cyan-400 px-3 py-1 text-xs font-black text-slate-950 disabled:opacity-50">دریافت آرشیو رسمی</button>}</div></div>{archives.length === 0 ? <p className="mt-4 text-slate-300">آرشیو رسمی در حال ورود است.</p> : archives.map((archive) => <article key={archive.id} className="mt-5 rounded-xl border border-slate-600 bg-slate-950 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black text-white">{archive.title}</h3><p className="mt-1 text-sm text-slate-300">{archive.sessionLabel} {archive.yearLabel} · {archive.documents.length.toLocaleString("fa-IR")} دفترچه ثبت‌شده</p></div><a href={archive.officialPageUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-cyan-300 px-3 py-2 text-sm font-bold text-cyan-200">صفحه رسمی دوره</a></div><div className="mt-4 grid gap-3 md:grid-cols-2">{archive.documents.map((document) => <a key={document.id} href={document.sourceUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-600 bg-slate-900 p-3 transition hover:border-cyan-300"><p className="font-bold text-white">{document.title}</p><p className="mt-1 text-xs text-slate-300">{document.discipline}{document.qualification ? ` · ${document.qualification}` : ""}</p><p className="mt-2 text-xs font-bold text-cyan-300">دفترچه رسمی ↗</p></a>)}</div><p className="mt-4 text-xs text-amber-200">پاسخنامه یا راهنمای تشریحی فقط پس از یافتن و تأیید نسخهٔ رسمیِ همان دوره به این بخش افزوده می‌شود.</p></article>)}</section>;
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
