import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
};

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-5 py-20">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white text-center shadow-sm">
        <div className="bg-slate-950 px-7 py-12 text-white">
          <p className="text-7xl font-black tracking-tight text-emerald-400">404</p>
          <h1 className="mt-4 text-2xl font-black">This page could not be found</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-400">
            The link may be broken, or the page may have been moved while we were fixing
            something.
          </p>
        </div>

        <div className="p-7">
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/" className="btn btn-primary">
              ← Home
            </Link>
            <Link href="/services" className="btn btn-outline">
              Browse Services
            </Link>
            <Link href="/login" className="btn btn-outline">
              Login
            </Link>
            <Link href="/dashboard" className="btn btn-dark">
              My Dashboard
            </Link>
          </div>
          <p className="mt-6 text-xs text-slate-400">
            Still stuck? Email{" "}
            <a href="mailto:support@fixmate.com" className="font-bold text-emerald-700">
              support@fixmate.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
