"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { authClient } from "@/lib/auth-client";
import { clearAuthToken } from "@/lib/api";
import { dashboardPathForRole } from "@/lib/constants";
import Button from "@/components/ui/Button";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Already signed in? Go straight to the right dashboard.
  const { data: session, isPending } = authClient.useSession();
  useEffect(() => {
    if (isPending || !session?.user) return;
    const role = String((session.user as { role?: string }).role || "customer");
    router.replace(redirectTo || dashboardPathForRole(role));
  }, [session, isPending, router, redirectTo]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authClient.signIn.email({ email, password, callbackURL: "/" });

      if (result.error) {
        setError(result.error.message || "Login failed. Please check your credentials.");
        return;
      }

      clearAuthToken();

      const fresh = await authClient.getSession();
      const role = String(
        (fresh.data?.user as { role?: string } | undefined)?.role || "customer"
      );

      router.push(redirectTo || dashboardPathForRole(role));
      router.refresh();
    } catch {
      setError("Login failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-950 px-5 py-14">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white p-8 shadow-2xl">
          <Link href="/" className="flex items-center gap-2 text-2xl font-black text-slate-950">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M21.7 6.3a5.5 5.5 0 0 1-7.6 6.6L6.6 20.4a2.1 2.1 0 0 1-3-3l7.5-7.5a5.5 5.5 0 0 1 6.6-7.6l-3.2 3.2 1.4 3 3 1.4 3.2-3.2Z" />
              </svg>
            </span>
            FixMate<span className="text-emerald-600">.</span>
          </Link>

          <h1 className="mt-7 text-3xl font-black tracking-tight text-slate-950">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage your bookings, services and jobs.
          </p>

          <form onSubmit={handleLogin} className="mt-7 space-y-5" noValidate>
            <div>
              <label htmlFor="login-email" className="label">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="label">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="input"
              />
            </div>

            {error && (
              <div
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
                role="alert"
              >
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {loading ? "Signing in…" : "Login"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href={redirectTo ? `/register?redirect=${encodeURIComponent(redirectTo)}` : "/register"}
              className="font-black text-emerald-700 hover:underline"
            >
              Create one free
            </Link>
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          <Link href="/" className="hover:text-emerald-400">
            ← Back to FixMate home
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center bg-slate-950 px-5 py-14">
          <div className="h-96 w-full max-w-md animate-pulse rounded-3xl bg-white/10" />
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
