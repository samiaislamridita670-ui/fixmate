"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE } from "@/lib/api";
import { SERVICE_CATEGORIES, SERVICE_MODES } from "@/lib/constants";
import type { Service } from "@/lib/types";
import ServiceCard from "@/components/ServiceCard";
import { EmptyState, ErrorState, ServiceCardSkeleton } from "@/components/ui/Feedback";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

/**
 * Challenge 1 — search, category, mode filtering and sorting are resolved by
 * the Express API. Every control writes back into the URL query string, so
 * filters survive refresh, sharing and browser history.
 */
function ServicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchDraft, setSearchDraft] = useState(searchParams.get("search") || "");

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "All";
  const serviceMode = searchParams.get("serviceMode") || "All";
  const sort = searchParams.get("sort") || "newest";

  const buildQuery = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(overrides)) {
        if (!value || value === "All" || (key === "sort" && value === "newest")) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const queryString = params.toString();
      return queryString ? `?${queryString}` : "";
    },
    [searchParams]
  );

  const updateParams = useCallback(
    (overrides: Record<string, string>, replace = false) => {
      const query = buildQuery(overrides);
      router.replace(`/services${query}`, { scroll: false });
      if (replace) router.refresh();
    },
    [buildQuery, router]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category && category !== "All") params.set("category", category);
    if (serviceMode && serviceMode !== "All") params.set("serviceMode", serviceMode);
    if (sort) params.set("sort", sort);

    const queryString = params.toString();

    fetch(`${API_BASE}/api/services${queryString ? `?${queryString}` : ""}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok || data?.success === false) {
          throw new Error(data?.message || "Could not load services.");
        }
        if (cancelled) return;
        setServices(Array.isArray(data?.services) ? data.services : []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setServices([]);
        setError(err instanceof Error ? err.message : "Could not load services.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, category, serviceMode, sort]);

  return (
    <main className="flex-1">
      <section className="bg-slate-950 px-5 py-14 text-white sm:px-6 md:py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">
            Our services
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
            Find the right repair service
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Browse approved services from professional technicians. Search by title or category,
            filter by service mode and sort by price.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6">
        {/* ---------- Filters ---------- */}
        <div className="card card-pad space-y-5">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
            <div>
              <label htmlFor="service-search" className="label">
                Search
              </label>
              <input
                id="service-search"
                type="search"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") updateParams({ search: searchDraft });
                }}
                placeholder="Search by title or category…"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="service-category" className="label">
                Category
              </label>
              <select
                id="service-category"
                value={category}
                onChange={(event) => updateParams({ category: event.target.value })}
                className="input md:w-48"
              >
                <option value="All">All categories</option>
                {SERVICE_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="service-mode" className="label">
                Service mode
              </label>
              <select
                id="service-mode"
                value={serviceMode}
                onChange={(event) => updateParams({ serviceMode: event.target.value })}
                className="input md:w-44"
              >
                <option value="All">All modes</option>
                {SERVICE_MODES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="service-sort" className="label">
                Sort by
              </label>
              <select
                id="service-sort"
                value={sort}
                onChange={(event) => updateParams({ sort: event.target.value })}
                className="input md:w-52"
              >
                {SORT_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSearchDraft("")}
                className="btn btn-outline btn-sm"
              >
                Clear search
              </button>
              {(search || category !== "All" || serviceMode !== "All" || sort !== "newest") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchDraft("");
                    router.replace("/services", { scroll: false });
                  }}
                  className="btn btn-outline btn-sm"
                >
                  Reset all filters
                </button>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-500" aria-live="polite">
              {loading
                ? "Loading services…"
                : `${services.length} service${services.length === 1 ? "" : "s"} found`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => updateParams({ category: "All" })}
              className={`chip transition ${
                category === "All"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All
            </button>
            {SERVICE_CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => updateParams({ category: item })}
                className={`chip transition ${
                  category === item
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* ---------- Results ---------- */}
        <div className="mt-8">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <ServiceCardSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <ErrorState
              title="Unable to load services"
              description={`${error} Make sure the FixMate API server is running.`}
              onRetry={() => router.refresh()}
            />
          ) : services.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No services match your filters"
              description="Try a different search term, category or service mode."
              actionLabel="Reset filters"
              actionHref="/services"
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <ServiceCard key={service._id} service={service} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 bg-slate-50 px-5 py-16 sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <ServiceCardSkeleton key={index} />
            ))}
          </div>
        </main>
      }
    >
      <ServicesContent />
    </Suspense>
  );
}
