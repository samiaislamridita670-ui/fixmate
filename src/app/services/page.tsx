"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface Service {
  _id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  basePrice: number;
  estimatedDuration: string;
  serviceMode: string;
  serviceArea: string;
  technicianName: string;
  technicianEmail: string;
}

const categories = [
  "All",
  "Smartphone",
  "Laptop & PC",
  "AC",
  "Refrigerator",
  "TV",
  "Washing Machine",
  "Electrical",
];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/services");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Could not load services.");
        }

        setServices(data.services || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesCategory =
        category === "All" || service.category === category;

      const term = search.toLowerCase();
      const matchesSearch =
        service.title.toLowerCase().includes(term) ||
        service.description.toLowerCase().includes(term) ||
        service.category.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [services, category, search]);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5">
        <nav className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-2xl font-black text-blue-700">
            Fix<span className="text-slate-900">Mate.</span>
          </Link>
          <div className="flex gap-5">
            <Link href="/" className="font-semibold text-slate-600 hover:text-blue-700">Home</Link>
            <Link href="/dashboard" className="font-semibold text-slate-600 hover:text-blue-700">Dashboard</Link>
            <Link href="/login" className="font-semibold text-slate-600 hover:text-blue-700">Login</Link>
          </div>
        </nav>
      </header>

      <section className="bg-slate-950 px-6 py-16 text-center text-white">
        <p className="font-bold uppercase tracking-widest text-blue-400">
          Our Services
        </p>
        <h1 className="mt-4 text-4xl font-black md:text-5xl">
          Find the Right Repair Service
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-300">
          Explore approved repair services from professional technicians.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search repair services..."
            className="w-full rounded-xl border border-slate-300 bg-white px-5 py-4 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="mb-10 flex flex-wrap gap-3">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                category === item
                  ? "bg-blue-700 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-blue-500 hover:text-blue-700"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <p className="text-lg font-semibold text-slate-600">
              Loading repair services...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <h2 className="text-xl font-bold text-red-700">Unable to load services</h2>
            <p className="mt-2 text-red-600">{error}</p>
            <p className="mt-2 text-sm text-slate-600">
              Please make sure the backend server is running.
            </p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
            <div className="text-5xl">🔧</div>
            <h2 className="mt-5 text-2xl font-bold text-slate-900">
              No services found
            </h2>
            <p className="mt-2 text-slate-500">
              No approved services match your search. Please try another category.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm font-semibold text-slate-500">
              Showing {filteredServices.length} repair service(s)
            </p>

            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map((service) => (
                <article
                  key={service._id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="h-52 overflow-hidden bg-slate-100">
                    {service.image ? (
                      <img
                        src={service.image}
                        alt={service.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl">
                        🔧
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                      {service.category}
                    </span>

                    <h2 className="mt-4 text-xl font-extrabold text-slate-900">
                      {service.title}
                    </h2>

                    <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">
                      {service.description}
                    </p>

                    <div className="mt-5 space-y-2 text-sm text-slate-600">
                      <p>
                        <strong className="text-slate-900">Technician:</strong>{" "}
                        {service.technicianName}
                      </p>
                      <p>
                        <strong className="text-slate-900">Duration:</strong>{" "}
                        {service.estimatedDuration}
                      </p>
                      <p>
                        <strong className="text-slate-900">Service mode:</strong>{" "}
                        {service.serviceMode}
                      </p>
                      <p>
                        <strong className="text-slate-900">Service area:</strong>{" "}
                        {service.serviceArea}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                      <div>
                        <p className="text-xs text-slate-500">Starting price</p>
                        <p className="text-xl font-black text-blue-700">
                          ${service.basePrice}
                        </p>
                      </div>

                      <Link
                        href={`/booking?serviceId=${encodeURIComponent(service._id)}`}
                        className="rounded-lg bg-blue-700 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800"
                      >
                        Book Now →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
