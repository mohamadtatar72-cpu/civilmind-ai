import { SignIn } from "@clerk/nextjs";
import {
  AuthConfigurationMissing,
  AuthPageShell,
} from "@/components/auth/auth-page-shell";

export default function SignInPage() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY,
  );

  return (
    <AuthPageShell
      title="ورود به حساب CivilMind"
      description="برای دسترسی به برنامه مطالعاتی، پروفایل و قابلیت‌های شخصی وارد حساب خود شوید."
    >
      {configured ? (
        <SignIn
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/profile"
        />
      ) : (
        <AuthConfigurationMissing />
      )}
    </AuthPageShell>
  );
}
