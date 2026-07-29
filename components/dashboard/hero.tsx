export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-blue-950 p-10">

      <div className="max-w-3xl">

        <span className="rounded-full bg-blue-500/20 px-4 py-2 text-sm text-blue-300">
          CivilMind AI • نسخه حرفه‌ای
        </span>

        <h1 className="mt-6 text-5xl font-black leading-tight text-white">
          داشبورد هوشمند آمادگی آزمون
          <br />
          نظام مهندسی عمران
        </h1>

        <p className="mt-6 text-lg leading-8 text-zinc-300">
          یک پلتفرم مبتنی بر هوش مصنوعی برای مدیریت کامل فرآیند مطالعه،
          تحلیل مباحث، پیش‌بینی سوالات آزمون، جستجوی هوشمند داخل مباحث
          مقررات ملی ساختمان، مدیریت PDFها، بانک سوالات و برنامه‌ریزی
          شخصی تا روز آزمون.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">

          <div className="rounded-2xl bg-zinc-900/70 px-6 py-4 backdrop-blur">
            <p className="text-sm text-zinc-400">
              روز باقی‌مانده
            </p>

            <h2 className="mt-2 text-4xl font-bold text-blue-400">
              87
            </h2>
          </div>

          <div className="rounded-2xl bg-zinc-900/70 px-6 py-4 backdrop-blur">
            <p className="text-sm text-zinc-400">
              درصد آمادگی
            </p>

            <h2 className="mt-2 text-4xl font-bold text-green-400">
              71%
            </h2>
          </div>

          <div className="rounded-2xl bg-zinc-900/70 px-6 py-4 backdrop-blur">
            <p className="text-sm text-zinc-400">
              رتبه پیش‌بینی
            </p>

            <h2 className="mt-2 text-4xl font-bold text-yellow-400">
              A+
            </h2>
          </div>

        </div>

      </div>

    </section>
  );
}