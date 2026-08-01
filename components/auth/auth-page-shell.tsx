import Link from "next/link";
import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

export function AuthPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_auto]">
        <section className="max-w-2xl">
          <Link href="/dashboard" className="text-xl font-black text-white">
            CivilMind AI
          </Link>
          <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
            <ShieldCheck className="size-4" />
            ورود امن و کنترل‌شده
          </span>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-xl leading-8 text-slate-400">{description}</p>
          <p className="mt-6 text-sm leading-7 text-slate-500">
            نقش‌ها و دسترسی‌های CivilMind فقط در Backend بررسی می‌شوند. ورود به حساب
            به‌تنهایی هیچ دسترسی مدیریتی ایجاد نمی‌کند.
          </p>
        </section>
        <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-3 shadow-2xl backdrop-blur-xl">
          {children}
        </section>
      </div>
    </main>
  );
}

export function AuthConfigurationMissing() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-amber-400/20 bg-amber-400/10 p-6 text-center">
      <h2 className="font-bold text-amber-200">احراز هویت هنوز پیکربندی نشده است</h2>
      <p className="mt-3 text-sm leading-7 text-amber-100/70">
        کلید عمومی Clerk باید در محیط استقرار تنظیم شود. هیچ حساب آزمایشی یا ورود
        جعلی نمایش داده نمی‌شود؛ دسترسی مدیر نیز فقط پس از ورود در Backend بررسی می‌شود.
      </p>
    </div>
  );
}
