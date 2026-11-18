"use client";

import Link from "next/link";

const categories = [
  "Smartphone",
  "Laptop & PC",
  "AC",
  "Refrigerator",
  "TV",
  "Washing Machine",
];

const socialLinks = [
  { label: "X", href: "https://x.com", icon: "X" },
  { label: "Facebook", href: "https://facebook.com", icon: "f" },
  { label: "Instagram", href: "https://instagram.com", icon: "in" },
  { label: "LinkedIn", href: "https://linkedin.com", icon: "in" },
];

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function SocialIcon({ icon }: { icon: string }) {
  if (icon === "X") return <XLogo />;
  return <span className="text-xs font-black">{icon}</span>;
}

export default function Footer() {
  return (
    <footer className="mt-auto bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-5 pb-8 pt-14 sm:px-6">
        <div className="grid gap-10 border-b border-white/10 pb-12 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-2 text-2xl font-black text-white">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-slate-950"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M21.7 6.3a5.5 5.5 0 0 1-7.6 6.6L6.6 20.4a2.1 2.1 0 0 1-3-3l7.5-7.5a5.5 5.5 0 0 1 6.6-7.6l-3.2 3.2 1.4 3 3 1.4 3.2-3.2Z" />
                </svg>
              </span>
              FixMate<span className="text-emerald-400">.</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-slate-400">
              FixMate connects households with verified technicians for fast, transparent and
              affordable appliance and device repairs.
            </p>
            <div className="mt-5 flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-slate-300 transition hover:border-emerald-400 hover:text-emerald-400"
                >
                  <SocialIcon icon={social.icon} />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-sm font-black uppercase tracking-wide text-white">Quick Links</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/" className="transition hover:text-emerald-400">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/services" className="transition hover:text-emerald-400">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition hover:text-emerald-400">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/register" className="transition hover:text-emerald-400">
                  Become a Technician
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-sm font-black uppercase tracking-wide text-white">
              Popular Categories
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {categories.map((category) => (
                <li key={category}>
                  <Link
                    href={`/services?category=${encodeURIComponent(category)}`}
                    className="transition hover:text-emerald-400"
                  >
                    {category} Repair
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-sm font-black uppercase tracking-wide text-white">Contact Us</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>
                <a href="mailto:support@fixmate.com" className="transition hover:text-emerald-400">
                  support@fixmate.com
                </a>
              </li>
              <li>
                <a href="tel:+8801700000000" className="transition hover:text-emerald-400">
                  +880 17 0000 0000
                </a>
              </li>
              <li>Gulshan Avenue, Dhaka 1212, Bangladesh</li>
              <li>Open daily · 8:00 AM – 10:00 PM</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} FixMate. All rights reserved.</p>
          <p>
            Built for reliable repairs ·{" "}
            <Link href="/services" className="text-slate-400 hover:text-emerald-400">
              Browse services
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
