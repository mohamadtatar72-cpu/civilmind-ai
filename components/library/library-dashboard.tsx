import Link from "next/link";

const books = [
  {
    title: "مبحث ۱",
    version: "ویرایش ۱۴۰۲",
    pages: 128,
    status: "بارگذاری شده",
},
{
    title: "مبحث ۲",
    version: "ویرایش ۱۴۰۲",
    pages: 242,
    status: "بارگذاری شده",
},
{
    title: "مبحث ۷",
    version: "ویرایش ۱۴۰۳",
    pages: 318,
    status: "بارگذاری شده",
},
{
    title: "مبحث ۹",
    version: "ویرایش ۱۳۹۹",
    pages: 612,
    status: "بارگذاری شده",
},
{
    title: "آزمون‌های نظام مهندسی",
    version: "۱۳۹۳ تا ۱۴۰۴",
    pages: 520,
    status: "بارگذاری شده",
},
];

export default function LibraryDashboard() {
return (
<div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

<div className="flex justify-between items-center mb-6">

<div>

<h2 className="text-2xl font-bold">
کتابخانه CivilMind
</h2>

<p className="text-zinc-400 mt-1">
منابع مورد استفاده هوش مصنوعی
</p>

</div>

<Link href="/pdf" className="rounded-xl bg-blue-600 px-4 py-2 hover:bg-blue-500">
مشاهده کتابخانه PDF
</Link>

</div>

<div className="space-y-3">

{books.map((book)=>(

<div
key={book.title}
className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4"
>

<div>

<h3 className="font-semibold">
{book.title}
</h3>

<p className="text-sm text-zinc-500">
{book.version}
</p>

</div>

<div className="text-center">

<div className="font-bold">
{book.pages}
</div>

<div className="text-xs text-zinc-500">
صفحه
</div>

</div>

<div className="rounded-full bg-green-600/20 text-green-400 px-4 py-1 text-sm">
{book.status}
</div>

</div>

))}

</div>

</div>
);
}
