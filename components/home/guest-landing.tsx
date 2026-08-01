"use client";

import Link from "next/link";
import { FileUp, Mic, Send, ShieldCheck, Sparkles } from "lucide-react";

const prompts = [
  "از مبحث ۹ چه سؤال‌هایی آمده؟",
  "این بند را ساده توضیح بده",
  "این پاسخ را با منبع رسمی بررسی کن",
];

export default function GuestLanding() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8" dir="rtl">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-blue-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.18),_transparent_44%)] p-6 sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100"><Sparkles className="size-3.5" /> دستیار تخصصی آزمون‌های مهندسی</p>
            <h1 className="mt-5 text-4xl font-black leading-tight text-white sm:text-5xl">هوش مصنوعی تخصصی آزمون نظام مهندسی</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">منابع رسمی را پیدا کنید، سؤال‌ها را کنار پاسخ‌نامه‌ها ببینید و با CivilMind AI مفاهیم و مقررات را بهتر بفهمید. خود منابع رسمی، فیلتر رشته و صلاحیت همیشه رایگان‌اند.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/exam" className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-black text-white hover:bg-blue-400">شروع رایگان</Link>
              <Link href="#ask-civilmind" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-black text-slate-100 hover:bg-white/10">مشاهده دمو</Link>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-cyan-950/30">
            <div className="flex items-center gap-3 text-cyan-200"><ShieldCheck className="size-5" /><span className="font-black">منبع رسمی + تحلیل AI با برچسب جدا</span></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-4"><p className="text-xs text-blue-100/80">منابع رسمی</p><p className="mt-2 font-black text-white">مبحث، صفحه، نسخه</p></div>
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4"><p className="text-xs text-cyan-100/80">تحلیل CivilMind AI</p><p className="mt-2 font-black text-white">توضیح و مسیر یادگیری</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="ask-civilmind" className="mx-auto mt-6 max-w-6xl rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:p-8">
        <p className="text-sm font-bold text-cyan-300">از CivilMind AI بپرس</p>
        <h2 className="mt-2 text-2xl font-black text-white">پرسش خود را داخل CivilMind مطرح کنید</h2>
        <p className="mt-2 text-sm leading-7 text-slate-300">دموی مهمان ابتدا منابع قابل استناد را جست‌وجو می‌کند؛ پاسخ AI و تحلیل شخصی پس از ورود فعال می‌شود.</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input readOnly placeholder="هر سؤالی درباره مقررات ملی ساختمان بپرس..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none" />
          <button type="button" aria-label="ورودی صوتی در دمو" className="rounded-xl border border-white/15 p-3 text-slate-300"><Mic className="size-5" /></button>
          <button type="button" aria-label="پیوست فایل در دمو" className="rounded-xl border border-white/15 p-3 text-slate-300"><FileUp className="size-5" /></button>
          <Link href="/ai" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950"><Send className="size-4" /> ورود به AI</Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">{prompts.map((prompt) => <Link key={prompt} href={`/ai?question=${encodeURIComponent(prompt)}`} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10">{prompt}</Link>)}</div>
      </section>
    </main>
  );
}
