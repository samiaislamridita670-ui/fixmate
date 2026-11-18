"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import { EmptyState, ErrorState, StatCardSkeleton, TableSkeleton } from "@/components/ui/Feedback";
import BarChart from "@/components/BarChart";
import type { Booking } from "@/lib/types";

interface AdminStats {
  totalUsers: number;
  totalTechnicians: number;
  totalCustomers: number;
  totalServices: number;
  pendingServices: number;
  approvedServices: number;
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  totalRevenue: number;
  paymentsCount: number;
  bookingsByStatus: { label: string; value: number }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<AdminStats & { recentBookings?: Booking[] }>(
        "/api/admin/stats"
      );
      setStats(data);
      setRecentBookings(data.recentBookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load admin statistics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
            Admin dashboard
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Platform Overview
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Users, services, bookings and revenue across FixMate.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/admin/approvals" className="btn btn-amber">
            Review Approvals
          </Link>
          <button type="button" onClick={loadStats} className="btn btn-outline">
            Refresh
          </button>
        </div>
      </div>

      {error && <ErrorState description={error} onRetry={loadStats} />}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Users" value={stats.totalUsers} icon="👥" accent="blue" />
            <StatCard
              label="Total Technicians"
              value={stats.totalTechnicians}
              icon="🛠️"
              accent="emerald"
            />
            <StatCard
              label="Pending Services"
              value={stats.pendingServices}
              icon="⏳"
              accent="amber"
              sub={`${stats.approvedServices} approved`}
            />
            <StatCard
              label="Total Revenue"
              value={formatMoney(stats.totalRevenue)}
              icon="💰"
              accent="violet"
              sub={`${stats.paymentsCount} payment(s)`}
            />
            <StatCard label="Total Services" value={stats.totalServices} icon="🧰" accent="blue" />
            <StatCard
              label="Total Bookings"
              value={stats.totalBookings}
              icon="📋"
              accent="emerald"
            />
            <StatCard
              label="Active Jobs"
              value={stats.activeBookings}
              icon="⚙️"
              accent="amber"
              sub="requested · accepted · in progress"
            />
            <StatCard
              label="Completed Jobs"
              value={stats.completedBookings}
              icon="✅"
              accent="violet"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <BarChart
              title="Bookings by status"
              data={stats.bookingsByStatus || []}
              emptyLabel="No bookings yet."
            />
            <div className="card card-pad h-full">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">
                  Users by role
                </h3>
                <Link
                  href="/dashboard/admin/users"
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Manage →
                </Link>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div className="rounded-xl bg-sky-50 p-4">
                  <p className="text-2xl font-black text-sky-700">{stats.totalCustomers}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-sky-600">
                    Customers
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-2xl font-black text-emerald-700">{stats.totalTechnicians}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-emerald-600">
                    Technicians
                  </p>
                </div>
                <div className="rounded-xl bg-violet-50 p-4">
                  <p className="text-2xl font-black text-violet-700">
                    {Math.max(0, stats.totalUsers - stats.totalCustomers - stats.totalTechnicians)}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-violet-600">
                    Admins
                  </p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Link href="/dashboard/admin/users" className="btn btn-outline btn-sm">
                  Manage Users
                </Link>
                <Link href="/dashboard/admin/bookings" className="btn btn-outline btn-sm">
                  Manage Bookings
                </Link>
                <Link href="/dashboard/admin/services" className="btn btn-outline btn-sm">
                  All Services
                </Link>
                <Link href="/dashboard/admin/transactions" className="btn btn-outline btn-sm">
                  Transactions
                </Link>
              </div>
            </div>
          </div>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-black text-slate-950">Latest bookings</h2>
              <Link
                href="/dashboard/admin/bookings"
                className="text-sm font-bold text-emerald-700 hover:underline"
              >
                View all →
              </Link>
            </div>
            {recentBookings.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon="📅"
                  title="No bookings yet"
                  description="Customer bookings will appear here as soon as requests come in."
                />
              </div>
            ) : (
              <div className="table-shell border-0 shadow-none">
                <table className="min-w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="table-th">Service</th>
                      <th className="table-th">Customer</th>
                      <th className="table-th">Technician</th>
                      <th className="table-th">Date</th>
                      <th className="table-th">Amount</th>
                      <th className="table-th">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentBookings.map((booking) => (
                      <tr key={booking._id} className="hover:bg-slate-50/70">
                        <td className="table-td font-bold text-slate-900">
                          {booking.serviceTitle}
                        </td>
                        <td className="table-td">{booking.customerName}</td>
                        <td className="table-td">{booking.technicianName}</td>
                        <td className="table-td">{formatDate(booking.preferredDate)}</td>
                        <td className="table-td font-black text-emerald-700">
                          {formatMoney(booking.finalAmount || booking.basePrice)}
                        </td>
                        <td className="table-td">
                          <StatusBadge status={booking.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
