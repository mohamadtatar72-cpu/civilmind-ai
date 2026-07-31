"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400";

export default function StudyProgressDashboard() {
  const progress = useQuery(api.studyProgress.getMyProgress, {});
  const logStudy = useMutation(api.studyProgress.logStudySession);
  const logAttempt = useMutation(api.studyProgress.logPracticeAttempt);
  const [topicTitle, setTopicTitle] = useState("");
  const [duration, setDuration] = useState("30");
  const [questions, setQuestions] = useState("20");
  const [correct, setCorrect] = useState("0");
  const [incorrect, setIncorrect] = useState("0");
  const [unanswered, setUnanswered] = useState("20");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const topicKey = useMemo(
    () =>
      topicTitle
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\u0600-\u06ff-]/g, ""),
    [topicTitle],
  );

  async function submitStudy(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await logStudy({
        topicKey,
        topicTitle,
        durationMinutes: Number(duration),
        source: "manual",
        studiedAt: Date.now(),
      });
      setMessage("جلسه مطالعه با موفقیت ثبت شد.");
    } catch {
      setMessage("ثبت جلسه ممکن نشد؛ اطلاعات و وضعیت ورود را بررسی کنید.");
    } finally {
      setSaving(false);
    }
  }

  async function submitAttempt(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await logAttempt({
        topicKey,
        topicTitle,
        totalQuestions: Number(questions),
        correctAnswers: Number(correct),
        incorrectAnswers: Number(incorrect),
        unanswered: Number(unanswered),
        durationSeconds: 0,
        completedAt: Date.now(),
      });
      setMessage("نتیجه تست ثبت و پیشرفت دوباره محاسبه شد.");
    } catch {
      setMessage("جمع پاسخ‌ها باید دقیقاً با تعداد سؤال‌ها برابر باشد.");
    } finally {
      setSaving(false);
    }
  }

  const totals = progress?.totals ?? {
    studyMinutes: 0,
    sessionsCount: 0,
    testsCount: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    accuracyPercent: 0,
  };

  return (
    <div className="space-y-8 p-5 md:p-8" dir="rtl">
      <header>
        <p className="text-sm font-medium text-cyan-300">Sprint 2B • Real Progress</p>
        <h1 className="mt-2 text-3xl font-black text-white">
          ثبت واقعی مطالعه، تست و پیشرفت
        </h1>
        <p className="mt-2 text-slate-400">
          همه اعداد این صفحه از فعالیت‌های ثبت‌شده حساب شما در Convex محاسبه می‌شوند.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["زمان مطالعه", `${totals.studyMinutes.toLocaleString("fa-IR")} دقیقه`],
          ["جلسه مطالعه", totals.sessionsCount.toLocaleString("fa-IR")],
          ["آزمون ثبت‌شده", totals.testsCount.toLocaleString("fa-IR")],
          ["دقت پاسخ", `${totals.accuracyPercent.toLocaleString("fa-IR")}٪`],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-3 text-2xl font-black text-white">{value}</p>
          </article>
        ))}
      </section>

      {message && (
        <p className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
          {message}
        </p>
      )}

      <section className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={submitStudy} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-xl font-bold text-white">ثبت جلسه مطالعه</h2>
          <label className="block space-y-2 text-sm text-slate-300">
            <span>عنوان مبحث</span>
            <input required minLength={2} maxLength={120} value={topicTitle} onChange={(e) => setTopicTitle(e.target.value)} className={inputClass} placeholder="مثلاً مبحث ۹ - بتن" />
          </label>
          <label className="block space-y-2 text-sm text-slate-300">
            <span>مدت مطالعه (دقیقه)</span>
            <input required type="number" min={1} max={720} value={duration} onChange={(e) => setDuration(e.target.value)} className={inputClass} />
          </label>
          <button disabled={saving || topicKey.length < 2} className="rounded-xl bg-cyan-500 px-4 py-2 font-bold text-slate-950 disabled:opacity-50">
            ثبت مطالعه
          </button>
        </form>

        <form onSubmit={submitAttempt} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-xl font-bold text-white">ثبت نتیجه تست</h2>
          <p className="text-sm text-slate-400">نتیجه برای همان عنوان مبحث بالا ثبت می‌شود.</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["تعداد سؤال", questions, setQuestions],
              ["درست", correct, setCorrect],
              ["غلط", incorrect, setIncorrect],
              ["نزده", unanswered, setUnanswered],
            ].map(([label, value, setter]) => (
              <label key={label as string} className="space-y-2 text-sm text-slate-300">
                <span>{label as string}</span>
                <input required type="number" min={0} max={500} value={value as string} onChange={(e) => (setter as (value: string) => void)(e.target.value)} className={inputClass} />
              </label>
            ))}
          </div>
          <button disabled={saving || topicKey.length < 2} className="rounded-xl bg-violet-400 px-4 py-2 font-bold text-slate-950 disabled:opacity-50">
            ثبت تست
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-xl font-bold text-white">پیشرفت مباحث</h2>
        {progress === undefined ? (
          <p className="mt-4 text-slate-400">در حال دریافت داده زنده…</p>
        ) : progress.topics.length === 0 ? (
          <p className="mt-4 text-slate-400">هنوز فعالیتی ثبت نشده است.</p>
        ) : (
          <div className="mt-5 space-y-4">
            {progress.topics.map((topic) => (
              <div key={topic.topicKey}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium text-white">{topic.topicTitle}</span>
                  <span className="text-cyan-300">{topic.masteryPercent.toLocaleString("fa-IR")}٪ تسلط</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-l from-cyan-400 to-violet-500" style={{ width: `${topic.masteryPercent}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {topic.studyMinutes.toLocaleString("fa-IR")} دقیقه • {topic.questionsAnswered.toLocaleString("fa-IR")} پاسخ
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
