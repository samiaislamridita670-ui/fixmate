"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/constants";
import type { Booking } from "@/lib/types";
import { StatusBadge, PaymentBadge } from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import { EmptyState, ErrorState, StatCardSkeleton } from "@/components/ui/Feedback";

const ACTIVE_STATUSES = ["requested", "accepted", "in-progress"];

export default function CustomerDashboardPage() {
  const { data: session } = authClient.useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // The loader only touches state inside promise callbacks, so calling it from
  // the effect never sets state synchronously (react-hooks/set-state-in-effect).
  // Loading starts as true for the initial fetch.
  const loadBookings = useCallback(
    () =>
      api
        .get<{ bookings?: Booking[] }>("/api/bookings/mine")
        .then((data) => {
          setBookings(data.bookings || []);
          setError("");
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Could not load your bookings.");
        })
        .finally(() => {
          setLoading(false);
        }),
    []
  );

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const total = bookings.length;
  const active = bookings.filter((booking) => ACTIVE_STATUSES.includes(booking.status)).length;
  const completed = bookings.filter((booking) => booking.status === "completed").length;
  const unpaid = bookings.filter(
    (booking) => booking.status === "completed" && booking.paymentStatus === "unpaid"
  ).length;
  const recent = bookings.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
            Customer dashboard
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Welcome back, {session?.user?.name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Track your repair requests and payments in one place.
          </p>
        </div>
        <Link href="/services" className="btn btn-primary">
          + Book a Service
        </Link>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Requests" value={total} icon="📋" accent="blue" />
          <StatCard label="Active Jobs" value={active} icon="⏳" accent="amber" />
          <StatCard label="Completed Jobs" value={completed} icon="✅" accent="emerald" />
          <StatCard label="Awaiting Payment" value={unpaid} icon="💳" accent="violet" />
        </div>
      )}

      {error && (
        <ErrorState
          description={error}
          onRetry={() => {
            setError("");
            setLoading(true);
            void loadBookings();
          }}
        />
      )}

      {/* Recent bookings */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-black text-slate-950">Recent bookings</h2>
          <Link
            href="/dashboard/customer/bookings"
            className="text-sm font-bold text-emerald-700 hover:underline"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="skeleton h-20 rounded-xl" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon="🧰"
              title="No repair requests yet"
              description="Browse approved services and send your first repair request."
              actionLabel="Explore Services"
              actionHref="/services"
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((booking) => (
              <li key={booking._id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg"
                >
                  🔧
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-900">
                    {booking.serviceTitle}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDate(booking.preferredDate)} · {booking.technicianName}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={booking.status} />
                  <PaymentBadge paid={booking.paymentStatus === "paid"} />
                  <span className="hidden text-sm font-black text-slate-900 sm:block">
                    {formatMoney(booking.finalAmount || booking.basePrice)}
                  </span>
                  <Link
                    href={`/dashboard/customer/bookings/${booking._id}`}
                    className="btn btn-outline btn-sm"
                  >
                    Details
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/services" className="card card-pad transition hover:border-emerald-300 hover:shadow-md">
          <span className="text-2xl" aria-hidden="true">🔎</span>
          <h3 className="mt-3 text-sm font-black text-slate-950">Find a technician</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Search approved services across 7 categories.
          </p>
        </Link>
        <Link
          href="/dashboard/customer/payments"
          className="card card-pad transition hover:border-emerald-300 hover:shadow-md"
        >
          <span className="text-2xl" aria-hidden="true">💳</span>
          <h3 className="mt-3 text-sm font-black text-slate-950">Payment history</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Receipts and transaction IDs for every payment.
          </p>
        </Link>
        <Link
          href="/dashboard/profile"
          className="card card-pad transition hover:border-emerald-300 hover:shadow-md"
        >
          <span className="text-2xl" aria-hidden="true">👤</span>
          <h3 className="mt-3 text-sm font-black text-slate-950">Update profile</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Change your photo, phone, area and bio.
          </p>
        </Link>
      </div>
    </div>
  );
}
