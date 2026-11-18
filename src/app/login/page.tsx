"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/dashboard"
      });

      if (result.error) {
        setError(result.error.message || "Login failed.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Login failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <Link href="/" className="text-2xl font-black text-blue-700">
          Fix<span className="text-slate-900">Mate.</span>
        </Link>

        <h1 className="mt-8 text-3xl font-black">Welcome back!</h1>
        <p className="mt-2 text-sm text-slate-500">
          Login to continue to your FixMate account.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold">Email Address</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)}
              type="email" placeholder="you@example.com" required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)}
              type="password" placeholder="Enter your password" required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
          </div>

          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <button disabled={loading} type="submit"
            className="w-full rounded-xl bg-blue-700 py-4 font-bold text-white hover:bg-blue-800 disabled:opacity-60">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link href="/register" className="font-bold text-blue-700">Create Account</Link>
        </p>
        <Link href="/" className="mt-6 block text-center text-sm text-slate-400 hover:text-blue-700">
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}

