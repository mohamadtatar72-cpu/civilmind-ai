"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { topics } from "@/lib/data/library";
import { EmptyState, GlassPanel, StatusBadge } from "@/components/ui/civilmind";

export default function SearchExperience() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fa");
    return normalized ? topics.filter(topic => topic.title.toLocaleLowerCase("fa").includes(normalized)) : topics.slice(0, 6);
  }, [query]);
  return <><GlassPanel><label htmlFor="knowledge-search" className="mb-2 block text-sm font-semibold">عبارت جستجو</label><div className="relative"><Search className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-slate-500" /><input id="knowledge-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="مثلاً بتن، فولاد یا مبحث ۷…" className="w-full rounded-xl border border-white/10 bg-black/20 py-3.5 pr-11 pl-4 text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/10" /></div></GlassPanel>
    {results.length ? <GlassPanel className="grid gap-3 md:grid-cols-2">{results.map(topic => <Link key={topic.id} href={`/library/${topic.id}`} className="rounded-xl border border-white/8 p-4 hover:border-blue-400/30"><div className="flex justify-between gap-3"><span className="font-semibold leading-7">{topic.title}</span><StatusBadge tone={topic.pdf ? "success" : "neutral"}>{topic.progress}٪</StatusBadge></div></Link>)}</GlassPanel> : <EmptyState title="نتیجه‌ای پیدا نشد" description="عبارت کوتاه‌تری وارد کنید یا شماره مبحث را جستجو کنید." />}</>;
}
