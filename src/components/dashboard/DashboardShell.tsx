"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { initials } from "@/lib/constants";
import type { Role } from "@/lib/types";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const CUSTOMER_NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard/customer", icon: "📊" },
  { label: "My Bookings", href: "/dashboard/customer/bookings", icon: "📋" },
  { label: "Payment History", href: "/dashboard/customer/payments", icon: "💳" },
  { label: "Profile", href: "/dashboard/profile", icon: "👤" },
];

const TECHNICIAN_NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard/technician", icon: "📊" },
  { label: "Add Service", href: "/dashboard/technician/add-service", icon: "➕" },
  { label: "My Services", href: "/dashboard/technician/my-services", icon: "🛠️" },
  { label: "Booking Requests", href: "/dashboard/technician/requests", icon: "📥" },
  { label: "Profile", href: "/dashboard/profile", icon: "👤" },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard/admin", icon: "📊" },
  { label: "Manage Users", href: "/dashboard/admin/users", icon: "👥" },
  { label: "Manage Services", href: "/dashboard/admin/services", icon: "🧰" },
  { label: "Service Approvals", href: "/dashboard/admin/approvals", icon: "✅" },
  { label: "Manage Bookings", href: "/dashboard/admin/bookings", icon: "📅" },
  { label: "Transactions", href: "/dashboard/admin/transactions", icon: "💰" },
  { label: "Profile", href: "/dashboard/profile", icon: "👤" },
];

function navForRole(role: Role): NavItem[] {
  if (role === "admin") return ADMIN_NAV;
  if (role === "technician") return TECHNICIAN_NAV;
  return CUSTOMER_NAV;
}

const ROLE_LABEL: Record<Role, string> = {
  customer: "Customer dashboard",
  technician: "Technician dashboard",
  admin: "Admin dashboard",
};

export default function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  const user = session?.user ?? null;
  const role = (String((user as { role?: string } | null)?.role || "customer") as Role);
  const navItems = navForRole(role);

  // Drawers remember the path they were opened on; a route change makes the
  // derived flag false — no setState effect needed on navigation.
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const drawerOpen = drawerPath === pathname;
  const menuOpen = menuPath === pathname;

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || "/dashboard")}`);
    }
  }, [session, isPending, router, pathname]);

  async function handleSignOut() {
    try {
      await authClient.signOut();
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  if (isPending || !session?.user) {
    return (
      <div className="flex min-h-[60vh] flex-1 items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-emerald-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-500">Preparing your dashboard…</p>
        </div>
      </div>
    );
  }

  const sidebar = (
    <nav className="flex h-full flex-col" aria-label="Dashboard navigation">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
          {ROLE_LABEL[role]}
        </p>
        <p className="mt-2 truncate text-sm font-black text-white">{session.user.name}</p>
        <p className="truncate text-xs text-slate-400">{session.user.email}</p>
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active =
            item.href === pathname ||
            (pathname?.startsWith(`${item.href}/`) && item.href !== "/dashboard/customer" &&
              item.href !== "/dashboard/technician" &&
              item.href !== "/dashboard/admin") ||
            (item.href === pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition ${
                  active
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span aria-hidden="true" className="text-base">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          className="block rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          ← Public site
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-1 block w-full rounded-xl px-3.5 py-2.5 text-left text-sm font-bold text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
        >
          Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex-1 bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1500px]">
        {/* Desktop sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 bg-slate-950 lg:block">
          {sidebar}
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <div
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setDrawerPath(null)}
              aria-hidden="true"
            />
            <div className="fade-up absolute inset-y-0 left-0 w-72 bg-slate-950 shadow-2xl">
              <button
                type="button"
                onClick={() => setDrawerPath(null)}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10"
                aria-label="Close menu"
              >
                ✕
              </button>
              {sidebar}
            </div>
          </div>
        )}

        {/* Main column */}
        <div className="min-w-0 flex-1">
          {/* Mobile top bar */}
          <div className="sticky top-16 z-40 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
            <button
              type="button"
              onClick={() => setDrawerPath(pathname)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700"
              aria-label="Open dashboard menu"
            >
              ☰ Menu
            </button>
            <span className="truncate text-sm font-black text-slate-900">
              {ROLE_LABEL[role]}
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuPath(menuOpen ? null : pathname)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700"
                aria-label="Account menu"
                aria-expanded={menuOpen}
              >
                {initials(session.user.name)}
              </button>
              {menuOpen && (
                <div className="fade-up absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  <Link
                    href="/dashboard/profile"
                    className="block rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Update Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

          <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

