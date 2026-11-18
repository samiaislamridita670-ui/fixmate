"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Service = {
  _id: string;
  title: string;
  category: string;
  image: string;
  basePrice: number;
  serviceMode: string;
  technicianName: string;
};

const categories = [
  { name: "Smartphone", icon: "📱" },
  { name: "Laptop & PC", icon: "💻" },
  { name: "AC", icon: "❄️" },
  { name: "Refrigerator", icon: "🧊" },
  { name: "TV", icon: "📺" },
  { name: "Washing Machine", icon: "🧺" },
  { name: "Electrical", icon: "⚡" },
];

const steps = [
  { number: "01", title: "Find a Service", description: "Explore repair services and choose the one you need.", icon: "🔎" },
  { number: "02", title: "Send a Request", description: "Describe your problem and select a convenient date.", icon: "📝" },
  { number: "03", title: "Get It Fixed", description: "Your technician accepts the job and repairs your device.", icon: "🛠️" },
  { number: "04", title: "Pay After Service", description: "Pay securely online after your repair is completed.", icon: "💳" },
];

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/services")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.services || data.data || [];
        setServices(list.slice(0, 6));
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-24 text-white md:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
          <div>
            <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
              ✦ Trusted Home Repair Platform
            </span>
            <h1 className="mt-7 text-5xl font-extrabold leading-tight md:text-7xl">
              Repair made simple.<br />
              <span className="text-emerald-400">Life made easier.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Find trusted technicians, book professional repair services and get your appliances working again — without the hassle.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/services" className="rounded-xl bg-emerald-400 px-7 py-4 font-bold text-slate-950 transition hover:bg-emerald-300">
                Explore Services →
              </Link>
              <Link href="#how" className="rounded-xl border border-white/30 px-7 py-4 font-bold text-white transition hover:bg-white/10">
                How it works
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-10">
              <div><p className="text-2xl font-extrabold text-emerald-400">24/7</p><p className="text-sm text-slate-400">Easy booking</p></div>
              <div><p className="text-2xl font-extrabold text-emerald-400">Expert</p><p className="text-sm text-slate-400">Technicians</p></div>
              <div><p className="text-2xl font-extrabold text-emerald-400">Secure</p><p className="text-sm text-slate-400">Payments</p></div>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-lg">
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-300">● Available for your home</span>
                <span className="text-3xl">🛠️</span>
              </div>
              <div className="my-12 text-center">
                <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-emerald-400/15 text-7xl">🏠</div>
                <h2 className="mt-7 text-3xl font-bold">We fix it. You relax.</h2>
                <p className="mt-3 text-slate-300">Reliable repairs, right at your doorstep.</p>
              </div>
              <div className="rounded-2xl bg-white p-5 text-slate-900">
                <p className="font-bold">Service booking</p>
                <p className="mt-1 text-sm text-slate-500">Easy & fast — book a technician in just a few steps.</p>
                <div className="mt-4 flex items-center gap-1 text-amber-400">★★★★★ <span className="ml-2 text-sm text-slate-500">Service you can trust</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-bold text-emerald-600">What we offer</p>
              <h2 className="mt-2 text-3xl font-extrabold md:text-4xl">Featured repair services</h2>
              <p className="mt-3 text-slate-500">Explore the latest services from our technicians.</p>
            </div>
            <Link href="/services" className="font-bold text-emerald-700 hover:underline">Browse all services →</Link>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-100" />)}
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 py-16 text-center">
              <p className="text-4xl">🛠️</p>
              <h3 className="mt-4 text-xl font-bold">Services are coming soon</h3>
              <p className="mt-2 text-slate-500">Please check back soon or explore all services.</p>
              <Link href="/services" className="mt-5 inline-block rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white">Explore Services</Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <article key={service._id} className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="h-52 overflow-hidden bg-slate-100">
                    {service.image ? <img src={service.image} alt={service.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-6xl">🛠️</div>}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{service.category}</span>
                      <span className="text-xs text-slate-500">{service.serviceMode}</span>
                    </div>
                    <h3 className="mt-4 text-xl font-bold">{service.title}</h3>
                    <p className="mt-2 text-sm text-slate-500">Technician: {service.technicianName}</p>
                    <div className="mt-auto flex items-center justify-between pt-6">
                      <p className="font-extrabold text-emerald-700">From ${service.basePrice}</p>
                      <Link href={`/services/${service._id}`} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">View Details →</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="font-bold text-emerald-600">Find what you need</p>
            <h2 className="mt-2 text-3xl font-extrabold md:text-4xl">Services for every home</h2>
            <p className="mt-3 text-slate-500">Choose a category and discover trusted repair professionals.</p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
            {categories.map((category) => (
              <Link key={category.name} href={`/services?category=${encodeURIComponent(category.name)}`} className="rounded-2xl border border-slate-200 bg-white p-5 text-center transition hover:-translate-y-1 hover:border-emerald-400 hover:shadow-lg">
                <span className="text-4xl">{category.icon}</span>
                <p className="mt-3 text-sm font-bold">{category.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="font-bold text-emerald-600">Simple process</p>
            <h2 className="mt-2 text-3xl font-extrabold md:text-4xl">Four steps. One solution.</h2>
            <p className="mt-3 text-slate-500">From finding a technician to paying after the repair.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-emerald-600">{step.number}</span>
                  <span className="text-3xl">{step.icon}</span>
                </div>
                <h3 className="mt-7 text-xl font-bold">{step.title}</h3>
                <p className="mt-3 leading-7 text-slate-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2">
          <div>
            <p className="font-bold text-emerald-400">Why FixMate?</p>
            <h2 className="mt-3 text-3xl font-extrabold md:text-5xl">Your trusted repair partner.</h2>
          </div>
          <div>
            <p className="text-lg leading-8 text-slate-300">We make home maintenance easier by connecting customers with skilled technicians through a simple, transparent and convenient service platform.</p>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl bg-white/10 p-4">✓ Trusted technicians</div>
              <div className="rounded-xl bg-white/10 p-4">✓ Easy booking</div>
              <div className="rounded-xl bg-white/10 p-4">✓ Track repair status</div>
              <div className="rounded-xl bg-white/10 p-4">✓ Pay after service</div>
            </div>
            <Link href="/register" className="mt-8 inline-block rounded-xl bg-emerald-400 px-7 py-4 font-bold text-slate-950 hover:bg-emerald-300">Join FixMate Today →</Link>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 px-6 pb-8 text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-10 border-t border-white/10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="text-2xl font-extrabold text-white">🛠️ FixMate<span className="text-emerald-400">.</span></Link>
            <p className="mt-4 max-w-xs text-sm leading-7">Making home repairs simple, reliable and stress-free.</p>
          </div>
          <div>
            <h3 className="font-bold text-white">Quick Links</h3>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <Link href="/" className="hover:text-emerald-400">Home</Link>
              <Link href="/services" className="hover:text-emerald-400">Services</Link>
              <Link href="/about" className="hover:text-emerald-400">About us</Link>
              <Link href="/login" className="hover:text-emerald-400">Login</Link>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white">Popular Categories</h3>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              {categories.slice(0, 5).map((category) => <Link key={category.name} href={`/services?category=${encodeURIComponent(category.name)}`} className="hover:text-emerald-400">{category.name}</Link>)}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white">Contact Us</h3>
            <div className="mt-4 space-y-3 text-sm">
              <p>Email: support@fixmate.com</p>
              <p>Phone: +880 1XXXXXXXXX</p>
              <p>Address: Dhaka, Bangladesh</p>
              <p>Follow us: <span className="font-bold text-white">𝕏</span></p>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl border-t border-white/10 pt-6 text-center text-xs text-slate-500">© 2026 FixMate. All rights reserved.</div>
      </footer>
    </main>
  );
}
