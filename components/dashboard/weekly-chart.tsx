"use client";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  Tooltip,
} from "recharts";

import { dashboardData } from "@/lib/data/dashboard";

export default function WeeklyChart() {
  const data = dashboardData.weeklyProgress.map((item) => ({
    day: item.day,
    score: item.value,
  }));

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

      <h2 className="mb-6 text-xl font-bold">
        روند آمادگی هفتگی
      </h2>


      <div className="h-72">

        <ResponsiveContainer width="100%" height={280}>

          <LineChart data={data}>

            <XAxis dataKey="day" />

            <Tooltip />

            <Line
              dataKey="score"
              strokeWidth={3}
              type="monotone"
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}