"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { authClient } from "@/lib/auth-client";
import { clearAuthToken } from "@/lib/api";
import { dashboardPathForRole } from "@/lib/constants";
import Button from "@/components/ui/Button";

type JoinRole = "customer" | "technician";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validatePassword(password: string): string | null {
  if (password.length < 6) return "Password must be at least 6 characters long.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
  return null;
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<JoinRole>("customer");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);

  const { data: session, isPending } = authClient.useSession();
  useEffect(() => {
    if (isPending || !session?.user) return;
    const existingRole = String((session.user as { role?: string }).role || "customer");
    router.replace(redirectTo || dashboardPathForRole(existingRole));
  }, [session, isPending, router, redirectTo]);

  const passwordError = touched ? validatePassword(password) : null;

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setTouched(true);

    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    const passwordProblem = validatePassword(password);
    if (passwordProblem) {
      setError(passwordProblem);
      return;
    }

    setLoading(true);
    try {
      // role is validated again server-side; admin can never be selected here.
      const result = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        phone: phone.trim(),
        callbackURL: "/",
      });

      if (result.error) {
        setError(result.error.message || "Registration failed.");
        return;
      }

      clearAuthToken();

      const fresh = await authClient.getSession();
      const createdRole = String(
        (fresh.data?.user as { role?: string } | undefined)?.role || role
      );

      router.push(redirectTo || dashboardPathForRole(createdRole));
      router.refresh();
    } catch {
      setError("Registration failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const rules = [
    { label: "At least 6 characters", ok: password.length >= 6 },
    { label: "One uppercase letter (A–Z)", ok: /[A-Z]/.test(password) },
    { label: "One lowercase letter (a–z)", ok: /[a-z]/.test(password) },
  ];

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-950 px-5 py-14">
      <div className="w-full max-w-lg">
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

          <h1 className="mt-7 text-3xl font-black tracking-tight text-slate-950">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Join as a customer to book repairs, or as a technician to offer them.
          </p>

          <form onSubmit={handleRegister} className="mt-7 space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="reg-name" className="label">
                  Full name
                </label>
                <input
                  id="reg-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your full name"
                  required
                  autoComplete="name"
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="reg-phone" className="label">
                  Phone number
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+880 1XXXXXXXXX"
                  required
                  autoComplete="tel"
                  className="input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="label">
                Email address
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="input"
              />
            </div>

            <fieldset>
              <legend className="label">I want to join as</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    {
                      value: "customer" as JoinRole,
                      icon: "🧑‍💻",
                      title: "Customer",
                      text: "Book repairs for my home or devices",
                    },
                    {
                      value: "technician" as JoinRole,
                      icon: "🛠️",
                      title: "Technician",
                      text: "Offer my repair services to customers",
                    },
                  ]
                ).map((option) => (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-xl border-2 p-4 transition ${
                      role === option.value
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={role === option.value}
                      onChange={() => setRole(option.value)}
                      className="sr-only"
                    />
                    <span className="text-xl" aria-hidden="true">
                      {option.icon}
                    </span>
                    <p className="mt-2 text-sm font-black text-slate-900">{option.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{option.text}</p>
                  </label>
                ))}
              </div>
              <p className="hint">Admin accounts are created by the FixMate team only.</p>
            </fieldset>

            <div>
              <label htmlFor="reg-password" className="label">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setTouched(true);
                }}
                placeholder="Create a strong password"
                required
                autoComplete="new-password"
                className="input"
                aria-describedby="password-rules"
              />
              <ul id="password-rules" className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {rules.map((rule) => (
                  <li
                    key={rule.label}
                    className={`text-xs font-semibold ${
                      rule.ok ? "text-emerald-600" : "text-slate-500"
                    }`}
                  >
                    {rule.ok ? "✓" : "○"} {rule.label}
                  </li>
                ))}
              </ul>
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
              {loading ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"}
              className="font-black text-emerald-700 hover:underline"
            >
              Login
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center bg-slate-950 px-5 py-14">
          <div className="h-[32rem] w-full max-w-lg animate-pulse rounded-3xl bg-white/10" />
        </main>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
