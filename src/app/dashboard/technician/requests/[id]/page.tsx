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

export default function TechnicianBookingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<{ status: BookingStatus; message: string; label: string } | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [finalAmount, setFinalAmount] = useState("");
  const [amountError, setAmountError] = useState("");

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
          setError(err instanceof Error ? err.message : "Could not load the request.");
        })
        .finally(() => {
          setLoading(false);
        }),
    [id]
  );

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  async function changeStatus(status: BookingStatus, extra?: { finalAmount: number }) {
    setBusy(true);
    try {
      await api.patch(`/api/bookings/${id}/status`, { status, ...extra });
      toast.success(`Request marked ${BOOKING_STATUS_META[status].label.toLowerCase()}.`);
      setConfirm(null);
      setCompleteOpen(false);
      await loadBooking();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the request.");
    } finally {
      setBusy(false);
    }
  }

  function submitComplete() {
    const amount = Number(finalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setAmountError("Final amount must be greater than zero.");
      return;
    }
    setAmountError("");
    changeStatus("completed", { finalAmount: amount });
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
      <div className="space-y-5">
        <ErrorState
          title="Request not found"
          description={error}
          onRetry={() => {
            setError("");
            setLoading(true);
            void loadBooking();
          }}
        />
        <div className="flex justify-center">
          <Link href="/dashboard/technician/requests" className="btn btn-outline">
            ← Back to requests
          </Link>
        </div>
      </div>
    );
  }

  const currentIndex = TIMELINE.indexOf(booking.status);
  const terminal = booking.status === "rejected" || booking.status === "cancelled";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/dashboard/technician/requests"
            className="text-sm font-bold text-emerald-700 hover:underline"
          >
            ← Back to requests
          </Link>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {booking.serviceTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Booking <span className="font-mono font-bold">{booking._id}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={booking.status} />
          <PaymentBadge paid={booking.paymentStatus === "paid"} />
        </div>
      </div>

      {!terminal && (
        <section className="card card-pad">
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">Job progress</h2>
          <ol className="mt-5 flex flex-col gap-4 sm:flex-row sm:gap-0">
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
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card card-pad lg:col-span-2">
          <h2 className="text-base font-black text-slate-950">Job details</h2>

          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Customer</dt>
              <dd className="mt-1 font-bold text-slate-800">{booking.customerName}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Phone</dt>
              <dd className="mt-1 font-bold text-slate-800">{booking.customerPhone}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Address</dt>
              <dd className="mt-1 font-bold text-slate-800">{booking.address}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Preferred date
              </dt>
              <dd className="mt-1 font-bold text-slate-800">
                {formatDateTime(booking.preferredDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Category</dt>
              <dd className="mt-1 font-bold text-slate-800">{booking.category}</dd>
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
                Customer email
              </dt>
              <dd className="mt-1 font-bold text-slate-800">{booking.customerEmail}</dd>
            </div>
          </dl>
        </section>

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
                ? "Paid by the customer via Stripe."
                : booking.status === "completed"
                  ? "Awaiting customer payment."
                  : "Final amount submitted when you complete the job."}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Base price: <strong>{formatMoney(booking.basePrice)}</strong>
            </p>
          </section>

          <section className="card card-pad">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">
              Actions
            </h2>
            <div className="mt-4 flex flex-col gap-2">
              {booking.status === "requested" && (
                <>
                  <Button
                    loading={busy && confirm?.status === "accepted"}
                    onClick={() =>
                      setConfirm({
                        status: "accepted",
                        message: `Accept “${booking.serviceTitle}” for ${formatDateTime(booking.preferredDate)}?`,
                        label: "Accept request",
                      })
                    }
                  >
                    Accept Request
                  </Button>
                  <Button
                    variant="danger"
                    loading={busy && confirm?.status === "rejected"}
                    onClick={() =>
                      setConfirm({
                        status: "rejected",
                        message: "The customer will be notified that you declined this request.",
                        label: "Reject request",
                      })
                    }
                  >
                    Reject Request
                  </Button>
                </>
              )}

              {booking.status === "accepted" && (
                <Button
                  loading={busy && confirm?.status === "in-progress"}
                  onClick={() =>
                    setConfirm({
                      status: "in-progress",
                      message: "Mark this job as in progress? The customer sees the update live.",
                      label: "Start repair",
                    })
                  }
                >
                  Start Repair
                </Button>
              )}

              {booking.status === "in-progress" && (
                <Button
                  onClick={() => {
                    setFinalAmount(String(booking.basePrice || ""));
                    setAmountError("");
                    setCompleteOpen(true);
                  }}
                >
                  Mark Completed
                </Button>
              )}

              {["completed", "rejected", "cancelled"].includes(booking.status) && (
                <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                  This job is in a final state. {booking.status === "completed" &&
                    "Waiting for the customer's payment."}
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        danger={confirm?.status === "rejected"}
        title={confirm?.status === "accepted" ? "Accept request?" : confirm?.status === "rejected" ? "Reject request?" : "Start repair?"}
        message={confirm?.message || ""}
        confirmLabel={confirm?.label || "Confirm"}
        busy={busy}
        onConfirm={() => confirm && changeStatus(confirm.status)}
        onCancel={() => setConfirm(null)}
      />

      {completeOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="fade-up w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-black text-slate-950">Complete this job</h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">
              Submit the final amount the customer will pay for this repair.
            </p>
            <label htmlFor="tech-final-amount" className="label mt-5">
              Final amount (USD) *
            </label>
            <input
              id="tech-final-amount"
              type="number"
              min="0.01"
              step="0.01"
              className="input"
              value={finalAmount}
              onChange={(event) => {
                setFinalAmount(event.target.value);
                setAmountError("");
              }}
              autoFocus
            />
            {amountError && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
                {amountError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCompleteOpen(false)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={submitComplete} loading={busy}>
                Mark Completed
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
