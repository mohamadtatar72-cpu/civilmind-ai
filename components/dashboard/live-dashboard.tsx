"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { dashboardData } from "@/lib/data/dashboard";
import { asDashboardApi } from "@/features/dashboard/convex-repository";
import Dashboard from "./dashboard";

const dashboardApi = asDashboardApi(api);

export default function LiveDashboard() {
  const liveData = useQuery(dashboardApi.dashboard.getPublicOverview, {});

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-xs text-slate-400">
        <span>
          {liveData === undefined
            ? "در حال دریافت اطلاعات زنده از Convex…"
            : "اطلاعات این صفحه از رجیستری زنده Convex دریافت شده است."}
        </span>
        <span className={`size-2 rounded-full ${liveData === undefined ? "animate-pulse bg-amber-300" : "bg-emerald-400"}`} aria-hidden="true" />
      </div>
      <Dashboard data={liveData ?? dashboardData} />
    </div>
  );
}
