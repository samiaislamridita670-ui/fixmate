"use client";

import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

type Service = {
  _id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  basePrice: number;
  estimatedDuration: string;
  serviceMode: string;
  serviceArea: string;
  technicianName: string;
  technicianEmail: string;
  approvalStatus: "pending" | "approved" | "rejected";
  createdAt: string;
};

const API = "http://localhost:5000/api/services";

export default function AdminDashboard() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState("");

  const user = session?.user as
    | { name?: string; email?: string; role?: string }
    | undefined;

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API}/admin/pending`, {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load pending services.");
      }

      setServices(data.services || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionLoading && user?.role === "admin") {
      loadServices();
    } else if (!sessionLoading) {
      setLoading(false);
    }
  }, [sessionLoading, user?.role, loadServices]);

  async function updateApproval(id: string, approvalStatus: "approved" | "rejected") {
    try {
      setUpdating(id);
      const response = await fetch(`${API}/${id}/approval`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Could not update service approval.");
      }

      setServices((previous) => previous.filter((service) => service._id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setUpdating("");
    }
  }

  if (sessionLoading) {
    return <main className="min-h-screen bg-slate-100 p-10 text-center text-slate-900">Checking admin access...</main>;
  }

  if (!session || user?.role !== "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900">
        <div className="rounded-2xl bg-white p-8 text-center shadow">
          <h1 className="text-2xl font-bold">Admin access required</h1>
          <p className="mt-3 text-slate-600">Please sign in with an administrator account.</p>
          <a href="/login" className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white">Login</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-blue-600">FIXMATE ADMIN</p>
            <h1 className="mt-2 text-3xl font-bold">Service Approval Panel</h1>
            <p className="mt-2 text-slate-600">Review and manage technician service submissions.</p>
          </div>
          <button onClick={loadServices} className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">
            Refresh Services
          </button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Pending Approval</p>
            <p className="mt-2 text-3xl font-bold">{services.length}</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Administrator</p>
            <p className="mt-2 font-bold">{user.name || user.email}</p>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b p-5">
            <h2 className="text-xl font-bold">Pending Services</h2>
          </div>

          {loading ? (
            <p className="p-8 text-center">Loading services...</p>
          ) : error ? (
            <div className="p-8 text-center text-red-600">
              {error}
              <button onClick={loadServices} className="ml-3 underline">Retry</button>
            </div>
          ) : services.length === 0 ? (
            <p className="p-8 text-center text-slate-500">No pending services to review.</p>
          ) : (
            <div className="divide-y">
              {services.map((service) => (
                <article key={service._id} className="grid gap-5 p-5 md:grid-cols-[180px_1fr]">
                  <div>
                    {service.image ? (
                      <img src={service.image} alt={service.title} className="h-36 w-full rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-36 items-center justify-center rounded-lg bg-slate-100 text-slate-400">No image</div>
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-bold">{service.title}</h3>
                        <p className="mt-1 text-sm text-blue-600">{service.category}</p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Pending</span>
                    </div>

                    <p className="mt-3 text-sm text-slate-600">{service.description}</p>

                    <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                      <p><strong>Technician:</strong> {service.technicianName}</p>
                      <p><strong>Email:</strong> {service.technicianEmail}</p>
                      <p><strong>Base price:</strong> ${service.basePrice}</p>
                      <p><strong>Duration:</strong> {service.estimatedDuration}</p>
                      <p><strong>Service mode:</strong> {service.serviceMode}</p>
                      <p><strong>Service area:</strong> {service.serviceArea}</p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        disabled={updating === service._id}
                        onClick={() => updateApproval(service._id, "approved")}
                        className="rounded-lg bg-green-600 px-5 py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {updating === service._id ? "Updating..." : "Approve"}
                      </button>
                      <button
                        disabled={updating === service._id}
                        onClick={() => updateApproval(service._id, "rejected")}
                        className="rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="mt-6 flex justify-center gap-6">
          <a href="/dashboard" className="font-semibold text-blue-600 hover:underline">Dashboard</a>
          <a href="/services" className="font-semibold text-blue-600 hover:underline">Public Services</a>
        </div>
      </div>
    </main>
  );
}
