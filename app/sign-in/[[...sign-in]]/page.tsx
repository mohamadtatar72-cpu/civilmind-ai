import { SignIn } from "@clerk/nextjs";
import {
  AuthConfigurationMissing,
  AuthPageShell,
} from "@/components/auth/auth-page-shell";

export default function SignInPage() {
  // Clerk's hosted SignIn UI runs in the browser. Rendering it only needs the
  // public key; requiring a server-only secret here falsely disabled sign-in
  // in deployments where that secret is intentionally not exposed to Next.
  const configured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

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
