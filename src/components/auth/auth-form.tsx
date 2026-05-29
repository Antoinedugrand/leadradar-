"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(signInError.message);
          return;
        }
      }

      router.push(next);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="lr-card lr-card-pad-lg">
        <h1 className="mb-2 text-2xl font-bold text-[var(--slate-900)]" style={{ fontFamily: "var(--font-display)" }}>
          {mode === "login" ? "Log in to LeadRadar" : "Create your account"}
        </h1>
        <p className="mb-6 text-sm text-[var(--slate-500)]">
          {mode === "login"
            ? "Access your prospecting workspace."
            : "Start on the Free plan — upgrade to Pro anytime."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="lr-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="lr-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <label className="lr-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="lr-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-[var(--red)]">{error}</p> : null}

          <button type="submit" className="lr-btn lr-btn-gradient w-full justify-center" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--slate-500)]">
          {mode === "login" ? (
            <>
              No account?{" "}
              <Link href="/signup" className="text-[var(--indigo)]">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="text-[var(--indigo)]">
                Log in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
