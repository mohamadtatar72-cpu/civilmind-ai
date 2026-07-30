# Sprint 1F — AI Orchestration Runtime

## هدف

تبدیل AI Gateway از Ledger و Policy صرف به Runtime قابل‌کنترل برای اجرای درخواست‌ها، بدون افزودن کلید واقعی، SDK پولی یا ذخیره متن خام سؤال در جداول برنامه.

## جریان اجرا

1. کاربر احراز‌شده درخواست را از `submitAndExecute` ارسال می‌کند.
2. Toolها فقط از Allowlist همان Capability پذیرفته می‌شوند.
3. متن سؤال فقط در حافظه Action و Prompt Envelope باقی می‌ماند.
4. Gateway سهمیه، Idempotency، Provider Policy، بودجه و Circuit را بررسی می‌کند.
5. درخواست `planned` توسط Runtime Claim و به `running` منتقل می‌شود.
6. Adapter مشترک Provider اجرا می‌شود.
7. موفقیت، Token/Cost را در Ledger و Usage ثبت می‌کند.
8. خطای Retryable حداکثر یک Fallback کنترل‌شده دارد.
9. خطای نهایی با کد Sanitized ثبت می‌شود و متن خام Provider ذخیره نمی‌شود.

## مرزهای امنیتی

- Provider از Client دریافت یا قابل انتخاب نیست.
- Model Alias فقط از تنظیمات Backend خوانده می‌شود.
- Toolهای Admin، Source Approval، Secret Management و عملیات داخلی در Allowlist کاربر وجود ندارند.
- Raw Prompt در `aiRequestLedger`، `auditLogs` یا `aiProviderEvents` ذخیره نمی‌شود.
- Fallback سهمیه روزانه را دور نمی‌زند و همان Request ID را استفاده می‌کند.
- حداکثر دو Attempt برای یک درخواست مجاز است.
- Cancellation فقط برای درخواست `planned` یا `queued` و فقط توسط مالک درخواست مجاز است.
- خطاهای Provider به کد و پیام Sanitized تبدیل می‌شوند.

## Adapter Contract

فایل `convex/lib/aiAdapterContract.ts` قرارداد یکسان OpenAI، Gemini و Anthropic را تعریف می‌کند. در این Sprint هیچ SDK یا API Key اضافه نشده و Adapter پیش‌فرض با `AI_ADAPTER_NOT_CONFIGURED` Fail-closed می‌شود.

فعال‌سازی Adapter واقعی در Sprint جداگانه باید شامل Secret Store، Streaming امن، قیمت‌گذاری نسخه مدل، آزمون Integration، محدودیت منطقه‌ای و Data Retention Policy باشد.

## Tool Policy

فایل `convex/lib/aiToolPolicy.ts` برای هر Capability مجموعه حداقلی ابزارهای مجاز را تعریف می‌کند. هر Tool ناشناخته یا خارج از Capability با `AI_TOOL_NOT_ALLOWED` رد می‌شود.

## تست‌های الزامی

- Convex validation و codegen
- Generated API consistency
- ESLint
- TypeScript
- Production Build
- بررسی عدم وجود Secret یا Raw Prompt در Diff
