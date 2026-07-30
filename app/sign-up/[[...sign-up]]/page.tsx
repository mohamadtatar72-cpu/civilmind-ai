import { SignUp } from "@clerk/nextjs";
import {
  AuthConfigurationMissing,
  AuthPageShell,
} from "@/components/auth/auth-page-shell";

export default function SignUpPage() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY,
  );

  return (
    <AuthPageShell
      title="ساخت حساب CivilMind"
      description="حساب خود را ایجاد کنید تا مسیر مطالعه، نتایج آزمون و سهمیه قابلیت‌های هوش مصنوعی به‌صورت امن برای شما نگهداری شود."
    >
      {configured ? (
        <SignUp
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/profile"
        />
      ) : (
        <AuthConfigurationMissing />
      )}
    </AuthPageShell>
  );
}
