"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { BOOKING_STATUS_META, formatDateTime, formatMoney } from "@/lib/constants";
import type { Booking, BookingStatus } from "@/lib/types";
import { PaymentBadge, StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/Feedback";
import { useToast } from "@/components/Toast";

const TIMELINE: BookingStatus[] = ["requested", "accepted", "in-progress", "completed"];

export default function CustomerBookingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Loader touches state only inside promise callbacks, so the effect never
  // sets state synchronously (react-hooks/set-state-in-effect).
  // Loading starts as true for the initial fetch.
  const loadBooking = useCallback(
    () =>
      api
        .get<{ booking?: Booking }>(`/api/bookings/${id}`)
        .then((data) => {
          if (!data?.booking) throw new Error("Booking not found.");
          setBooking(data.booking);
          setError("");
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Could not load the booking.");
        })
        .finally(() => {
          setLoading(false);
        }),
    [id]
  );

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  async function handleCancel() {
    if (!booking) return;
    setBusy(true);
    try {
      await api.patch(`/api/bookings/${booking._id}/cancel`);
      toast.success("Booking cancelled.");
      setConfirmOpen(false);
      await loadBooking();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel the booking.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePay() {
    if (!booking) return;
    setBusy(true);
    try {
      const data = await api.post<{ checkoutUrl?: string }>(
        `/api/payments/checkout/${booking._id}`
      );
      if (!data?.checkoutUrl) throw new Error("Stripe did not return a checkout URL.");
      window.location.assign(data.checkoutUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout.");
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-64 rounded-lg" />
        <div className="skeleton h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <ErrorState
        title="Booking not found"
        description={error || "This booking does not exist or is not yours."}
        onRetry={() => {
          setError("");
          setLoading(true);
          void loadBooking();
        }}
      />
    );
  }

  const currentIndex = TIMELINE.indexOf(booking.status);
  const canCancel = booking.status === "requested";
  const canPay = booking.status === "completed" && booking.paymentStatus === "unpaid";
  const terminal = booking.status === "rejected" || booking.status === "cancelled";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/dashboard/customer/bookings"
            className="text-sm font-bold text-emerald-700 hover:underline"
          >
            ← Back to my bookings
          </Link>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {booking.serviceTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Booking ID <span className="font-mono font-bold text-slate-700">{booking._id}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={booking.status} />
          <PaymentBadge paid={booking.paymentStatus === "paid"} />
        </div>
      </div>

      {/* Status timeline */}
      {!terminal && (
        <section className="card card-pad">
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">
            Job progress
          </h2>
          <ol className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-0">
            {TIMELINE.map((step, index) => {
              const done = index <= currentIndex;
              const meta = BOOKING_STATUS_META[step];
              return (
                <li key={step} className="relative flex flex-1 items-start gap-3 sm:block">
                  {index < TIMELINE.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={`absolute left-4 top-4 hidden h-0.5 w-full sm:block ${
                        index < currentIndex ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                      done ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {done ? "✓" : index + 1}
                  </span>
                  <div className="sm:mt-3 sm:pr-4">
                    <p
                      className={`text-xs font-black uppercase tracking-wide ${
                        done ? "text-emerald-700" : "text-slate-400"
                      }`}
                    >
                      {meta.label}
                    </p>
                    <p className="mt-0.5 hidden text-[11px] text-slate-400 sm:block">
                      {index === 0 && "Request received"}
                      {index === 1 && "Technician confirmed"}
                      {index === 2 && "Repair underway"}
                      {index === 3 && "Ready for payment"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main details */}
        <section className="card card-pad lg:col-span-2">
          <h2 className="text-base font-black text-slate-950">Repair details</h2>

          <div className="mt-4 flex gap-4">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
              {booking.serviceImage ? (
                <img src={booking.serviceImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-3xl">🔧</div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-900">{booking.serviceTitle}</p>
              <p className="mt-1 text-sm text-slate-500">{booking.category}</p>
              <p className="mt-1 text-sm text-slate-500">
                Starting price {formatMoney(booking.basePrice)}
              </p>
            </div>
          </div>

          <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Preferred date
              </dt>
              <dd className="mt-1 font-bold text-slate-800">
                {formatDateTime(booking.preferredDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Your phone
              </dt>
              <dd className="mt-1 font-bold text-slate-800">{booking.customerPhone}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Repair address
              </dt>
              <dd className="mt-1 font-bold text-slate-800">{booking.address}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Problem description
              </dt>
              <dd className="mt-1 leading-6 text-slate-700">{booking.problemDescription}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Requested on
              </dt>
              <dd className="mt-1 font-bold text-slate-800">{formatDateTime(booking.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Last update
              </dt>
              <dd className="mt-1 font-bold text-slate-800">
                {formatDateTime(booking.updatedAt || booking.createdAt)}
              </dd>
            </div>
          </dl>
        </section>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="card card-pad">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">
              Payment
            </h2>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {formatMoney(booking.finalAmount || booking.basePrice)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {booking.paymentStatus === "paid"
                ? "Settled — receipt available in payment history."
                : booking.status === "completed"
                  ? "Due now — pay securely with Stripe."
                  : "Payable after the repair is completed."}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {canPay && (
                <Button onClick={handlePay} loading={busy} className="w-full">
                  Pay Now with Stripe
                </Button>
              )}
              {booking.paymentStatus === "paid" && (
                <Link href="/dashboard/customer/payments" className="btn btn-outline w-full">
                  View receipt
                </Link>
              )}
              {canCancel && (
                <Button
                  variant="danger"
                  onClick={() => setConfirmOpen(true)}
                  disabled={busy}
                  className="w-full"
                >
                  Cancel Booking
                </Button>
              )}
            </div>
          </section>

          <section className="card card-pad">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">
              Your technician
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 font-black text-white"
              >
                {booking.technicianName?.charAt(0)?.toUpperCase() || "T"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">
                  {booking.technicianName}
                </p>
                <p className="truncate text-xs text-slate-500">{booking.technicianEmail}</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Messages and status changes arrive through your dashboard notifications.
            </p>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        danger
        title="Cancel this booking?"
        message="The technician will be notified immediately. This action cannot be undone."
        confirmLabel="Yes, cancel booking"
        busy={busy}
        onConfirm={handleCancel}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
