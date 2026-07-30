# مدل امنیت و کنترل دسترسی CivilMind

## اصول اصلی

1. هویت فقط از `ctx.auth.getUserIdentity()` دریافت می‌شود.
2. شناسه کاربر، نقش و Actor هرگز از مرورگر قابل اعتماد نیستند.
3. حساب‌های `suspended` و `deleted` حتی با Session معتبر رد می‌شوند.
4. عملیات مدیریتی فقط با `requireAdmin` اجرا می‌شوند.
5. نقش `premium` دسترسی مدیریتی ایجاد نمی‌کند.
6. آخرین مدیر فعال نمی‌تواند نقش خود را حذف یا حساب خود را تعلیق کند.
7. تمام عملیات حساس در `auditLogs` ثبت می‌شوند.

## داده‌های ممنوع

موارد زیر نباید در جدول کاربران، پاسخ Queryها یا Metadata گزارش‌ها ذخیره یا نمایش داده شوند:

- Password
- JWT و Session Token
- Clerk Secret Key
- کلیدهای OpenAI، Gemini یا Anthropic
- System Promptهای محرمانه
- متغیرهای محیطی
- محتوای سورس و اسکریپت‌های داخلی به‌عنوان منبع پاسخ کاربر

## مرز Frontend و Backend

مخفی‌کردن لینک Admin در Sidebar فقط برای تجربه کاربری است. مهاجم می‌تواند JavaScript مرورگر را تغییر دهد یا Function را مستقیماً فراخوانی کند؛ بنابراین تمام Queryها و Mutationهای حساس در Convex دوباره نقش و وضعیت حساب را بررسی می‌کنند.

## Audit Log

Audit Log شامل Action، نوع منبع، نتیجه، Actor و Metadata محدود است. کلیدهای دارای نام‌هایی مانند `token`، `secret`، `password` و `authorization` پیش از نمایش حذف می‌شوند.

## منابع رسمی

تغییر منبع رسمی مستقیم وارد داده منتشرشده نمی‌شود. مسیر آینده چنین است:

`Fetch → Quarantine → Deterministic Scan → AI Report → Pending Admin → Approve/Reject`

هوش مصنوعی تصمیم‌گیر نهایی نیست و حق انتشار خودکار ندارد.

## حساب‌ها و APIهای مصرف‌کننده

اشتراک ChatGPT Plus، Claude Pro یا حساب مصرف‌کننده Gemini یک API قابل اشتراک برای کاربران سایت نیست. AI Gateway آینده فقط با API رسمی، کلیدهای Server-side، سهمیه و ثبت هزینه پیاده‌سازی می‌شود.
