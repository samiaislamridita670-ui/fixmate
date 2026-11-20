"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { BOOKING_STATUS_META, formatDate, formatMoney } from "@/lib/constants";
import type { Booking, BookingStatus } from "@/lib/types";
import { StatusBadge, PaymentBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/Toast";

const FILTERS = ["all", "requested", "accepted", "in-progress", "completed"] as const;
type Filter = (typeof FILTERS)[number];

type PendingAction = {
  booking: Booking;
  status: Exclude<BookingStatus, "completed">;
} | null;

export default function TechnicianRequestsPage() {
  const toast = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState("");
  const [confirm, setConfirm] = useState<PendingAction>(null);

  // Completion dialog (final amount required)
  const [completeTarget, setCompleteTarget] = useState<Booking | null>(null);
  const [finalAmount, setFinalAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [completing, setCompleting] = useState(false);

  // Loader touches state only inside promise callbacks, so the effect never
  // sets state synchronously (react-hooks/set-state-in-effect).
  // Loading starts as true for the initial fetch.
  const loadBookings = useCallback(
    () =>
      api
        .get<{ bookings?: Booking[] }>("/api/bookings/assigned")
        .then((data) => {
          setBookings(data.bookings || []);
          setError("");
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Could not load requests.");
        })
        .finally(() => {
          setLoading(false);
        }),
    []
  );

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  async function applyStatus(booking: Booking, status: BookingStatus) {
    setBusyId(booking._id);
    try {
      await api.patch(`/api/bookings/${booking._id}/status`, { status });
      toast.success(`Request marked ${BOOKING_STATUS_META[status].label.toLowerCase()}.`);
      setConfirm(null);
      await loadBookings();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the request.");
    } finally {
      setBusyId("");
    }
  }

  async function submitCompletion() {
    if (!completeTarget) return;
    const amount = Number(finalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setAmountError("Final amount must be greater than zero.");
      return;
    }
    setCompleting(true);
    try {
      await api.patch(`/api/bookings/${completeTarget._id}/status`, {
        status: "completed",
        finalAmount: amount,
      });
      toast.success("Job completed — the customer can now pay.");
      setCompleteTarget(null);
      setFinalAmount("");
      setAmountError("");
      await loadBookings();
    } catch (err) {
      setAmountError(err instanceof Error ? err.message : "Could not complete the job.");
    } finally {
      setCompleting(false);
    }
  }

  const filtered = bookings.filter(
    (booking) => filter === "all" || booking.status === filter
  );

  const counts = {
    all: bookings.length,
    requested: bookings.filter((b) => b.status === "requested").length,
    accepted: bookings.filter((b) => b.status === "accepted").length,
    "in-progress": bookings.filter((b) => b.status === "in-progress").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  } as Record<string, number>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
            Technician dashboard
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Booking Requests
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {counts.requested} waiting for your response.
          </p>
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
              {item.replace("-", " ")}
              <span className="ml-1 opacity-70">{counts[item]}</span>
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
          icon="📥"
          title={filter === "all" ? "No requests yet" : `No ${filter.replace("-", " ")} requests`}
          description="Customer requests for your approved services appear here in real time."
          actionLabel="My Services"
          actionHref="/dashboard/technician/my-services"
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => {
            const busy = busyId === booking._id;
            return (
              <article key={booking._id} className="card overflow-hidden">
                <div className="flex flex-col gap-4 p-5 lg:flex-row">
                  {/* Service + status */}
                  <div className="flex min-w-0 flex-1 gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {booking.serviceImage ? (
                        <img onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/image-fallback.svg"; }} src={booking.serviceImage} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xl">🔧</div>
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
                      <p className="mt-1 text-sm text-slate-600">
                        👤 {booking.customerName} · 📞 {booking.customerPhone}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        📅 {formatDate(booking.preferredDate)} · 💲{" "}
                        {formatMoney(booking.finalAmount || booking.basePrice)}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid gap-2 text-sm text-slate-600 lg:w-80">
                    <p>
                      <strong className="text-slate-800">Address:</strong> {booking.address}
                    </p>
                    <p className="line-clamp-2">
                      <strong className="text-slate-800">Problem:</strong>{" "}
                      {booking.problemDescription}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-start gap-2 lg:w-56 lg:justify-end">
                    <Link
                      href={`/dashboard/technician/requests/${booking._id}`}
                      className="btn btn-outline btn-sm"
                    >
                      Details
                    </Link>

                    {booking.status === "requested" && (
                      <>
                        <Button
                          size="sm"
                          loading={busy}
                          onClick={() => setConfirm({ booking, status: "accepted" })}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          loading={busy}
                          onClick={() => setConfirm({ booking, status: "rejected" })}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {booking.status === "accepted" && (
                      <Button
                        size="sm"
                        loading={busy}
                        onClick={() => setConfirm({ booking, status: "in-progress" })}
                      >
                        Start Repair
                      </Button>
                    )}

                    {booking.status === "in-progress" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setCompleteTarget(booking);
                          setFinalAmount(String(booking.basePrice || ""));
                          setAmountError("");
                        }}
                      >
                        Mark Completed
                      </Button>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {BOOKING_STATUS_META[booking.status]?.label} · requested{" "}
                  {formatDate(booking.createdAt)}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Status transition confirmation */}
      <ConfirmDialog
        open={!!confirm}
        danger={confirm?.status === "rejected"}
        title={
          confirm?.status === "accepted"
            ? "Accept this request?"
            : confirm?.status === "rejected"
              ? "Reject this request?"
              : "Start this repair?"
        }
        message={
          confirm?.status === "accepted"
            ? `You are committing to “${confirm?.booking.serviceTitle}” on ${formatDate(confirm?.booking.preferredDate)}.`
            : confirm?.status === "rejected"
              ? "The customer will be notified that the request was declined."
              : "The booking will move to in-progress and the customer will see the update."
        }
        confirmLabel={
          confirm?.status === "accepted"
            ? "Accept request"
            : confirm?.status === "rejected"
              ? "Reject request"
              : "Start repair"
        }
        busy={!!confirm && busyId === confirm.booking._id}
        onConfirm={() => confirm && applyStatus(confirm.booking, confirm.status)}
        onCancel={() => setConfirm(null)}
      />

      {/* Completion + final amount dialog */}
      {completeTarget && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !completing) setCompleteTarget(null);
          }}
        >
          <div className="fade-up w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-black text-slate-950">Complete this job</h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">
              Enter the final agreed amount for “{completeTarget.serviceTitle}”. The customer will
              be asked to pay exactly this amount.
            </p>

            <label htmlFor="final-amount" className="label mt-5">
              Final amount (USD) *
            </label>
            <input
              id="final-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={finalAmount}
              onChange={(event) => {
                setFinalAmount(event.target.value);
                setAmountError("");
              }}
              className="input"
              placeholder="e.g. 60"
              autoFocus
            />
            <p className="hint">
              Starting price was {formatMoney(completeTarget.basePrice)}.
            </p>

            {amountError && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
                {amountError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setCompleteTarget(null)}
                disabled={completing}
              >
                Cancel
              </Button>
              <Button onClick={submitCompletion} loading={completing}>
                Mark Completed
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

