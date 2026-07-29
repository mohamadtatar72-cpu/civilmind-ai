"use client";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  Tooltip,
} from "recharts";

const data = [
  { day: "ش", score: 35 },
  { day: "ی", score: 42 },
  { day: "د", score: 50 },
  { day: "س", score: 58 },
  { day: "چ", score: 63 },
  { day: "پ", score: 68 },
  { day: "ج", score: 71 },
];

export default function WeeklyChart() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-6 text-xl font-bold">
        روند آمادگی هفتگی
      </h2>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
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