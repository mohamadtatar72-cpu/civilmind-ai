import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <main className="mr-auto min-h-screen w-full max-w-[1440px] space-y-6 p-6 lg:mr-72 lg:p-8" role="status" aria-label="در حال بارگذاری">
    <div className="space-y-3"><Skeleton className="h-8 w-56 bg-white/10" /><Skeleton className="h-5 w-full max-w-xl bg-white/10" /></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-2xl bg-white/10" />)}</div>
    <Skeleton className="h-80 rounded-2xl bg-white/10" />
  </main>;
}
