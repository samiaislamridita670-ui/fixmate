"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate, formatMoney, BOOKING_STATUS_META } from "@/lib/constants";
import type { Booking } from "@/lib/types";
import { StatusBadge, PaymentBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/Toast";

const FILTERS = ["all", "active", "completed", "cancelled"] as const;
type Filter = (typeof FILTERS)[number];

export default function CustomerBookingsPage() {
  const toast = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState("");
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Loader touches state only inside promise callbacks, so the effect never
  // sets state synchronously (react-hooks/set-state-in-effect).
  const loadBookings = useCallback(
    () =>
      api
        .get<{ bookings?: Booking[] }>("/api/bookings/mine")
        .then((data) => {
          setBookings(data.bookings || []);
          setError("");
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Could not load bookings.");
        })
        .finally(() => {
          setLoading(false);
        }),
    []
  );

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api.patch(`/api/bookings/${cancelTarget._id}/cancel`);
      toast.success("Booking cancelled.");
      setCancelTarget(null);
      await loadBookings();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel the booking.");
    } finally {
      setCancelling(false);
    }
  }

  async function handlePayNow(booking: Booking) {
    setBusyId(booking._id);
    try {
      const data = await api.post<{ checkoutUrl?: string }>(
        `/api/payments/checkout/${booking._id}`
      );
      if (data?.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
      } else {
        throw new Error("Stripe did not return a checkout URL.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout.");
      setBusyId("");
    }
  }

  const filtered = bookings.filter((booking) => {
    if (filter === "all") return true;
    if (filter === "active")
      return ["requested", "accepted", "in-progress"].includes(booking.status);
    if (filter === "completed") return booking.status === "completed";
    return booking.status === "cancelled" || booking.status === "rejected";
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
            Customer dashboard
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            My Bookings
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {bookings.length} total request{bookings.length === 1 ? "" : "s"} · cancel only while
            still requested.
          </p>
        </div>
        <div className="flex gap-2">
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
              {item}
            </button>
          ))}
        </div>
      </div>

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

      {loading ? (
        <div className="card p-2">
          <TableSkeleton rows={4} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📋"
          title={filter === "all" ? "No bookings yet" : `No ${filter} bookings`}
          description={
            filter === "all"
              ? "When you request a repair it will show up here with its live status."
              : "Try another filter to see more of your bookings."
          }
          actionLabel="Browse Services"
          actionHref="/services"
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => {
            const meta = BOOKING_STATUS_META[booking.status];
            const canCancel = booking.status === "requested";
            const canPay = booking.status === "completed" && booking.paymentStatus === "unpaid";
            const canRetry =
              busyId === booking._id;

            return (
              <article key={booking._id} className="card overflow-hidden">
                <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {booking.serviceImage ? (
                        <img
                          src={booking.serviceImage}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl">🔧</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-black text-slate-950">
                          {booking.serviceTitle}
                        </h2>
                        <StatusBadge status={booking.status} />
                        <PaymentBadge paid={booking.paymentStatus === "paid"} />
                      </div>
                      <p className="mt-1.5 text-sm text-slate-500">
                        {booking.category} · Technician:{" "}
                        <span className="font-semibold text-slate-700">
                          {booking.technicianName}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Booking ID {booking._id.slice(-8).toUpperCase()} · requested{" "}
                        {formatDate(booking.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:w-72">
                    <p>
                      <strong className="text-slate-800">Preferred:</strong>{" "}
                      {formatDate(booking.preferredDate)}
                    </p>
                    <p>
                      <strong className="text-slate-800">Phone:</strong> {booking.customerPhone}
                    </p>
                    <p className="sm:col-span-2">
                      <strong className="text-slate-800">Address:</strong> {booking.address}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <p className="text-xl font-black text-slate-950">
                      {formatMoney(booking.finalAmount || booking.basePrice)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/customer/bookings/${booking._id}`}
                        className="btn btn-outline btn-sm"
                      >
                        Details
                      </Link>
                      {canPay && (
                        <Button
                          size="sm"
                          loading={canRetry}
                          onClick={() => handlePayNow(booking)}
                        >
                          Pay Now
                        </Button>
                      )}
                      {canCancel && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setCancelTarget(booking)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3">
                  <p className="line-clamp-2 text-xs leading-5 text-slate-500">
                    <strong className="text-slate-700">Problem:</strong> {booking.problemDescription}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {meta?.label} · payment {booking.paymentStatus}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        danger
        title="Cancel this booking?"
        message={`“${cancelTarget?.serviceTitle}” will be cancelled. This cannot be undone, but you can send a new request later.`}
        confirmLabel="Yes, cancel booking"
        busy={cancelling}
        onConfirm={confirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
