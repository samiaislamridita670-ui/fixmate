"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const API = "http://localhost:5000/api/services";

const categories = [
  "Smartphone", "Laptop & PC", "AC", "Refrigerator",
  "TV", "Washing Machine", "Electrical",
];

interface Service {
  _id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  basePrice: number;
  estimatedDuration: string;
  serviceMode: string;
  serviceArea: string;
  approvalStatus: string;
  isAvailable: boolean;
}

const inputClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600";

export default function TechnicianServicesPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    category: "Smartphone",
    description: "",
    image: "",
    basePrice: "",
    estimatedDuration: "",
    serviceMode: "Home Visit",
    serviceArea: "",
  });

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      router.replace("/login");
      return;
    }

    const role = (session.user as { role?: string }).role;
    if (role !== "technician") {
      router.replace("/dashboard");
      return;
    }

    loadServices();
  }, [session, isPending, router]);

  async function loadServices() {
    setLoading(true);
    try {
      const response = await fetch(`${API}/mine`, { credentials: "include" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not load services.");
      setServices(result.services || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load services.");
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError("Image size must be 4MB or less.");
      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") resolve(reader.result);
          else reject(new Error("Could not read image."));
        };
        reader.onerror = () => reject(new Error("Could not read image."));
        reader.readAsDataURL(file);
      });

      const response = await fetch(`${API}/upload-image`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Image upload failed.");

      setForm((previous) => ({ ...previous, image: result.imageUrl }));
      setMessage("Image uploaded successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (!form.image) throw new Error("Please upload a service image first.");

      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          basePrice: Number(form.basePrice),
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not create service.");

      setMessage("Service submitted successfully! It is waiting for admin approval.");
      setForm({
        title: "",
        category: "Smartphone",
        description: "",
        image: "",
        basePrice: "",
        estimatedDuration: "",
        serviceMode: "Home Visit",
        serviceArea: "",
      });
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (isPending || (loading && !session)) {
    return <main className="flex min-h-screen items-center justify-center text-slate-700">Loading...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-bold text-blue-700">FixMate</Link>
          <div className="flex gap-5 text-sm font-medium text-slate-600">
            <Link href="/dashboard" className="hover:text-blue-700">Dashboard</Link>
            <Link href="/services" className="hover:text-blue-700">Public Services</Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Technician Panel</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Manage Your Services</h1>
          <p className="mt-2 text-slate-500">Add repair services and track their admin approval status.</p>
        </div>

        {message && <p className="mb-5 rounded-lg bg-green-50 p-4 text-green-700">{message}</p>}
        {error && <p className="mb-5 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}

        <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Add New Service</h2>

          <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Service Title
              <input className={inputClass} required minLength={3} maxLength={100}
                placeholder="e.g. Smartphone Screen Repair"
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Category
              <select className={inputClass} value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Base Price (USD)
              <input className={inputClass} type="number" required min="1" step="0.01"
                placeholder="e.g. 50" value={form.basePrice}
                onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Estimated Duration
              <input className={inputClass} required placeholder="e.g. 1-2 hours"
                value={form.estimatedDuration}
                onChange={(e) => setForm({ ...form, estimatedDuration: e.target.value })} />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Service Mode
              <select className={inputClass} value={form.serviceMode}
                onChange={(e) => setForm({ ...form, serviceMode: e.target.value })}>
                <option>Home Visit</option>
                <option>Shop Drop-off</option>
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Service Area
              <input className={inputClass} required placeholder="e.g. Dhaka"
                value={form.serviceArea}
                onChange={(e) => setForm({ ...form, serviceArea: e.target.value })} />
            </label>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">
                Upload Service Image (Max 4MB)
                <input
                  className={`${inputClass} cursor-pointer`}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>

              {uploading && <p className="mt-3 text-sm font-medium text-blue-700">Uploading image to ImgBB...</p>}

              {form.image && (
                <div className="mt-4">
                  <img src={form.image} alt="Uploaded service preview" className="h-48 w-64 rounded-lg border object-cover" />
                  <p className="mt-2 text-sm font-medium text-green-700">Image uploaded and ready.</p>
                </div>
              )}
            </div>

            <label className="text-sm font-semibold text-slate-700 md:col-span-2">
              Description
              <textarea className={`${inputClass} min-h-32`} required minLength={20} maxLength={2000}
                placeholder="Describe the repair service, what's included, and any important details..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>

            <div className="md:col-span-2">
              <button disabled={saving || uploading || !form.image}
                className="rounded-lg bg-blue-700 px-7 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
                {saving ? "Submitting..." : "Submit Service for Approval"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">My Services</h2>
            <button onClick={loadServices} className="text-sm font-semibold text-blue-700 hover:underline">Refresh</button>
          </div>

          {loading ? (
            <p className="py-8 text-center text-slate-500">Loading services...</p>
          ) : services.length === 0 ? (
            <p className="py-8 text-center text-slate-500">You have not submitted any services yet.</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {services.map((service) => (
                <article key={service._id} className="overflow-hidden rounded-xl border border-slate-200">
                  <img src={service.image} alt={service.title} className="h-44 w-full object-cover" />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-slate-900">{service.title}</h3>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                        service.approvalStatus === "approved" ? "bg-green-100 text-green-700" :
                        service.approvalStatus === "rejected" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>{service.approvalStatus}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{service.category} · ${service.basePrice}</p>
                    <p className="mt-2 text-sm text-slate-600">{service.description}</p>
                    <p className="mt-3 text-xs text-slate-500">{service.serviceMode} · {service.serviceArea}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
