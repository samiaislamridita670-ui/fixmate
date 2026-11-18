import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about FixMate — the marketplace connecting households with verified technicians for transparent, reliable device and appliance repairs.",
};

const values = [
  {
    icon: "🛡️",
    title: "Trust first",
    text: "Every technician is reviewed by our admin team before a single service goes live, and customers can rate every completed job.",
  },
  {
    icon: "🏷️",
    title: "Transparent pricing",
    text: "Services publish their starting price. The final amount is submitted by the technician only after the repair is done — never before.",
  },
  {
    icon: "⚡",
    title: "Speed & convenience",
    text: "Book in under two minutes, choose home visit or drop-off, and follow each status change in real time from your dashboard.",
  },
  {
    icon: "🔒",
    title: "Secure by design",
    text: "Sessions, roles and payments are verified server-side. Card data never touches our servers — Stripe handles every transaction.",
  },
];

const milestones = [
  { year: "2024", title: "FixMate founded", text: "A small team in Dhaka set out to fix a broken repair industry." },
  { year: "2025", title: "Marketplace launch", text: "Customers and technicians started booking jobs on the platform." },
  { year: "2026", title: "12+ categories", text: "Smartphones, laptops, ACs, fridges, TVs, washing machines and more." },
];

const stats = [
  { value: "2,500+", label: "Repairs completed" },
  { value: "180+", label: "Verified technicians" },
  { value: "4.9/5", label: "Average rating" },
  { value: "30 days", label: "Service warranty" },
];

export default function AboutPage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="bg-slate-950 px-5 py-16 text-white sm:px-6 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">About FixMate</p>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
            We make home repairs feel effortless.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-slate-300 sm:text-base">
            FixMate is a smart device and home appliance repair marketplace. We connect households
            with skilled, verified technicians — and give both sides the tools to run the job
            transparently from request to payment.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/services" className="btn btn-primary">
              Explore Services
            </Link>
            <Link
              href="/register"
              className="btn btn-outline border-white/30 bg-transparent text-white hover:bg-white/10"
            >
              Become a Technician
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-slate-100 bg-white px-5 py-10 sm:px-6">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-black text-emerald-700">{stat.value}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 md:py-20">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="section-kicker">Our story</p>
            <h2 className="section-title">Repair was broken. We rebuilt it.</h2>
            <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base">
              Finding a trustworthy technician used to mean guessing: unclear prices, missed
              appointments and no way to check who was at your door. FixMate started with a simple
              idea — make every step of a repair visible, from the first request to the final
              payment.
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              Today the platform runs on four promises: verified technicians, published starting
              prices, a strict job-status pipeline and payments that only happen after the work is
              done.
            </p>
            <Link href="/services" className="btn btn-dark mt-7">
              See what we fix →
            </Link>
          </div>

          <ol className="relative space-y-6 border-l-2 border-emerald-100 pl-6">
            {milestones.map((item) => (
              <li key={item.year} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-4 border-white bg-emerald-500"
                />
                <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
                  {item.year}
                </p>
                <h3 className="mt-1 text-base font-black text-slate-950">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Values */}
      <section className="bg-slate-50 px-5 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="section-kicker">What we stand for</p>
            <h2 className="section-title">Built on trust, not guesswork</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div key={value.title} className="card card-pad h-full">
                <span className="text-3xl" aria-hidden="true">
                  {value.icon}
                </span>
                <h3 className="mt-4 text-base font-black text-slate-950">{value.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{value.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 md:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="card card-pad">
            <span className="chip bg-sky-100 text-sky-800">For customers</span>
            <h3 className="mt-4 text-lg font-black text-slate-950">Book with confidence</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>• Browse approved services with real prices</li>
              <li>• Track every status change in your dashboard</li>
              <li>• Pay securely after the repair is completed</li>
            </ul>
            <Link href="/register" className="btn btn-primary btn-sm mt-5">
              Create customer account
            </Link>
          </div>

          <div className="card card-pad">
            <span className="chip bg-emerald-100 text-emerald-800">For technicians</span>
            <h3 className="mt-4 text-lg font-black text-slate-950">Grow your business</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>• Publish services and reach new customers</li>
              <li>• Manage requests, jobs and earnings in one place</li>
              <li>• Get paid reliably for completed work</li>
            </ul>
            <Link href="/register" className="btn btn-dark btn-sm mt-5">
              Join as technician
            </Link>
          </div>

          <div className="card card-pad">
            <span className="chip bg-violet-100 text-violet-800">For admins</span>
            <h3 className="mt-4 text-lg font-black text-slate-950">Full platform control</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>• Approve or reject every submitted service</li>
              <li>• Manage users, roles, bookings and revenue</li>
              <li>• Monitor platform health from one dashboard</li>
            </ul>
            <p className="mt-5 text-xs font-semibold text-slate-400">
              Admin accounts are issued by the FixMate team.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-6">
        <div className="rounded-3xl bg-emerald-600 px-7 py-12 text-center text-white">
          <h2 className="text-2xl font-black sm:text-3xl">Ready to get something fixed?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-emerald-50">
            Join thousands of households who book repairs the smart way.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/services" className="btn btn-dark">
              Browse Services
            </Link>
            <Link
              href="/register"
              className="btn btn-outline border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
