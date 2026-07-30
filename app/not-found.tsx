import Link from "next/link";
import AppShell from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/civilmind";

export default function NotFound() {
  return <AppShell><EmptyState title="این مسیر پیدا نشد" description="نشانی واردشده در CivilMind وجود ندارد یا جابه‌جا شده است." /><div className="mt-5 text-center"><Link href="/dashboard" className="inline-flex rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-400">بازگشت به مرکز مأموریت</Link></div></AppShell>;
}
