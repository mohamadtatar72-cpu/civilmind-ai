# مرزهای امنیتی معماری چند ارائه‌دهنده AI

این سند مرزهای فعال AI Gateway Foundation و محدودیت‌های Adapterهای آینده را تعریف می‌کند. Sprint 1E سهمیه، Ledger، بودجه، Circuit Breaker و رابط Provider-neutral را پیاده‌سازی می‌کند؛ SDK و فراخوانی مدل هنوز فعال نیستند.

## ارائه‌دهندگان برنامه‌ریزی‌شده

- OpenAI API ارائه‌دهنده اصلی است.
- Gemini API فقط برای سهمیه محدود یا Fallback کنترل‌شده در نظر گرفته می‌شود.
- Anthropic API برای مصرف حرفه‌ای یا BYOK اختیاری آینده در نظر گرفته می‌شود.

ChatGPT Plus یک API Backend نیست و Claude Pro نیز API Backend نیست. اعتبارنامه حساب‌های مصرف‌کننده نباید دریافت، ذخیره یا میان کاربران و سرورها به اشتراک گذاشته شود.

## مرز کلید و مرورگر

کلید ارائه‌دهنده فقط در Backend و Secret Store محیط اجرا باقی می‌ماند. هیچ کلید ارائه‌دهنده به Browser، Bundle فرانت‌اند، Log عمومی یا پاسخ API ارسال نمی‌شود و هیچ کلیدی در Git Commit نمی‌شود.

`aiProviderConfigs` فقط Metadata غیرحساس مانند اولویت، Alias، بودجه و Circuit Status را نگهداری می‌کند. وجود رکورد Provider به معنی وجود Credential نیست.

BYOK در آینده می‌تواند اختیاری اضافه شود، اما کلید کاربر نیز باید رمزگذاری‌شده، Server-side و بدون قابلیت بازخوانی از Browser نگهداری شود.

## برنامه‌ها و مجوزها

نقش‌ها `free`، `premium` و `admin` هستند. سهمیه روزانه از Policy مرکزی تعیین و مصرف در `aiUsageBuckets` ثبت می‌شود.

ابزارهای Admin هرگز به کاربران عادی Expose نمی‌شوند. ابزارهای AI کاربر فقط از Allowlist صریح و حداقلی انتخاب می‌شوند؛ مدل حق فراخوانی ابزار داخلی دلخواه را ندارد.

## Request Ledger و حریم خصوصی

`aiRequestLedger` برای Idempotency، وضعیت، Token Accounting و Cost Accounting است. Raw Prompt و متن پاسخ در Foundation ذخیره نمی‌شوند. در Sprint Adapter نیز ذخیره Conversation باید یک تصمیم مستقل با Retention Policy مشخص باشد.

شناسه Idempotency به کاربر Scope می‌شود و از رزرو تکراری جلوگیری می‌کند.

## مسیریابی و Fallback

Provider فقط در Backend از Registry انتخاب می‌شود و باید شرایط زیر را داشته باشد:

- Enabled باشد.
- Adapter داخلی آن آماده باشد.
- Circuit باز نباشد.
- Cooldown پایان یافته باشد.
- بودجه Provider تمام نشده باشد.

Fallback به‌صورت پیش‌فرض خاموش است و نباید سقف بودجه، سهمیه کاربر یا سیاست داده Provider مقصد را دور بزند.

## Circuit Breaker

هر Failure با کد Sanitized ثبت می‌شود. پس از پنج Failure متوالی، Circuit برای پنج دقیقه باز می‌شود. Success شمارنده Failure را صفر و Circuit را بسته می‌کند.

Adapter آینده باید Timeout و Concurrency هر Provider را نیز اجرا کند؛ وجود Metadata به‌تنهایی جای Semaphore یا AbortController واقعی را نمی‌گیرد.

## حسابداری هزینه

هزینه با Integer Microusd ذخیره می‌شود. Adapter مسئول تبدیل Usage واقعی Provider به Microusd است. هیچ مبلغی در Client محاسبه یا قابل اعتماد نیست.

Billing کاربر، Checkout و Subscription Provider در این Sprint پیاده‌سازی نشده‌اند.

## مرز Retrieval و منابع رسمی

منابع Retrieval کاربران عادی هرگز شامل Source Code، System Prompt، Deployment Secret، Script، ابزار داخلی یا داده‌های Admin نیست. جداسازی Tenant و کنترل مالکیت داده باید پیش از بازیابی اعمال شود.

AI می‌تواند Candidate تغییر منبع رسمی، اختلاف Metadata یا خلاصه‌ای برای Reviewer پیشنهاد کند، اما قادر به تأیید، انتشار یا تغییر وضعیت منبع نیست. تأیید منبع همیشه از جریان مستقل و انسانی Admin عبور می‌کند.

## خارج از دامنه Sprint 1E

- نصب SDK ارائه‌دهندگان
- فراخوانی مدل و Streaming
- Conversation Storage
- RAG و PDF Retrieval
- Billing و Checkout
- BYOK
- Production Deployment
