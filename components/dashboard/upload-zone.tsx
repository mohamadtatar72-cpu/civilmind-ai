"use client";

import { Upload } from "lucide-react";

export default function UploadZone() {
  return (
    <div className="rounded-2xl border border-dashed border-blue-500 bg-zinc-900 p-8 hover:bg-zinc-800 transition">

      <div className="flex flex-col items-center justify-center text-center">

        <Upload className="h-14 w-14 text-blue-500" />

        <h2 className="mt-4 text-2xl font-bold text-white">
          آپلود منابع آزمون
        </h2>

        <p className="mt-2 text-zinc-400">
          PDF مباحث مقررات ملی، آزمون‌های سال‌های گذشته و جزوات را اینجا رها کنید.
        </p>

        <button
          type="button"
          disabled
          title="بارگذاری فایل در حال توسعه است"
          className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500 transition"
        >
          بارگذاری فایل — در حال توسعه
        </button>

      </div>

    </div>
  );
}
