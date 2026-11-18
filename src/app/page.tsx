"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE } from "@/lib/api";
import { CATEGORY_META, SERVICE_CATEGORIES, formatMoney } from "@/lib/constants";
import type { Service } from "@/lib/types";
import { ServiceCardSkeleton } from "@/components/ui/Feedback";

const steps = [
  {
    number: "01",
    title: "Find a Service",
    description: "Search approved repair services by category, price or location.",
    icon: "🔎",
  },
  {
    number: "02",
    title: "Send a Request",
    description: "Describe the problem and pick a date that works for you.",
    icon: "📝",
  },
  {
    number: "03",
    title: "Get It Fixed",
    description: "Your technician accepts the job and repairs your device.",
    icon: "🛠️",
  },
  {
    number: "04",
    title: "Pay After Service",
    description: "Pay securely online only after the repair is completed.",
    icon: "💳",
  },
];

const reasons = [
  { icon: "🛡️", title: "Verified Technicians", text: "Every technician is reviewed by our admin team before going live." },
  { icon: "🏷️", title: "Transparent Pricing", text: "See starting prices upfront — pay only the agreed final amount." },
  { icon: "📍", title: "Doorstep Service", text: "Home visit or shop drop-off, whichever is more convenient for you." },
  { icon: "🔒", title: "Secure Payments", text: "Stripe-powered checkout with receipts and payment history." },
  { icon: "⚡", title: "Fast Response", text: "Requests reach technicians instantly so jobs start sooner." },
  { icon: "🎧", title: "Real Support", text: "A human team is available every day, 8am to 10pm." },
];

const testimonials = [
  {
    name: "Nusrat Jahan",
    role: "Homeowner, Dhaka",
    quote:
      "My refrigerator stopped cooling on a Friday night. FixMate had a technician at my door the next morning — fixed in under an hour.",
    rating: 5,
  },
  {
    name: "Tanvir Ahmed",
    role: "Small business owner",
    quote:
      "I book laptop repairs for my whole team here. The status tracking means I always know what is happening with each device.",
    rating: 5,
  },
  {
    name: "Farhana Karim",
    role: "Customer, Chattogram",
    quote:
      "Loved that I only paid after the washing machine was fixed. Clear pricing and a very professional technician.",
    rating: 4,
  },
];

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/services?limit=6&sort=newest`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const list: Service[] = Array.isArray(data?.services) ? data.services : [];
        setServices(list);
      })
      .catch(() => {
        if (!cancelled) setServices([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex-1">
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl"
        />

        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-6 md:grid-cols-2 md:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-300">
              ✦ Trusted repair marketplace
            </span>
            <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              Repair made simple.
              <br />
              <span className="text-emerald-400">Life made easier.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              Book verified technicians for smartphones, laptops and home appliances. Track every
              step of the job and pay only when the repair is done.
            </p>

            <form
              action="/services"
              method="get"
              className="mt-9 flex max-w-lg flex-col gap-3 sm:flex-row"
            >
              <label htmlFor="hero-search" className="sr-only">
                Search repair services
              </label>
              <input
                id="hero-search"
                name="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Try “laptop screen repair”…"
                className="input flex-1 border-white/15 bg-white/10 text-white placeholder:text-slate-400 focus:border-emerald-400 focus:ring-emerald-400/30"
              />
              <button type="submit" className="btn btn-primary whitespace-nowrap">
                Search Services
              </button>
            </form>

            <div className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[
                { value: "12+", label: "Repair categories" },
                { value: "100%", label: "Verified technicians" },
                { value: "24/7", label: "Online booking" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xl font-black text-emerald-400 sm:text-2xl">{item.value}</p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-400 sm:text-xs">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-300">
                  ● Technicians available
                </span>
                <span className="text-3xl" aria-hidden="true">
                  🛠️
                </span>
              </div>
              <div className="my-9 text-center">
                <div
                  aria-hidden="true"
                  className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-emerald-400/15 text-6xl"
                >
                  🏠
                </div>
                <h2 className="mt-6 text-2xl font-black sm:text-3xl">We fix it. You relax.</h2>
                <p className="mt-2 text-sm text-slate-400">Reliable repairs at your doorstep.</p>
              </div>
              <div className="rounded-2xl bg-white p-5 text-slate-900">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black">Book a technician</p>
                  <span className="text-amber-500" aria-label="5 star rating">
                    ★★★★★
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Choose a service, describe the problem and confirm a date — it takes under two
                  minutes.
                </p>
                <Link href="/services" className="btn btn-dark btn-sm mt-4 w-full">
                  Browse Services →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Featured services ---------- */}
      <section id="services" className="mx-auto max-w-7xl px-5 py-16 sm:px-6 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-kicker">What we offer</p>
            <h2 className="section-title">Featured repair services</h2>
            <p className="section-sub">The latest services approved by our team this week.</p>
          </div>
          <Link href="/services" className="btn btn-outline">
            Browse all services →
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => <ServiceCardSkeleton key={index} />)
            : services.map((service) => (
                <article
                  key={service._id}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    {service.image ? (
                      <img
                        src={service.image}
                        alt={service.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl">🔧</div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-emerald-700 shadow-sm">
                      {service.category}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
                      <span className="rounded-md bg-slate-100 px-2 py-1">{service.serviceMode}</span>
                      <span className="truncate">{service.serviceArea}</span>
                    </div>
                    <h3 className="mt-3 line-clamp-2 text-lg font-black text-slate-950">
                      {service.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-500">
                      by {service.technicianName} · {service.estimatedDuration}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">
                          Starting at
                        </p>
                        <p className="text-lg font-black text-emerald-700">
                          {formatMoney(service.basePrice)}
                        </p>
                      </div>
                      <Link
                        href={`/services/${service._id}`}
                        className="btn btn-dark btn-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
        </div>

        {!loading && services.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-14 text-center">
            <p className="text-4xl" aria-hidden="true">
              🛠️
            </p>
            <h3 className="mt-4 text-lg font-black text-slate-900">Services are coming soon</h3>
            <p className="mt-2 text-sm text-slate-500">
              Our technicians are gearing up. Check back shortly.
            </p>
            <Link href="/services" className="btn btn-primary mt-5">
              Explore Services
            </Link>
          </div>
        )}
      </section>

      {/* ---------- Categories ---------- */}
      <section className="bg-slate-50 px-5 py-16 sm:px-6 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="section-kicker">Find what you need</p>
            <h2 className="section-title">Services for every home</h2>
            <p className="section-sub mx-auto">
              Pick a category and discover trusted repair professionals near you.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
            {SERVICE_CATEGORIES.map((category) => {
              const meta = CATEGORY_META[category];
              return (
                <Link
                  key={category}
                  href={`/services?category=${encodeURIComponent(category)}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 text-center transition duration-200 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-lg"
                >
                  <span className="text-3xl" aria-hidden="true">
                    {meta?.icon}
                  </span>
                  <p className="mt-3 text-sm font-black text-slate-800">{category}</p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-400">{meta?.blurb}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how" className="mx-auto max-w-7xl px-5 py-16 sm:px-6 md:py-24">
        <div className="text-center">
          <p className="section-kicker">Simple process</p>
          <h2 className="section-title">Four steps. One solution.</h2>
          <p className="section-sub mx-auto">
            From finding a technician to paying after the repair.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-emerald-600">{step.number}</span>
                <span className="text-3xl" aria-hidden="true">
                  {step.icon}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-black text-slate-950">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Why choose FixMate ---------- */}
      <section className="bg-slate-950 px-5 py-16 text-white sm:px-6 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">
                Why FixMate?
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
                Your trusted repair partner.
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
                We make home maintenance easier by connecting customers with skilled technicians
                through a simple, transparent and convenient service platform.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="btn btn-primary">
                  Join FixMate Today →
                </Link>
                <Link href="/about" className="btn btn-outline border-white/25 bg-transparent text-white hover:bg-white/10">
                  About us
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {reasons.map((reason) => (
                <div key={reason.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <span className="text-2xl" aria-hidden="true">
                    {reason.icon}
                  </span>
                  <h3 className="mt-3 text-sm font-black text-white">{reason.title}</h3>
                  <p className="mt-1.5 text-xs leading-5 text-slate-400">{reason.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Testimonials ---------- */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 md:py-24">
        <div className="text-center">
          <p className="section-kicker">Loved by customers</p>
          <h2 className="section-title">What people say about FixMate</h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <figure key={item.name} className="card card-pad flex h-full flex-col">
              <div className="text-amber-500" aria-label={`${item.rating} out of 5 stars`}>
                {"★".repeat(item.rating)}
                {"☆".repeat(5 - item.rating)}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-7 text-slate-600">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">
                  {item.name.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-black text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 rounded-2xl bg-slate-50 px-6 py-6 text-center">
          {[
            { value: "4.9/5", label: "Average rating" },
            { value: "2,500+", label: "Repairs completed" },
            { value: "30 min", label: "Average response" },
            { value: "30 days", label: "Service warranty" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xl font-black text-slate-950">{item.value}</p>
              <p className="text-xs font-semibold text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-emerald-600 px-7 py-12 text-center text-white sm:px-12 md:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10"
          />
          <h2 className="text-2xl font-black sm:text-3xl md:text-4xl">
            Something broken? We can fix it.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-emerald-50 sm:text-base">
            Create a free account, describe your problem and get matched with a verified technician
            today.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="btn btn-dark">
              Create Free Account
            </Link>
            <Link
              href="/services"
              className="btn btn-outline border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              Browse Services
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
