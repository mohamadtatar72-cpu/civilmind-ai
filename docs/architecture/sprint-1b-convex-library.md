# معماری Sprint 1B: کتابخانه واکنشی با Convex

## دامنه Sprint

Sprint 1B اتصال سراسری برنامه Next.js به Convex و انتقال کاتالوگ مباحث
مقررات ملی ساختمان از آرایه‌های ایستا به داده واقعی و واکنشی را پوشش می‌دهد.
این Sprint شامل احراز هویت، داده پیشرفت کاربر، برنامه مطالعاتی شخصی، آزمون،
فلش‌کارت یا تحلیل عملکرد نیست.

## backend عملیاتی

Convex تنها backend عملیاتی CivilMind است. کاتالوگ مباحث، قراردادهای query و
به‌روزرسانی واکنشی رابط کاربری همگی از یک منبع داده استفاده می‌کنند؛ بنابراین
پایگاه داده یا API موازی، cache مستقل یا سرویس realtime دیگری در این معماری
وجود ندارد.

## اتصال Provider

`app/ConvexClientProvider.tsx` مرز Client Component را ایجاد می‌کند، متغیر عمومی
`NEXT_PUBLIC_CONVEX_URL` را بررسی می‌کند و یک نمونه پایدار
`ConvexReactClient` را در اختیار `ConvexProvider` می‌گذارد. Root Layout همچنان
Server Component است و Provider فقط فرزندان آن را می‌پوشاند. زبان `fa`، جهت
`rtl`، metadata و استایل‌های سراسری بدون تغییر ماهوی حفظ شده‌اند.

## جدول topics

جدول `topics` شامل فیلدهای زیر است:

- `code`: شماره مبحث
- `slug`: شناسه متنی پایدار
- `title` و `shortTitle`: عنوان کامل و کوتاه فارسی
- `discipline`: رشته ثابت `civil`
- `qualification`: یکی از `supervision`، `execution`، `calculation` یا `general`
- `order`: ترتیب نمایش
- `description`: توضیح کاربردی مبحث
- `questionCount` و `resourceCount`: شمار داده‌های ثبت‌شده
- `isActive`: وضعیت انتشار در کتابخانه
- `latestEdition`: ویرایش اختیاری، فقط در صورت وجود داده معتبر

### Indexها

- `by_code` روی `code`: بازیابی صفحه جزئیات با شماره route
- `by_slug` روی `slug`: بازیابی پایدار با شناسه متنی برای مصرف‌های آینده
- `by_isActive_and_order` روی `isActive` و `order`: فهرست مباحث فعال با ترتیب
  صعودی، بدون scan یا filter
- `by_discipline_and_qualification` روی `discipline` و `qualification`: مسیر
  آماده برای فهرست‌های رشته و صلاحیت

هیچ index سفارشی شامل `_creationTime` نیست.

## قرارداد queryهای عمومی

- `topics.listActive({})`: حداکثر ۵۰ مبحث فعال را از index مربوط، به ترتیب
  صعودی برمی‌گرداند.
- `topics.getByCode({ code })`: مبحث متناظر با شماره را برمی‌گرداند یا در نبود
  داده `null` می‌دهد.
- `topics.getBySlug({ slug })`: مبحث متناظر با slug را برمی‌گرداند یا `null`
  می‌دهد.

هر query دارای validator صریح آرگومان و خروجی است. mapper عمومی، metadata داخلی
Convex مانند `_id` و `_creationTime` را حذف می‌کند. این queryها کاتالوگ عمومی
هستند و عمداً به احراز هویت نیاز ندارند؛ هیچ mutation عمومی برای seed وجود
ندارد.

## معماری feature کتابخانه

- `features/library/domain.ts`: مدل مستقل رابط کاربری و union صریح صلاحیت
- `features/library/repository.ts`: قرارداد read repository برای تست و مصرف
  احتمالی سمت سرور
- `features/library/convex-repository.ts`: mapperهای خالص بین خروجی عمومی Convex
  و مدل domain
- `components/library/library-dashboard.tsx`: دریافت واکنشی فهرست و جستجوی
  سمت کاربر
- `components/library/topic-detail.tsx`: دریافت واکنشی جزئیات و مدیریت route
  نامعتبر، loading و not-found

Presentation به `Doc` یا `Id` دیتابیس وابسته نیست و hook در mapper یا repository
عادی فراخوانی نمی‌شود.

## Seed با JSONL

فایل `seed/topics.jsonl` دقیقاً ۲۴ شیء مستقل، با codeهای ۱ تا ۲۴ و ترتیب برابر
code دارد. داده اولیه برای رشته عمران، صلاحیت عمومی و وضعیت فعال تنظیم شده است.
شمار سؤال و منبع فقط بر مبنای داده موجود قبلی حفظ شده و `latestEdition` به دلیل
نبود مرجع معتبر وارد نشده است.

فرمان دقیق seed محلی:

```bash
npm run convex:seed:topics
```

این script معادل فرمان زیر است:

```bash
npx convex import --replace --table topics seed/topics.jsonl
```

استفاده از `--replace` آگاهانه است؛ پیش از اجرای آن روی هر deployment باید مقصد
بررسی و پشتیبان مناسب تهیه شود.

## مرز Dashboard و احراز هویت

repository ساختگی dashboard و داده‌های پیشرفت فعلی در Sprint 1B باقی مانده‌اند
و با کاتالوگ واقعی topics ترکیب نشده‌اند. درصد پیشرفت، آمادگی آزمون، فعالیت
مطالعاتی و پیشنهاد شخصی بدون هویت قابل اتکا نیستند. ایجاد حساب ناشناس یا رکورد
پیشرفت ناشناس نیز ممنوع است.

در Sprint 1C احراز هویت باید قبل از طراحی جدول‌های کاربرمحور اضافه شود. تمام
خواندن و نوشتن داده شخصی باید هویت را در backend استخراج کند و مالکیت رکورد را
کنترل کند.

## ملاحظات production

- `NEXT_PUBLIC_CONVEX_URL` باید در محیط build مربوط به production تعریف شود.
- schema و functionها باید ابتدا با `convex dev --once` و سپس در فرایند انتشار
  رسمی deployment مقصد اعمال شوند.
- seed باید فقط توسط اپراتور مجاز و برای deployment تأییدشده اجرا شود.
- import جایگزین‌شونده باید در pipeline کنترل‌شده، همراه با بررسی شمار رکورد و
  امکان بازیابی انجام شود.
- آدرس deployment، token و مقادیر محیطی نباید وارد source control یا log عمومی
  شوند.

## محدودیت‌های فعلی

- PDF، خلاصه هوشمند، آزمون مبحثی، فلش‌کارت و analytics هنوز فعال نیستند و در UI
  با «در حال توسعه» مشخص شده‌اند.
- داده شخصی dashboard همچنان mock است.
- کاتالوگ اولیه همه مباحث را با صلاحیت `general` عرضه می‌کند.
- ویرایش رسمی منابع تا زمان ورود داده تأییدشده نمایش داده نمی‌شود.

## گام‌های پیشنهادی

1. اجرای validation و seed روی deployment توسعه تأییدشده
2. افزودن احراز هویت و مدل مالکیت داده در Sprint 1C
3. مهاجرت تدریجی پیشرفت و برنامه مطالعاتی پس از ایجاد مرز هویت
4. طراحی storage و metadata منابع PDF با دسترسی کنترل‌شده
5. افزودن تست‌های Convex برای قراردادهای query و حالت‌های خالی
