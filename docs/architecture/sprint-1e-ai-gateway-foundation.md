# Sprint 1E — AI Gateway Foundation

## هدف

این Sprint لایه کنترل و حسابداری لازم برای اتصال آینده OpenAI، Gemini و Anthropic را فراهم می‌کند، بدون اینکه SDK، کلید واقعی، Billing یا فراخوانی مدل فعال شود.

## اجزای اصلی

### Provider Registry

جدول `aiProviderConfigs` فقط Metadata عملیاتی غیرحساس را نگهداری می‌کند:

- نام Provider
- Alias مدل
- اولویت مسیریابی
- سقف هم‌زمانی و Timeout
- بودجه و مصرف Microusd
- وضعیت Adapter
- Circuit Breaker و زمان Cooldown

کلید API یا Credential در این جدول ذخیره نمی‌شود.

### Request Ledger

جدول `aiRequestLedger` چرخه عمر درخواست را ثبت می‌کند:

- کاربر و Capability
- شناسه Idempotency
- Provider انتخاب‌شده
- وضعیت Planned، Running، Completed، Failed یا Blocked
- تعداد نویسه، Token و هزینه
- کد خطای Sanitized

Raw Prompt و پاسخ مدل عمداً در Ledger ذخیره نمی‌شوند.

### Daily Usage Bucket

جدول `aiUsageBuckets` مصرف روزانه هر کاربر را با Index ترکیبی `userId + dayKey` نگهداری می‌کند. سهمیه براساس نقش `free`، `premium` یا `admin` تعیین می‌شود.

### Provider Events

رویدادهای موفقیت، شکست و تغییر Circuit در `aiProviderEvents` ثبت می‌شوند. متن خطا حداکثر ۳۰۰ نویسه و بدون Secret ذخیره می‌شود.

## مسیر درخواست

1. کاربر احراز هویت‌شده یک Intent بدون Raw Prompt می‌سازد.
2. Backend طول ورودی، Idempotency و سهمیه روزانه را بررسی می‌کند.
3. Provider فقط از Registry داخلی انتخاب می‌شود.
4. Provider باید Enabled، AdapterReady، داخل بودجه و با Circuit مجاز باشد.
5. در نبود Adapter، درخواست با وضعیت `blocked` ثبت می‌شود و برای جلوگیری از Spam یک واحد از سهمیه روزانه مصرف می‌کند؛ Token و هزینه صفر می‌ماند.
6. Adapter آینده فقط از توابع Internal برای Claim، Complete و Fail استفاده می‌کند.
7. Success مصرف Token و هزینه را ثبت و Circuit را Reset می‌کند.
8. پنج Failure متوالی Circuit را برای پنج دقیقه باز می‌کند.

## Idempotency

هر درخواست دارای کلید ۱۲ تا ۸۰ نویسه‌ای است. Index ترکیبی `userId + idempotencyKey` از رزرو تکراری و مصرف دوباره سهمیه جلوگیری می‌کند.

## Policy پیش‌فرض

- Free: پنج درخواست روزانه
- Premium: صد درخواست روزانه
- Admin: پانصد درخواست روزانه
- حداکثر ورودی: ۱۲ هزار نویسه
- حداکثر خروجی: ۲۰۴۸ Token
- بودجه سراسری: ۵۰ میلیون Microusd
- Fallback: خاموش

مدیر می‌تواند Policy را تغییر دهد، اما فعال‌کردن Provider پیش از آماده‌شدن Adapter در Backend رد می‌شود.

## مرزهای امنیتی

- Provider Key فقط در Secret Store محیط Backend قرار می‌گیرد.
- هیچ Consumer Subscription مانند ChatGPT Plus یا Claude Pro به‌عنوان Backend پذیرفته نمی‌شود.
- Browser هیچ Provider Key، Token یا Credential دریافت نمی‌کند.
- Raw Prompt در این Sprint به Convex ارسال یا ذخیره نمی‌شود.
- توابع اجرای Adapter همگی Internal هستند.
- ابزارهای Admin در Backend با `requireAdmin` محافظت می‌شوند.
- Provider و مدل از ورودی آزاد کاربر انتخاب نمی‌شوند.
- هزینه با Integer Microusd ذخیره می‌شود تا از خطای Floating Point جلوگیری شود.

## خارج از محدوده

- نصب SDK ارائه‌دهندگان
- فراخوانی مدل و Streaming
- ذخیره Conversation
- RAG و PDF Retrieval
- Billing و Checkout
- BYOK
- Production Deployment
