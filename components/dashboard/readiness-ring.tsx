"use client";

export default function ReadinessRing() {
  const progress = 71;
  const radius = 70;
  const stroke = 12;

  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  const strokeDashoffset =
    circumference - (progress / 100) * circumference;

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">

      <h2 className="text-xl font-bold mb-6">
        میزان آمادگی
      </h2>

      <div className="flex justify-center">

        <svg
          width={170}
          height={170}
          className="-rotate-90"
        >
          <circle
            stroke="#27272a"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx="85"
            cy="85"
          />

          <circle
            stroke="#3b82f6"
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            style={{
              strokeDashoffset,
            }}
            r={normalizedRadius}
            cx="85"
            cy="85"
          />

        </svg>

        <div className="absolute mt-[58px] text-center">

          <div className="text-5xl font-bold">
            {progress}%
          </div>

          <div className="text-zinc-400 mt-1">
            آمادگی
          </div>

        </div>

      </div>

    </div>
  );
}