import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthFormFallback } from "@/components/auth/auth-form-fallback";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--slate-50)] px-4 py-12">
      <Suspense fallback={<AuthFormFallback />}>
        <AuthForm mode="signup" />
      </Suspense>
    </div>
  );
}
