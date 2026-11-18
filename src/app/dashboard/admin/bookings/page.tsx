"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BOOKING_STATUS_META, formatDate, formatMoney } from "@/lib/constants";
import type { Booking, BookingStatus } from "@/lib/types";
import { StatusBadge, PaymentBadge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/Feedback";

const STATUSES: Array<BookingStatus | "all"> = [
  "all",
  "requested",
  "accepted",
  "in-progress",
  "completed",
  "rejected",
  "cancelled",
];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const [search, setSearch] = useState("");

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<{ bookings?: Booking[] }>("/api/bookings/all");
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const filtered = bookings.filter((booking) => {
    const matchesStatus = status === "all" || booking.status === status;
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      booking.serviceTitle.toLowerCase().includes(term) ||
      booking.customerName.toLowerCase().includes(term) ||
      booking.technicianName.toLowerCase().includes(term) ||
      booking.customerEmail.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  const counts: Record<string, number> = { all: bookings.length };
  for (const item of STATUSES) {
    if (item !== "all") {
      counts[item] = bookings.filter((booking) => booking.status === item).length;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
          Admin dashboard
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          Manage Bookings
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          {bookings.length} booking{bookings.length === 1 ? "" : "s"} across the platform.
        </p>
      </div>

      <div className="card card-pad space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label htmlFor="booking-search" className="label">
              Search bookings
            </label>
            <input
              id="booking-search"
              type="search"
              className="input"
              placeholder="Search by service, customer or technician…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStatus(item)}
                className={`chip transition ${
                  status === item
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 capitalize text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item.replace("-", " ")} ({counts[item] ?? 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <ErrorState description={error} onRetry={loadBookings} />}

      <div className="table-shell">
        {loading ? (
          <TableSkeleton rows={6} />
        ) : filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon="📅"
              title="No bookings found"
              description="No bookings match the current status filter or search."
            />
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-th">Service</th>
                <th className="table-th">Customer</th>
                <th className="table-th">Technician</th>
                <th className="table-th">Preferred date</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Status</th>
                <th className="table-th">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((booking) => (
                <tr key={booking._id} className="hover:bg-slate-50/70">
                  <td className="table-td">
                    <p className="font-bold text-slate-900">{booking.serviceTitle}</p>
                    <p className="text-xs text-slate-400">
                      {booking._id.slice(-8).toUpperCase()} · {booking.category}
                    </p>
                  </td>
                  <td className="table-td">
                    <p className="font-semibold text-slate-800">{booking.customerName}</p>
                    <p className="text-xs text-slate-500">{booking.customerEmail}</p>
                  </td>
                  <td className="table-td">
                    <p className="font-semibold text-slate-800">{booking.technicianName}</p>
                    <p className="text-xs text-slate-500">{booking.technicianEmail}</p>
                  </td>
                  <td className="table-td">{formatDate(booking.preferredDate)}</td>
                  <td className="table-td font-black text-emerald-700">
                    {formatMoney(booking.finalAmount || booking.basePrice)}
                  </td>
                  <td className="table-td">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="table-td">
                    <PaymentBadge paid={booking.paymentStatus === "paid"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Status changes are performed by technicians through the enforced pipeline:{" "}
        {["requested → accepted/rejected", "accepted → in-progress", "in-progress → completed"].join(
          " · "
        )}
        .
      </p>
    </div>
  );
}
