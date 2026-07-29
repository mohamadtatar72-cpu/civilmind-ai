import { Brain, Sparkles, TriangleAlert } from "lucide-react";

export default function AIInsights() {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

      <div className="flex items-center gap-3 mb-6">
        <Brain className="text-cyan-400" size={28} />
        <div>
          <h2 className="text-xl font-bold">
            تحلیل هوش مصنوعی
          </h2>

          <p className="text-zinc-400 text-sm">
            پیشنهادهای امروز بر اساس روند مطالعه
          </p>
        </div>
      </div>

      <div className="space-y-4">

        <div className="rounded-xl bg-zinc-800 p-4 flex gap-3">
          <Sparkles className="text-green-400 mt-1" />

          <div>
            <h3 className="font-semibold">
              پیشنهاد امروز
            </h3>

            <p className="text-sm text-zinc-400 mt-1">
              بهتر است ابتدا مبحث ۹ (بتن) را مرور کرده و سپس آزمون شماره ۱۲ را
              حل کنید. احتمال افزایش آمادگی شما تا ۷۵٪ وجود دارد.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-zinc-800 p-4 flex gap-3">
          <TriangleAlert className="text-yellow-400 mt-1" />

          <div>
            <h3 className="font-semibold">
              نقطه ضعف
            </h3>

            <p className="text-sm text-zinc-400 mt-1">
              عملکرد شما در مباحث ۷ و ۸ پایین‌تر از میانگین است و نیاز به مرور
              مجدد دارد.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 p-5">

          <p className="text-sm text-white/80">
            پیش‌بینی هوش مصنوعی
          </p>

          <h2 className="text-3xl font-bold mt-2">
            احتمال قبولی 82%
          </h2>

          <p className="text-sm mt-3 text-white/90">
            در صورت حفظ روند فعلی مطالعه، شانس قبولی شما بسیار مناسب ارزیابی
            می‌شود.
          </p>

        </div>

      </div>

    </div>
  );
}