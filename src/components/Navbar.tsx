"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { dashboardPathForRole, initials } from "@/lib/constants";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "How It Works", href: "/#how" },
  { label: "About", href: "/about" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-950">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M21.7 6.3a5.5 5.5 0 0 1-7.6 6.6L6.6 20.4a2.1 2.1 0 0 1-3-3l7.5-7.5a5.5 5.5 0 0 1 6.6-7.6l-3.2 3.2 1.4 3 3 1.4 3.2-3.2Z" />
        </svg>
      </span>
      FixMate<span className="text-emerald-600">.</span>
    </Link>
  );
}

function NavbarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const profileRef = useRef<HTMLDivElement | null>(null);

  const user = session?.user ?? null;
  const role = String((user as { role?: string } | null)?.role || "customer");
  const dashboardPath = dashboardPathForRole(role);

  // Menus remember the path they were opened on; a route change makes the
  // derived flag false — no setState effect needed on navigation.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const [profilePath, setProfilePath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const profileOpen = profilePath === pathname;

  useEffect(() => {
    if (!profileOpen) return;
    const onDocumentClick = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfilePath(null);
      }
    };
    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, [profileOpen]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return false;
    if (href === "/services") return pathname === "/services" || pathname.startsWith("/services/");
    if (href === "/about") return pathname === "/about";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  async function handleSignOut() {
    try {
      await authClient.signOut();
    } finally {
      setProfilePath(null);
      setMenuPath(null);
      router.push("/");
      router.refresh();
    }
  }

  const avatar = user?.image ? (
    <img onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/image-fallback.svg"; }} src={user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
  ) : (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
      {initials(user?.name)}
    </span>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative rounded-lg px-3 py-2 text-sm font-semibold transition ${
                isActive(link.href)
                  ? "text-emerald-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-emerald-600" />
              )}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {isPending ? (
            <div className="h-9 w-36 animate-pulse rounded-xl bg-slate-100" />
          ) : user ? (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfilePath(profileOpen ? null : pathname)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 py-1.5 pl-1.5 pr-3 transition hover:border-slate-300 hover:bg-slate-50"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
              >
                {avatar}
                <span className="max-w-28 truncate text-sm font-bold text-slate-800">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-400">▼</span>
              </button>

              {profileOpen && (
                <div className="fade-up absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl" role="menu">
                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="truncate text-sm font-black text-slate-900">{user.name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                    <span className="chip mt-2 bg-emerald-100 capitalize text-emerald-800">
                      {role}
                    </span>
                  </div>
                  <div className="p-1.5">
                    <Link
                      href={dashboardPath}
                      role="menuitem"
                      className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/profile"
                      role="menuitem"
                      className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      Update Profile
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-emerald-700"
              >
                Login
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm py-2.5">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 md:hidden"
          onClick={() => setMenuPath(menuOpen ? null : pathname)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </nav>

      {menuOpen && (
        <div className="fade-up border-t border-slate-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                  isActive(link.href)
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 border-t border-slate-100 pt-3">
              {user ? (
                <>
                  <div className="mb-2 flex items-center gap-3 px-3">
                    {avatar}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">{user.name}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <Link href={dashboardPath} className="block rounded-xl px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                    Dashboard
                  </Link>
                  <Link href="/dashboard/profile" className="block rounded-xl px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                    Update Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="block w-full rounded-xl px-3 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block rounded-xl px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                    Login
                  </Link>
                  <Link href="/register" className="mt-1 block rounded-xl bg-emerald-600 px-3 py-3 text-center text-sm font-bold text-white">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div className="h-16 border-b border-slate-200 bg-white" />}>
      <NavbarContent />
    </Suspense>
  );
}


