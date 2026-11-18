"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"customer" | "technician">("customer");
  const [password, setPassword] = useState("");

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
        role,
        phone,
        callbackURL: "/dashboard"
      });

      if (result.error) {
        setError(result.error.message || "Registration failed.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Registration failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-12">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
        <Link href="/" className="text-2xl font-black text-blue-700">
          Fix<span className="text-slate-900">Mate.</span>
        </Link>

        <h1 className="mt-8 text-3xl font-black">Create your account</h1>
        <p className="mt-2 text-sm text-slate-500">
          Join FixMate and make home repairs easier.
        </p>

        <form onSubmit={handleRegister} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold">Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              type="text" placeholder="Your full name" required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">Email Address</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)}
              type="email" placeholder="you@example.com" required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">Phone Number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              type="tel" placeholder="+8801XXXXXXXXX" required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">I want to join as</label>
            <select value={role} onChange={(e) => setRole(e.target.value as "customer" | "technician")}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3">
              <option value="customer">Customer</option>
              <option value="technician">Technician</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)}
              type="password" minLength={8} placeholder="At least 8 characters" required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
          </div>

          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <button disabled={loading} type="submit"
            className="w-full rounded-xl bg-blue-700 py-4 font-bold text-white hover:bg-blue-800 disabled:opacity-60">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-blue-700">Login</Link>
        </p>
        <Link href="/" className="mt-5 block text-center text-sm text-slate-400 hover:text-blue-700">
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}

