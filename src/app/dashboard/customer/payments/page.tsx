"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/constants";
import type { Payment } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import { EmptyState, ErrorState, StatCardSkeleton, TableSkeleton } from "@/components/ui/Feedback";

export default function CustomerPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<{ payments?: Payment[] }>("/api/payments/mine");
      setPayments(data.payments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load payments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const totalSpent = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
            Customer dashboard
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Payment History
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Every completed payment with its transaction reference.
          </p>
        </div>
        <Link href="/dashboard/customer/bookings" className="btn btn-outline">
          My Bookings
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Payments" value={payments.length} icon="🧾" accent="blue" />
          <StatCard
            label="Total Spent"
            value={formatMoney(totalSpent)}
            icon="💰"
            accent="emerald"
          />
          <StatCard
            label="Currency"
            value="USD"
            icon="🌍"
            accent="violet"
            sub="Processed securely by Stripe"
          />
        </div>
      )}

      {error && <ErrorState description={error} onRetry={loadPayments} />}

      <section className="table-shell">
        {loading ? (
          <TableSkeleton rows={4} />
        ) : payments.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon="💳"
              title="No payments yet"
              description="Payments appear here once a completed booking has been paid through Stripe."
              actionLabel="View my bookings"
              actionHref="/dashboard/customer/bookings"
            />
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-th">Service</th>
                <th className="table-th">Technician</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Transaction ID</th>
                <th className="table-th">Payment date</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((payment) => (
                <tr key={payment._id} className="transition hover:bg-slate-50/70">
                  <td className="table-td font-bold text-slate-900">{payment.serviceTitle}</td>
                  <td className="table-td">{payment.technicianName}</td>
                  <td className="table-td font-black text-emerald-700">
                    {formatMoney(payment.amount)}{" "}
                    <span className="text-xs font-bold text-slate-400">
                      {payment.currency?.toUpperCase()}
                    </span>
                  </td>
                  <td className="table-td font-mono text-xs">{payment.transactionId}</td>
                  <td className="table-td">{formatDateTime(payment.paidAt)}</td>
                  <td className="table-td">
                    <Badge className="bg-emerald-100 text-emerald-800">Paid</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
