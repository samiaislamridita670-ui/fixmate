"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/constants";
import type { Booking, Service } from "@/lib/types";
import StatCard from "@/components/ui/StatCard";
import { StatusBadge, ApprovalBadge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, StatCardSkeleton } from "@/components/ui/Feedback";

export default function TechnicianDashboardPage() {
  const { data: session } = authClient.useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [requests, setRequests] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Loader touches state only inside promise callbacks, so the effect never
  // sets state synchronously (react-hooks/set-state-in-effect).
  // Loading starts as true for the initial fetch.
  const loadData = useCallback(
    () =>
      Promise.all([
        api.get<{ services?: Service[] }>("/api/services/mine"),
        api.get<{ bookings?: Booking[] }>("/api/bookings/assigned"),
      ])
        .then(([servicesData, requestsData]) => {
          setServices(servicesData.services || []);
          setRequests(requestsData.bookings || []);
          setError("");
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Could not load your dashboard.");
        })
        .finally(() => {
          setLoading(false);
        }),
    []
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const approved = services.filter((service) => service.approvalStatus === "approved").length;
  const pending = services.filter((service) => service.approvalStatus === "pending").length;
  const pendingRequests = requests.filter((booking) => booking.status === "requested").length;
  const activeJobs = requests.filter((booking) =>
    ["accepted", "in-progress"].includes(booking.status)
  ).length;
  const completed = requests.filter((booking) => booking.status === "completed").length;
  const earnings = requests
    .filter((booking) => booking.status === "completed")
    .reduce((sum, booking) => sum + Number(booking.finalAmount || 0), 0);

  const recentRequests = requests.slice(0, 5);
  const recentServices = services.slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
            Technician dashboard
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Hi, {session?.user?.name?.split(" ")[0] || "technician"} 🔧
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Manage your services and keep repair requests moving.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/technician/add-service" className="btn btn-primary">
            + Add Service
          </Link>
          <Link href="/dashboard/technician/requests" className="btn btn-outline">
            View Requests
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Services" value={services.length} icon="🛠️" accent="blue" />
          <StatCard label="Approved Services" value={approved} icon="✅" accent="emerald" />
          <StatCard label="Pending Requests" value={pendingRequests} icon="📥" accent="amber" />
          <StatCard
            label="Completed Jobs (value)"
            value={formatMoney(earnings)}
            icon="💰"
            accent="violet"
            sub={`${completed} completed · ${activeJobs} in progress`}
          />
        </div>
      )}

      {error && (
        <ErrorState
          description={error}
          onRetry={() => {
            setError("");
            setLoading(true);
            void loadData();
          }}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Requests */}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-black text-slate-950">Latest requests</h2>
            <Link
              href="/dashboard/technician/requests"
              className="text-sm font-bold text-emerald-700 hover:underline"
            >
              Manage all →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : recentRequests.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon="📥"
                title="No repair requests yet"
                description="Requests from customers will appear here once your services are approved."
                actionLabel="My Services"
                actionHref="/dashboard/technician/my-services"
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentRequests.map((booking) => (
                <li key={booking._id} className="flex items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-900">
                      {booking.serviceTitle}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {booking.customerName} · {formatDate(booking.preferredDate)}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                  <Link
                    href={`/dashboard/technician/requests/${booking._id}`}
                    className="btn btn-outline btn-sm"
                  >
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Services */}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-black text-slate-950">Your services</h2>
            <Link
              href="/dashboard/technician/my-services"
              className="text-sm font-bold text-emerald-700 hover:underline"
            >
              Manage all →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : recentServices.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon="🧰"
                title="No services published"
                description="Add your first repair service — the admin team reviews every submission."
                actionLabel="Add Service"
                actionHref="/dashboard/technician/add-service"
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentServices.map((service) => (
                <li key={service._id} className="flex items-center gap-3 px-5 py-4">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {service.image ? (
                      <img onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/image-fallback.svg"; }} src={service.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">🔧</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-900">{service.title}</p>
                    <p className="text-xs text-slate-500">
                      {service.category} · {formatMoney(service.basePrice)}
                    </p>
                  </div>
                  <ApprovalBadge status={service.approvalStatus} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Approval hint */}
      {pending > 0 && !loading && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
          <strong className="font-black">{pending} service{pending > 1 ? "s are" : " is"} waiting for admin approval.</strong>{" "}
          Editing a service resets its approval status, so submit changes carefully.
        </div>
      )}
    </div>
  );
}

