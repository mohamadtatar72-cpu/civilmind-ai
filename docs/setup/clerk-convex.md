# راه‌اندازی Clerk و Convex

## ۱. ساخت برنامه Clerk

در Clerk Dashboard یک برنامه جدید بسازید و روش‌های ورود موردنیاز را فعال کنید. برای حساب مدیر اولیه، تأیید ایمیل باید اجباری باشد.

## ۲. متغیرهای Next.js

مقادیر واقعی را فقط در `.env.local` یا Secretهای محیط استقرار قرار دهید:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/profile
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/profile
```

هیچ مقدار واقعی نباید Commit شود.

## ۳. JWT Template برای Convex

در Clerk یک JWT Template برای Convex ایجاد کنید. Application ID باید `convex` باشد. Claimهای موردنیاز پروفایل شامل نام، تصویر، ایمیل و وضعیت تأیید ایمیل هستند.

Issuer Domain را در محیط Convex تنظیم کنید:

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://<your-clerk-domain>"
```

## ۴. مدیر اولیه

ایمیل مدیر را فقط در محیط Convex قرار دهید:

```bash
npx convex env set ADMIN_BOOTSTRAP_EMAIL "<verified-admin-email>"
```

پس از ورود با همان ایمیل تأییدشده، در صفحه Profile گزینه «فعال‌سازی مدیر اولیه» اجرا می‌شود. Backend بررسی می‌کند که مدیر قبلی وجود نداشته باشد.

## ۵. نصب و Codegen

```bash
npm install
npx convex dev
npm run lint
npx tsc --noEmit
npm run build
```

اجرای `npx convex dev` برای اعمال `auth.config.ts` و به‌روزرسانی `convex/_generated` ضروری است.

## ۶. استقرار

کلیدهای Clerk باید در محیط Hosting و Issuer/Admin Bootstrap باید در محیط Convex تنظیم شوند. Preview و Production باید تنظیمات جدا داشته باشند.

## رفتار هنگام نبود تنظیمات

Build بدون کلیدهای واقعی اجرا می‌شود، اما صفحات ورود پیام «احراز هویت هنوز پیکربندی نشده است» نشان می‌دهند. هیچ ورود یا حساب آزمایشی جعلی ساخته نمی‌شود.
