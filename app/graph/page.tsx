import AppShell from "@/components/layout/app-shell";

const nodes = [
  {
    title: "مبحث ۶\nبارهای وارد",
    status: "قوی",
    color: "bg-green-600",
  },
  {
    title: "مبحث ۷\nپی",
    status: "ضعیف",
    color: "bg-red-600",
  },
  {
    title: "مبحث ۸\nبتن",
    status: "نیاز به مرور",
    color: "bg-yellow-600",
  },
  {
    title: "مبحث ۹\nبتن",
    status: "تسلط بالا",
    color: "bg-blue-600",
  },
  {
    title: "مبحث ۱۰\nفولاد",
    status: "خوب",
    color: "bg-purple-600",
  },
];


export default function GraphPage() {
  return (
    <AppShell>

      <div className="p-8 space-y-8">

        <div>
          <h1 className="text-3xl font-bold text-white">
            Knowledge Graph
          </h1>

          <p className="mt-2 text-zinc-400">
            ارتباط بین مباحث مقررات ملی ساختمان و مسیر پیشنهادی مطالعه
          </p>
        </div>



        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">

          <h2 className="text-xl font-bold text-white mb-8">
            نقشه ارتباط مباحث عمران
          </h2>


          <div className="grid gap-8 md:grid-cols-3">


            {nodes.map((node,index)=>(

              <div
                key={node.title}
                className="relative"
              >

                <div
                  className={`rounded-3xl p-6 text-center ${node.color} text-white shadow-lg`}
                >

                  <h3 className="whitespace-pre-line text-xl font-bold">
                    {node.title}
                  </h3>


                  <p className="mt-3 text-sm">
                    {node.status}
                  </p>

                </div>


                {index < nodes.length - 1 && (

                  <div className="hidden md:block absolute top-1/2 -right-6 text-zinc-500 text-3xl">
                    →
                  </div>

                )}

              </div>

            ))}


          </div>

        </div>




        <div className="grid gap-6 md:grid-cols-2">


          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

            <h2 className="text-xl font-bold text-white">
              مسیر پیشنهادی مطالعه AI
            </h2>


            <p className="mt-4 leading-8 text-zinc-400">
              ابتدا مبحث ۶ و بارگذاری، سپس مبحث ۹ بتن و بعد از آن مبحث ۱۰ فولاد مطالعه شود.
              مباحث ۷ و ۸ به دلیل درصد پایین‌تر نیاز به مرور بیشتری دارند.
            </p>

          </div>



          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

            <h2 className="text-xl font-bold text-white">
              ارتباط مباحث
            </h2>


            <ul className="mt-4 space-y-3 text-zinc-400">

              <li>
                🔹 مبحث ۶ → پیش‌نیاز طراحی سازه
              </li>

              <li>
                🔹 مبحث ۹ → مرتبط با بتن و پی
              </li>

              <li>
                🔹 مبحث ۱۰ → مرتبط با فولاد
              </li>

              <li>
                🔹 مبحث ۷ → مرتبط با طراحی فونداسیون
              </li>

            </ul>

          </div>


        </div>


      </div>

    </AppShell>
  );
}