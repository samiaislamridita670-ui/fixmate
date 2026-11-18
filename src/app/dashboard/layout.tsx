"use client";

import { Suspense, type ReactNode } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";

function DashboardFallback() {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-emerald-600 border-t-transparent" />
        <p className="text-sm font-semibold text-slate-500">Preparing your dashboard…</p>
      </div>
    </div>
  );
}

/**
 * The shell reads the current pathname for active menu states, so it sits
 * behind a Suspense boundary to keep the route prerenderable.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
