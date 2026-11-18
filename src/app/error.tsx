"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary. Rendered by Next.js whenever a page throws
 * during render or data loading.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("FixMate route error:", error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-5 py-20">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white text-center shadow-sm">
        <div className="bg-red-600 px-7 py-10 text-white">
          <span className="text-5xl" aria-hidden="true">
            ⚠️
          </span>
          <h1 className="mt-4 text-2xl font-black">Something went wrong</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-red-100">
            An unexpected error occurred while loading this page. You can try again or head back
            home.
          </p>
        </div>

        <div className="p-7">
          <p className="rounded-xl bg-slate-50 p-4 font-mono text-left text-xs text-slate-500">
            {error.message || "Unknown error"}
            {error.digest ? ` (digest ${error.digest})` : ""}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={reset} className="btn btn-primary">
              Try again
            </button>
            <Link href="/" className="btn btn-outline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
