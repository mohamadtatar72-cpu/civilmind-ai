import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowLeft, Inbox, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
    <div className="max-w-3xl">{eyebrow && <p className="mb-2 text-xs font-bold text-blue-400">{eyebrow}</p>}<h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{title}</h1><p className="mt-2 leading-7 text-slate-400">{description}</p></div>{action}
  </header>;
}

export function GlassPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_16px_50px_-30px_rgba(0,0,0,.8)] backdrop-blur-xl sm:p-6", className)}>{children}</section>;
}

export function MetricCard({ label, value, detail, icon: Icon, tone = "blue" }: { label: string; value: string; detail?: string; icon?: LucideIcon; tone?: "blue" | "green" | "amber" | "violet" }) {
  const tones = { blue: "text-blue-300 bg-blue-400/10", green: "text-emerald-300 bg-emerald-400/10", amber: "text-amber-300 bg-amber-400/10", violet: "text-violet-300 bg-violet-400/10" };
  return <GlassPanel className="relative overflow-hidden"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-slate-400">{label}</p><p data-numeric className="mt-3 text-3xl font-black text-white">{value}</p>{detail && <p className="mt-2 text-xs text-slate-500">{detail}</p>}</div>{Icon && <span className={cn("rounded-xl p-2.5", tones[tone])}><Icon className="size-5" /></span>}</div></GlassPanel>;
}

export function SectionTitle({ title, description, actionHref, actionLabel = "مشاهده همه" }: { title: string; description?: string; actionHref?: string; actionLabel?: string }) {
  return <div className="mb-5 flex items-end justify-between gap-4"><div><h2 className="text-lg font-bold text-white">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>{actionHref && <Link href={actionHref} className="flex shrink-0 items-center gap-1 text-sm text-blue-300 hover:text-blue-200">{actionLabel}<ArrowLeft className="size-4" /></Link>}</div>;
}

export function StatusBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "success" | "warning" | "info" | "neutral" }) {
  const tones = { success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300", warning: "border-amber-400/20 bg-amber-400/10 text-amber-300", info: "border-blue-400/20 bg-blue-400/10 text-blue-300", neutral: "border-white/10 bg-white/5 text-slate-300" };
  return <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", tones[tone])}>{children}</span>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <GlassPanel className="py-12 text-center"><Inbox className="mx-auto size-8 text-slate-600" /><h2 className="mt-4 font-bold text-white">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p></GlassPanel>;
}

export function ComingSoon({ title, description, destination = "/dashboard" }: { title: string; description: string; destination?: string }) {
  return <GlassPanel className="py-14 text-center"><span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-blue-400/10 text-blue-300"><Sparkles className="size-6" /></span><StatusBadge tone="info">در حال توسعه</StatusBadge><h2 className="mt-4 text-xl font-bold text-white">{title}</h2><p className="mx-auto mt-2 max-w-xl leading-7 text-slate-400">{description}</p><Link href={destination} className="mt-6 inline-flex rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-400">بازگشت به مرکز مأموریت</Link></GlassPanel>;
}
