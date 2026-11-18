"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface Booking {
  _id: string;
  serviceTitle: string;
  serviceImage: string;
  category: string;
  basePrice: number;
  finalAmount: number;
  technicianName: string;
  customerName: string;
  customerPhone: string;
  address: string;
  preferredDate: string;
  problemDescription: string;
  status: "requested" | "accepted" | "rejected" | "in-progress" | "completed" | "cancelled";
  paymentStatus: "unpaid" | "paid";
}

const statusStyle: Record<string, string> = {
  requested: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  "in-progress": "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-slate-200 text-slate-700",
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [message, setMessage] = useState("");

  const user = session?.user as ({ name?: string; role?: string } | undefined);
  const role = user?.role || "customer";
  const isTechnician = role === "technician";

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/login");
      return;
    }

    async function loadBookings() {
      try {
        const endpoint = isTechnician
          ? "http://localhost:5000/api/bookings/assigned"
          : "http://localhost:5000/api/bookings/mine";

        const response = await fetch(endpoint, { credentials: "include" });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Could not load bookings.");
        }

        setBookings(result.bookings || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    loadBookings();
  }, [session, isPending, isTechnician, router]);

  async function updateBooking(id: string, action: "cancel" | "accept" | "reject" | "in-progress" | "completed") {
    setActionLoading(id + action);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/bookings/${id}/${action === "cancel" ? "cancel" : "status"}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: action === "cancel" ? undefined : JSON.stringify({
            status: action,
            ...(action === "completed" ? { finalAmount: bookings.find((b) => b._id === id)?.basePrice } : {}),
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not update booking.");

      setMessage("Booking updated successfully.");
      const endpoint = isTechnician
        ? "http://localhost:5000/api/bookings/assigned"
        : "http://localhost:5000/api/bookings/mine";
      const refreshed = await fetch(endpoint, { credentials: "include" });
      const refreshedData = await refreshed.json();
      if (refreshed.ok) setBookings(refreshedData.bookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setActionLoading("");
    }
  }

  async function logout() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  if (isPending || loading && session) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">Loading dashboard...</main>;
  }

  const activeCount = bookings.filter((b) => ["requested", "accepted", "in-progress"].includes(b.status)).length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-bold text-blue-700">FixMate</Link>
          <div className="flex items-center gap-5 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-blue-700">Home</Link>
            <Link href="/services" className="hover:text-blue-700">Services</Link>
            {role === "admin" && <Link href="/admin" className="hover:text-blue-700">Admin Panel</Link>}
            {isTechnician && <Link href="/services" className="hover:text-blue-700">Browse Services</Link>}
            <button onClick={logout} className="font-semibold text-red-600 hover:text-red-700">Logout</button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              {isTechnician ? "Technician Panel" : role === "admin" ? "Admin Panel" : "Customer Panel"}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Welcome, {user?.name || "User"}!
            </h1>
            <p className="mt-2 text-slate-500">
              {isTechnician ? "Manage your assigned repair requests and update their progress." : "Track and manage your repair service bookings."}
            </p>
          </div>
          {!isTechnician && role !== "admin" && (
            <Link href="/services" className="rounded-lg bg-blue-700 px-6 py-3 text-center font-semibold text-white hover:bg-blue-800">
              + Book a Service
            </Link>
          )}
          {isTechnician && (
            <Link href="/technician/services" className="rounded-lg bg-blue-700 px-6 py-3 text-center font-semibold text-white hover:bg-blue-800">
              + Manage Services
            </Link>
          )}
          {role === "admin" && (
            <Link href="/admin" className="rounded-lg bg-blue-700 px-6 py-3 text-center font-semibold text-white hover:bg-blue-800">
              Open Admin Panel
            </Link>
          )}
        </div>

        <section className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Bookings", value: bookings.length, icon: "📋" },
            { label: "Active Bookings", value: activeCount, icon: "⏳" },
            { label: "Completed", value: completedCount, icon: "✅" },
            { label: "Unpaid", value: bookings.filter((b) => b.paymentStatus === "unpaid" && b.status === "completed").length, icon: "💳" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{item.icon}</span>
                <span className="text-3xl font-bold text-slate-900">{item.value}</span>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-500">{item.label}</p>
            </div>
          ))}
        </section>

        {message && <p className="mb-5 rounded-lg bg-green-50 p-4 text-green-700">{message}</p>}
        {error && <p className="mb-5 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}

        <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              {isTechnician ? "Assigned Repair Requests" : "My Bookings"}
            </h2>
            <span className="text-sm text-slate-400">{bookings.length} booking(s)</span>
          </div>

          {loading ? (
            <p className="py-10 text-center text-slate-500">Loading bookings...</p>
          ) : bookings.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-500">No bookings found yet.</p>
              {!isTechnician && (
                <Link href="/services" className="mt-4 inline-block font-semibold text-blue-700 hover:underline">
                  Explore available services →
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {bookings.map((booking) => (
                <article key={booking._id} className="rounded-xl border border-slate-200 p-5">
                  <div className="flex flex-col justify-between gap-4 md:flex-row">
                    <div className="flex gap-4">
                      {booking.serviceImage && (
                        <img src={booking.serviceImage} alt={booking.serviceTitle} className="h-20 w-20 rounded-lg object-cover" />
                      )}
                      <div>
                        <h3 className="font-bold text-slate-900">{booking.serviceTitle}</h3>
                        <p className="mt-1 text-sm text-slate-500">{booking.category}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Booking ID: {booking._id.slice(-8).toUpperCase()}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {isTechnician ? `Customer: ${booking.customerName}` : `Technician: ${booking.technicianName}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[booking.status] || "bg-slate-100 text-slate-700"}`}>
                        {booking.status.toUpperCase()}
                      </span>
                      <p className="font-bold text-slate-900">${booking.finalAmount ?? booking.basePrice}</p>
                      <span className={`text-xs font-semibold ${booking.paymentStatus === "paid" ? "text-green-700" : "text-amber-700"}`}>
                        Payment: {booking.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 border-t pt-4 text-sm text-slate-600 sm:grid-cols-2">
                    <p><strong className="text-slate-800">Preferred date:</strong> {new Date(booking.preferredDate).toLocaleDateString("en-GB")}</p>
                    <p><strong className="text-slate-800">Phone:</strong> {booking.customerPhone}</p>
                    <p className="sm:col-span-2"><strong className="text-slate-800">Address:</strong> {booking.address}</p>
                    <p className="sm:col-span-2"><strong className="text-slate-800">Problem:</strong> {booking.problemDescription}</p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {!isTechnician && booking.status === "requested" && (
                      <button disabled={!!actionLoading} onClick={() => updateBooking(booking._id, "cancel")} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                        {actionLoading === booking._id + "cancel" ? "Cancelling..." : "Cancel Booking"}
                      </button>
                    )}
                    {isTechnician && booking.status === "requested" && (
                      <>
                        <button disabled={!!actionLoading} onClick={() => updateBooking(booking._id, "accept")} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">Accept</button>
                        <button disabled={!!actionLoading} onClick={() => updateBooking(booking._id, "reject")} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">Reject</button>
                      </>
                    )}
                    {isTechnician && booking.status === "accepted" && (
                      <button disabled={!!actionLoading} onClick={() => updateBooking(booking._id, "in-progress")} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">Start Repair</button>
                    )}
                    {isTechnician && booking.status === "in-progress" && (
                      <button disabled={!!actionLoading} onClick={() => updateBooking(booking._id, "completed")} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">Mark Completed</button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-10 border-t pt-6 text-center text-sm text-slate-400">
          © 2026 FixMate. All rights reserved.
        </footer>
      </div>
    </main>
  );
}

