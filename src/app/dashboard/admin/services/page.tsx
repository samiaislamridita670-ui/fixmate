"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/constants";
import type { ApprovalStatus, Service } from "@/lib/types";
import { ApprovalBadge, Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/Toast";

const FILTERS: Array<"all" | ApprovalStatus> = ["all", "pending", "approved", "rejected"];

export default function AdminServicesPage() {
  const toast = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | ApprovalStatus>("all");
  const [search, setSearch] = useState("");

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<{ services?: Service[] }>("/api/services/admin/all");
      setServices(data.services || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load services.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  async function setApproval(service: Service, approvalStatus: ApprovalStatus) {
    try {
      await api.patch(`/api/services/${service._id}/approval`, { approvalStatus });
      setServices((current) =>
        current.map((item) =>
          item._id === service._id ? { ...item, approvalStatus } : item
        )
      );
      toast.success(`“${service.title}” ${approvalStatus}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update approval.");
    }
  }

  const filtered = services.filter((service) => {
    const matchesFilter = filter === "all" || service.approvalStatus === filter;
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      service.title.toLowerCase().includes(term) ||
      service.category.toLowerCase().includes(term) ||
      service.technicianName.toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: services.length,
    pending: services.filter((s) => s.approvalStatus === "pending").length,
    approved: services.filter((s) => s.approvalStatus === "approved").length,
    rejected: services.filter((s) => s.approvalStatus === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
          Admin dashboard
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          Manage Services
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Every service submitted by technicians, with its approval history.
        </p>
      </div>

      <div className="card card-pad space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label htmlFor="service-search" className="label">
              Search services
            </label>
            <input
              id="service-search"
              type="search"
              className="input"
              placeholder="Search by title, category or technician…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`chip transition ${
                  filter === item
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 capitalize text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item} ({counts[item]})
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <ErrorState description={error} onRetry={loadServices} />}

      {loading ? (
        <div className="card p-2">
          <TableSkeleton rows={6} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🧰"
          title="No services found"
          description="No services match the current filter or search."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((service) => (
            <article key={service._id} className="card overflow-hidden">
              <div className="relative h-36 bg-slate-100">
                {service.image ? (
                  <img src={service.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">🔧</div>
                )}
                <span className="absolute right-3 top-3">
                  <ApprovalBadge status={service.approvalStatus} />
                </span>
                {!service.isAvailable && (
                  <span className="absolute left-3 top-3">
                    <Badge className="bg-slate-900/90 text-white">Unavailable</Badge>
                  </span>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-black leading-6 text-slate-950">
                    {service.title}
                  </h2>
                  <p className="shrink-0 text-lg font-black text-emerald-700">
                    {formatMoney(service.basePrice)}
                  </p>
                </div>
                <p className="mt-1.5 text-xs font-semibold text-slate-500">
                  {service.category} · {service.serviceMode} · {service.serviceArea}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  👨‍🔧 {service.technicianName} · {service.technicianEmail}
                </p>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                  {service.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  {service.approvalStatus !== "approved" && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setApproval(service, "approved")}
                    >
                      Approve
                    </button>
                  )}
                  {service.approvalStatus !== "rejected" && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => setApproval(service, "rejected")}
                    >
                      Reject
                    </button>
                  )}
                  {service.approvalStatus === "approved" && (
                    <span className="chip bg-emerald-50 text-emerald-700">
                      Live in marketplace
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
