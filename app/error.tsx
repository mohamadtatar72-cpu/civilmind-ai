"use client";

import { useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import { GlassPanel } from "@/components/ui/civilmind";

export default function ErrorPage({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <AppShell><GlassPanel className="py-14 text-center"><h1 className="text-2xl font-black">خطایی در نمایش این بخش رخ داد</h1><p className="mt-3 text-slate-400">داده‌های شما تغییر نکرده است. می‌توانید نمایش صفحه را دوباره امتحان کنید.</p><button type="button" onClick={unstable_retry} className="mt-6 rounded-xl bg-blue-500 px-4 py-2.5 font-bold hover:bg-blue-400">تلاش دوباره</button></GlassPanel></AppShell>;
}
