"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { dashboardPathForRole } from "@/lib/constants";
import { PageLoader } from "@/components/ui/Feedback";

/** Sends each role to its own dashboard home (customer / technician / admin). */
export default function DashboardIndexPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/login?redirect=%2Fdashboard");
      return;
    }
    const role = String((session.user as { role?: string }).role || "customer");
    router.replace(dashboardPathForRole(role));
  }, [session, isPending, router]);

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50">
      <PageLoader label="Opening your dashboard…" />
    </div>
  );
}
