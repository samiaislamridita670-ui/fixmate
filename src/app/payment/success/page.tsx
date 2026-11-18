"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/constants";
import type { Payment } from "@/lib/types";
import { PageLoader } from "@/components/ui/Feedback";

type VerifyState = "verifying" | "verified" | "already-paid" | "unavailable" | "failed";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") || "";

  const [state, setState] = useState<VerifyState>("verifying");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [detail, setDetail] = useState("");

  // Render-time derivation: a missing session id shows the unavailable state
  // without touching state inside the effect.
  const verifyState: VerifyState = sessionId ? state : "unavailable";
  const verifyDetail = sessionId
    ? detail
    : "No checkout session was provided with this page.";

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    api
      .get<{ success: boolean; payment?: Payment; message?: string }>(
        `/api/payments/verify?session_id=${encodeURIComponent(sessionId)}`
      )
      .then((data) => {
        if (cancelled) return;
        if (data?.payment) {
          setPayment(data.payment);
          setState("verified");
        } else {
          setState("failed");
          setDetail(data?.message || "The payment could not be verified yet.");
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Verification unavailable.";
        // Already paid or Stripe not configured — still show a helpful page.
        setState(message.toLowerCase().includes("already") ? "already-paid" : "unavailable");
        setDetail(message);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-5 py-16">
      <div className="w-full max-w-lg">
        <div className="card overflow-hidden text-center">
          <div
            className={`px-7 py-10 ${
              verifyState === "verified" || verifyState === "already-paid"
                ? "bg-emerald-600"
                : verifyState === "failed"
                  ? "bg-red-600"
                  : "bg-slate-900"
            } text-white`}
          >
            <span className="text-5xl" aria-hidden="true">
              {verifyState === "verifying" ? "⏳" : verifyState === "failed" ? "⚠️" : "✅"}
            </span>
            <h1 className="mt-4 text-2xl font-black">
              {verifyState === "verifying" && "Verifying your payment…"}
              {verifyState === "verified" && "Payment successful!"}
              {verifyState === "already-paid" && "Payment received!"}
              {verifyState === "unavailable" && "Payment submitted"}
              {verifyState === "failed" && "Payment needs attention"}
            </h1>
            <p className="mt-2 text-sm text-white/80">
              {verifyState === "verified" || verifyState === "already-paid"
                ? "Thank you — your receipt is ready."
                : verifyState === "verifying"
                  ? "Hang tight while we confirm the transaction with Stripe."
                  : verifyDetail}
            </p>
          </div>

          <div className="p-7">
            {verifyState === "verifying" ? (
              <div className="flex justify-center py-6">
                <PageLoader label="Checking transaction…" />
              </div>
            ) : payment ? (
              <dl className="space-y-3 text-left text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <dt className="font-semibold text-slate-500">Service</dt>
                  <dd className="font-black text-slate-900">{payment.serviceTitle}</dd>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <dt className="font-semibold text-slate-500">Amount</dt>
                  <dd className="font-black text-emerald-700">
                    {formatMoney(payment.amount)} {payment.currency?.toUpperCase()}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <dt className="font-semibold text-slate-500">Transaction ID</dt>
                  <dd className="break-all font-mono text-xs text-slate-700">
                    {payment.transactionId}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-semibold text-slate-500">Paid on</dt>
                  <dd className="font-black text-slate-900">
                    {new Date(payment.paidAt).toLocaleString("en-GB")}
                  </dd>
                </div>
              </dl>
            ) : (
              <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {verifyDetail ||
                  "Your payment will appear in your payment history as soon as the transaction is confirmed."}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/dashboard/customer/payments" className="btn btn-primary">
                View Payment History
              </Link>
              <Link href="/dashboard/customer/bookings" className="btn btn-outline">
                My Bookings
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          Test card: 4242 4242 4242 4242 · any future expiry · any CVC
        </p>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PageLoader label="Opening payment result…" />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
