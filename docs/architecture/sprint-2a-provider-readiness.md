# Sprint 2A — Provider Readiness Reconciliation

## هدف

این بخش وضعیت واقعی Secretها و Model Aliasهای محیط اجرا را با رجیستری `aiProviderConfigs` همگام می‌کند تا هیچ Provider بدون پیکربندی کامل وارد مسیر درخواست نشود.

## جریان اجرا

1. مدیر، Action با نام `adminRefreshProviderReadiness` را اجرا می‌کند.
2. Action فهرست Providerها را از Query فقط-مدیر `aiGateway.adminListProviders` دریافت می‌کند.
3. برای هر Provider، تابع `getProviderAdapterReadiness` وجود Key، Model Alias و نرخ‌های قیمت‌گذاری را بررسی می‌کند.
4. فقط نام متغیرهای مفقود برگردانده می‌شود؛ مقدار Secretها هرگز خوانا، ثبت یا ذخیره نمی‌شود.
5. نتیجه با `aiGateway.internalSetAdapterReady` در رجیستری ثبت می‌شود.
6. Provider ناقص به‌صورت Fail-closed غیرفعال و Circuit آن `disabled` می‌شود.

## ویژگی‌های امنیتی

- احراز هویت و نقش Admin اجباری است.
- هیچ API Key در پاسخ، Log، Audit Metadata یا Database ذخیره نمی‌شود.
- عملیات Idempotent است و بعد از هر Deployment قابل اجراست.
- مدل فقط از Aliasهای Allowlist‌شده پذیرفته می‌شود.
- نبود قیمت‌گذاری نیز Provider را Not Ready نگه می‌دارد تا Cost Ledger ناقص نشود.

## معیار پذیرش

- TypeScript و Convex TypeScript بدون خطا اجرا شوند.
- تست‌های Phase 1 و تست Provider Readiness سبز باشند.
- Provider ناقص نتواند `adapterReady=true` باقی بماند.
- Provider کامل پس از اجرای Action به `adapterReady=true` و Circuit بسته منتقل شود.

## محدودیت فعلی

این Action اتصال آزمایشی پولی به APIهای بیرونی انجام نمی‌دهد؛ فقط Configuration Contract را بررسی می‌کند. Health Probe شبکه‌ای کم‌هزینه و Parser Fixture Tests در Slice بعدی اضافه می‌شوند.
