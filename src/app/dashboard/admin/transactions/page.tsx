"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/constants";
import type { Payment } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import { EmptyState, ErrorState, StatCardSkeleton, TableSkeleton } from "@/components/ui/Feedback";
import BarChart from "@/components/BarChart";

/** Buckets payments into the last 7 days for the revenue chart. */
function groupRevenueByDay(payments: Payment[]): { label: string; value: number; color: string }[] {
  const now = Date.now();
  const buckets = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now - i * 24 * 60 * 60 * 1000);
    buckets.set(day.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), 0);
  }
  for (const payment of payments) {
    const when = new Date(payment.paidAt);
    if (Number.isNaN(when.getTime())) continue;
    const key = when.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) || 0) + Number(payment.amount || 0));
    }
  }
  return Array.from(buckets, ([label, value]) => ({
    label,
    value: Math.round(value * 100) / 100,
    color: "bg-violet-500",
  }));
}

export default function AdminTransactionsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  // Revenue grouped by day (last 7 days) for the chart. Filled when the data
  // arrives — never computed during render, which keeps Date.now() out of it.
  const [revenueByDay, setRevenueByDay] = useState<
    { label: string; value: number; color: string }[]
  >([]);

  // Loader touches state only inside promise callbacks, so the effect never
  // sets state synchronously (react-hooks/set-state-in-effect).
  const loadPayments = useCallback(
    () =>
      api
        .get<{ payments?: Payment[]; totalRevenue?: number }>("/api/payments")
        .then((data) => {
          const list = data.payments || [];
          setPayments(list);
          setTotalRevenue(
            data.totalRevenue ??
              list.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
          );
          setRevenueByDay(groupRevenueByDay(list));
          setError("");
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Could not load transactions.");
        })
        .finally(() => {
          setLoading(false);
        }),
    []
  );

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const filtered = payments.filter((payment) => {
    const term = search.trim().toLowerCase();
    return (
      !term ||
      payment.serviceTitle.toLowerCase().includes(term) ||
      payment.customerName.toLowerCase().includes(term) ||
      payment.technicianName.toLowerCase().includes(term) ||
      payment.transactionId.toLowerCase().includes(term)
    );
  });

  const byTechnician = (() => {
    const map = new Map<string, number>();
    for (const payment of payments) {
      const key = payment.technicianName || "Unknown";
      map.set(key, (map.get(key) || 0) + Number(payment.amount || 0));
    }
    return Array.from(map, ([label, value]) => ({ label, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
      .map((item) => ({ ...item, color: "bg-emerald-500" }));
  })();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
          Admin dashboard
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          Transactions
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Every verified Stripe payment recorded by the webhook.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Revenue"
            value={formatMoney(totalRevenue)}
            icon="💰"
            accent="emerald"
            sub="All verified payments"
          />
          <StatCard label="Transactions" value={payments.length} icon="🧾" accent="blue" />
          <StatCard
            label="Avg. transaction"
            value={formatMoney(payments.length ? totalRevenue / payments.length : 0)}
            icon="📈"
            accent="violet"
          />
        </div>
      )}

      {error && (
        <ErrorState
          description={error}
          onRetry={() => {
            setError("");
            setLoading(true);
            void loadPayments();
          }}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <BarChart title="Revenue (last 7 active days)" data={revenueByDay} suffix="" emptyLabel="No payments yet." />
        <BarChart title="Revenue by technician" data={byTechnician} emptyLabel="No payments yet." />
      </div>

      <div className="card card-pad">
        <label htmlFor="transaction-search" className="label">
          Search transactions
        </label>
        <input
          id="transaction-search"
          type="search"
          className="input max-w-lg"
          placeholder="Search by service, customer, technician or transaction ID…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="table-shell">
        {loading ? (
          <TableSkeleton rows={5} />
        ) : filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon="💳"
              title="No transactions yet"
              description="Verified Stripe payments will appear here in real time."
            />
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-th">Service</th>
                <th className="table-th">Customer</th>
                <th className="table-th">Technician</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Transaction ID</th>
                <th className="table-th">Payment date</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((payment) => (
                <tr key={payment._id} className="hover:bg-slate-50/70">
                  <td className="table-td font-bold text-slate-900">{payment.serviceTitle}</td>
                  <td className="table-td">
                    <p className="font-semibold text-slate-800">{payment.customerName}</p>
                    <p className="text-xs text-slate-500">{payment.customerEmail}</p>
                  </td>
                  <td className="table-td">
                    <p className="font-semibold text-slate-800">{payment.technicianName}</p>
                    <p className="text-xs text-slate-500">{payment.technicianEmail}</p>
                  </td>
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
      </div>
    </div>
  );
}
