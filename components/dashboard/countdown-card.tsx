"use client";

export default function CountdownCard() {
  const examDate = new Date("2026-10-15");
  const today = new Date();

  const diff =
    Math.ceil(
      (examDate.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

      <p className="text-zinc-400 text-sm">
        زمان باقی مانده تا آزمون
      </p>

      <h2 className="mt-3 text-6xl font-bold text-blue-500">
        {diff}
      </h2>

      <p className="mt-2 text-zinc-500">
        روز
      </p>

      <div className="mt-6 h-2 rounded-full bg-zinc-800 overflow-hidden">

        <div
          className="h-full rounded-full bg-blue-500"
          style={{
            width: `${Math.max(
              0,
              Math.min(100, (365 - diff) / 365 * 100)
            )}%`,
          }}
        />

      </div>

    </div>
  );
}