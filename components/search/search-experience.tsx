"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { ExternalLink, Search } from "lucide-react";
import { EmptyState, GlassPanel, StatusBadge } from "@/components/ui/civilmind";
import {
  asLibraryApi,
  mapPublicTopics,
} from "@/features/library/convex-repository";
import { api } from "@/convex/_generated/api";
import { normalizePersianSearch } from "@/lib/persian-normalization";

export default function SearchExperience() {
  const [query, setQuery] = useState("");
  const result = useQuery(asLibraryApi(api).topics.listActive, {});
  const results = useMemo(() => {
    if (result === undefined) {
      return undefined;
    }
    const topics = mapPublicTopics(result);
    const normalized = normalizePersianSearch(query);
    return normalized
      ? topics.filter((topic) =>
          normalizePersianSearch(
            `${topic.code} ${topic.title} ${topic.shortTitle}`,
          ).includes(normalized),
        )
      : topics.slice(0, 6);
  }, [query, result]);
  return <><GlassPanel><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><label htmlFor="knowledge-search" className="text-sm font-semibold">عبارت جستجو</label><Link href="/official-sources" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200">منابع رسمی<ExternalLink className="size-4" /></Link></div><div className="relative"><Search className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-slate-500" /><input id="knowledge-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="مثلاً بتن، فولاد یا مبحث ۷…" className="w-full rounded-xl border border-white/10 bg-black/20 py-3.5 pr-11 pl-4 text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/10" /></div></GlassPanel>
    {results === undefined ? <GlassPanel><div role="status" className="h-24 animate-pulse rounded-xl bg-white/6"><span className="sr-only">در حال جستجو…</span></div></GlassPanel> : results.length ? <GlassPanel className="grid gap-3 md:grid-cols-2">{results.map(topic => <Link key={topic.code} href={`/library/${topic.code}`} className="rounded-xl border border-white/8 p-4 hover:border-blue-400/30"><div className="flex justify-between gap-3"><span className="font-semibold leading-7">{topic.title}</span><StatusBadge tone="neutral">{topic.questionCount.toLocaleString("fa-IR")} سؤال</StatusBadge></div></Link>)}</GlassPanel> : <EmptyState title="نتیجه‌ای پیدا نشد" description="عبارت کوتاه‌تری وارد کنید یا شماره مبحث را جستجو کنید." />}</>;
}
