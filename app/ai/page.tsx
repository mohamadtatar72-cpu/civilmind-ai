"use client";

import { FormEvent, useState } from "react";
import AppShell from "@/components/layout/app-shell";
import { GlassPanel, PageHeader, SectionTitle, StatusBadge } from "@/components/ui/civilmind";

const suggestions = ["خلاصه مبحث ۹ بتن", "تحلیل آزمون اخیر", "برنامه مطالعه امروز", "سؤال از منابع PDF"];

export default function AIPage() {
  const [question, setQuestion] = useState("");
  const [message, setMessage] = useState<string>();
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!question.trim()) { setMessage("لطفاً ابتدا سؤال خود را بنویسید."); return; }
    setMessage("مربی هوشمند هنوز به سرویس پاسخ‌گویی متصل نیست. پرسش شما فقط در همین صفحه نگه‌داری شد و جایی ارسال نشد.");
  }
  return <AppShell><div className="space-y-6">
    <PageHeader eyebrow="مربی هوشمند" title="همراه مطالعاتی CivilMind" description="برای مرور مباحث، تحلیل مسیر و برنامه‌ریزی آماده می‌شود؛ اتصال مدل هوش مصنوعی در فاز backend انجام خواهد شد." action={<StatusBadge tone="info">حالت نمایشی امن</StatusBadge>} />
    <GlassPanel><form onSubmit={submit}><label htmlFor="coach-question" className="font-bold">سؤال شما</label><div className="mt-3 flex flex-col gap-3 sm:flex-row"><input id="coach-question" value={question} onChange={event => setQuestion(event.target.value)} placeholder="سؤال خود را درباره عمران و آزمون بنویسید…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-blue-400/50" /><button type="submit" className="rounded-xl bg-blue-500 px-6 py-3 font-bold hover:bg-blue-400">بررسی پرسش</button></div>{message && <p role="status" className="mt-4 rounded-xl border border-blue-400/15 bg-blue-400/5 p-3 text-sm leading-6 text-blue-200">{message}</p>}</form></GlassPanel>
    <GlassPanel><SectionTitle title="پیشنهادهای سریع" description="انتخاب هر مورد، متن پیشنهادی را در کادر قرار می‌دهد." /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{suggestions.map(item => <button type="button" key={item} onClick={() => { setQuestion(item); setMessage(undefined); }} className="rounded-xl border border-white/10 bg-white/4 p-4 text-right text-sm font-semibold hover:border-blue-400/30 hover:bg-blue-400/5">{item}</button>)}</div></GlassPanel>
  </div></AppShell>;
}
