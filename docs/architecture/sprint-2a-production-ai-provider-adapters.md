# Sprint 2A — Production AI Provider Adapters

## هدف

تبدیل Adapter پیش‌فرض Fail-closed فاز ۱ به پیاده‌سازی واقعی و Provider-neutral برای OpenAI، Gemini و Anthropic، بدون ثبت Secret، فعال‌سازی Billing یا انتشار Production.

## وضعیت

🟡 در حال انجام

- Branch: `feature/sprint-2a-production-ai-adapters`
- Base: `develop/civilmind-v2`
- Phase 1: تکمیل و Merge شده در PR #19

## Slice اول — هسته Adapterها

پیاده‌سازی‌شده:

- مسیر واقعی OpenAI Responses API
- مسیر واقعی Gemini Interactions API
- مسیر واقعی Anthropic Messages API
- دریافت API Key فقط از Secret Store محیط اجرا
- Model Alias Allowlist و دریافت نام مدل واقعی فقط از Environment
- قیمت‌گذاری صریح Token برای Cost Ledger و Budget Guard
- Abort واقعی درخواست Provider در Timeout
- نرمال‌سازی خطاهای HTTP، شبکه و Timeout
- Retry فقط برای 408، 409، 429 و خطاهای 5xx
- ممنوعیت Tool Calling تا زمان پیاده‌سازی Mapping اختصاصی هر Provider
- عدم Log یا Persist کردن Raw Prompt در Adapter
- `store: false` برای OpenAI Responses

## Environment Contract

هیچ مقدار زیر در Repository ذخیره نمی‌شود.

### OpenAI

- `OPENAI_API_KEY`
- `OPENAI_MODEL_PRIMARY`
- `OPENAI_INPUT_MICROUSD_PER_1M_TOKENS`
- `OPENAI_OUTPUT_MICROUSD_PER_1M_TOKENS`

### Gemini

- `GEMINI_API_KEY`
- `GEMINI_MODEL_FALLBACK`
- `GEMINI_INPUT_MICROUSD_PER_1M_TOKENS`
- `GEMINI_OUTPUT_MICROUSD_PER_1M_TOKENS`

### Anthropic

- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL_PREMIUM`
- `ANTHROPIC_INPUT_MICROUSD_PER_1M_TOKENS`
- `ANTHROPIC_OUTPUT_MICROUSD_PER_1M_TOKENS`

## Fail-closed Rules

Adapter اجرا نمی‌شود اگر یکی از موارد زیر برقرار باشد:

1. API Key تنظیم نشده باشد.
2. Alias مدل خارج از Allowlist باشد.
3. نام مدل واقعی در Environment تنظیم نشده باشد.
4. نرخ ورودی یا خروجی برای Cost Accounting تنظیم نشده یا نامعتبر باشد.
5. درخواست شامل Tool باشد ولی Mapping آن Provider هنوز پیاده‌سازی نشده باشد.
6. پاسخ Provider خالی یا دارای ساختار نامعتبر باشد.

## ادامه Sprint

- اضافه‌کردن Admin Readiness Probe برای همگام‌سازی امن `adapterReady`
- تست Parser پاسخ Providerها با Fixtureهای بدون Secret
- بررسی Concurrency Guard و Circuit Breaker با Adapter واقعی
- تست Failover بین Providerها
- اتصال وضعیت Readiness به Admin AI Gateway
- اجرای کامل `npm run test:phase1`
- ثبت Worklog در PR و گزارش نهایی Issue #2

## اقدام دستی مالک

فعال‌سازی واقعی Providerها فقط پس از تنظیم Secret، مدل مجاز، نرخ قیمت و Budget انجام می‌شود. هیچ Billing یا Provider در این Sprint به‌صورت خودکار فعال نمی‌شود.
