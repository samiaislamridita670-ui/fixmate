"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function NavbarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const user = session?.user;
  const role: string = (user as (typeof user & { role?: string }) | null)?.role || "customer";

  const dashboardPath =
    role === "admin" ? "/admin" :
    role === "technician" ? "/technician/services" : "/dashboard";

  const links = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: "How It Works", href: "/#how" },
    { label: "About", href: "/#about" },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" :
    href.startsWith("/#") ? false :
    pathname === href || pathname.startsWith(href + "/");

  async function handleSignOut() {
    await authClient.signOut();
    setProfileOpen(false);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/" className="text-2xl font-extrabold tracking-tight text-slate-900">
          🛠️ FixMate<span className="text-emerald-600">.</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-semibold transition hover:text-emerald-600 ${
                isActive(link.href) ? "text-emerald-700" : "text-slate-600"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isPending ? (
            <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-100" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50"
              >
                {user.image ? (
                  <img src={user.image} alt="Profile" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
                <span className="max-w-28 truncate text-sm font-bold text-slate-800">{user.name}</span>
                <span className="text-xs text-slate-500">▼</span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-3 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  <div className="border-b border-slate-100 px-3 py-3">
                    <p className="truncate font-bold text-slate-900">{user.name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                    <p className="mt-1 text-xs font-semibold capitalize text-emerald-700">{role}</p>
                  </div>
                  <Link href={dashboardPath} onClick={() => setProfileOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700">
                    Dashboard
                  </Link>
                  <button onClick={handleSignOut} className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-bold text-slate-700 hover:text-emerald-700">
                Login
              </Link>
              <Link href="/register" className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg border border-slate-200 px-3 py-2 text-xl text-slate-800 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-slate-100 bg-white px-5 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-lg px-3 py-3 text-sm font-semibold ${
                  isActive(link.href) ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <div className="mt-2 border-t border-slate-100 px-3 pt-3">
                  <p className="font-bold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <Link href={dashboardPath} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Dashboard
                </Link>
                <button onClick={handleSignOut} className="rounded-lg px-3 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50">
                  Sign Out
                </button>
              </>
            ) : !isPending ? (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700">Login</Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} className="rounded-lg bg-emerald-600 px-3 py-3 text-center text-sm font-bold text-white">Get Started</Link>
              </>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}


export default function Navbar() {
  return <Suspense fallback={<div className='h-16 bg-white' />}>
    <NavbarContent />
  </Suspense>;
}

