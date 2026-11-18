"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { API_BASE } from "@/lib/api";
import { CATEGORY_META, formatMoney } from "@/lib/constants";
import type { Service } from "@/lib/types";
import { ApprovalBadge } from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/Feedback";

function ServiceDetailsContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, isPending } = authClient.useSession();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const role = String((session?.user as { role?: string } | undefined)?.role || "customer");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    fetch(`${API_BASE}/api/services/${id}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok || data?.success === false) {
          throw new Error(data?.message || "Service not found.");
        }
        if (!cancelled) setService(data.service as Service);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Service not found.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleRequestRepair() {
    if (isPending) return;
    if (!session) {
      const next = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      router.push(`/login?redirect=${encodeURIComponent(next)}`);
      return;
    }
    if (role === "customer") {
      router.push(`/booking?serviceId=${encodeURIComponent(id)}`);
      return;
    }
    // technicians and admins are blocked by the API as well
  }

  if (loading) {
    return (
      <main className="flex-1 bg-slate-50 px-5 py-16 sm:px-6">
        <PageLoader label="Loading service…" />
      </main>
    );
  }

  if (error || !service) {
    return (
      <main className="flex-1 bg-slate-50 px-5 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <span className="text-5xl" aria-hidden="true">
            🛠️
          </span>
          <h1 className="mt-5 text-2xl font-black text-slate-950">Service unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">{error}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/services" className="btn btn-primary">
              Browse Services
            </Link>
            <Link href="/" className="btn btn-outline">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const meta = CATEGORY_META[service.category];
  const isTechnicianOrAdmin = role === "technician" || role === "admin";

  return (
    <main className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6">
        <nav className="text-sm font-semibold text-slate-500" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-emerald-700">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/services" className="hover:text-emerald-700">
            Services
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800">{service.title}</span>
        </nav>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* ---------- Media ---------- */}
          <div className="card overflow-hidden self-start">
            <div className="aspect-[4/3] bg-slate-100">
              {service.image ? (
                <img
                  src={service.image}
                  alt={service.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-7xl" aria-hidden="true">
                  🔧
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="flex flex-wrap gap-2">
                <span className="chip bg-emerald-100 text-emerald-800">{service.category}</span>
                <span className="chip bg-slate-100 text-slate-700">{service.serviceMode}</span>
              </div>
              <ApprovalBadge status={service.approvalStatus} />
            </div>
          </div>

          {/* ---------- Info ---------- */}
          <div className="card card-pad self-start">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
              {meta?.icon} {service.category} repair
            </p>
            <h1 className="mt-3 text-2xl font-black leading-8 text-slate-950 sm:text-3xl">
              {service.title}
            </h1>

            <div className="mt-4 flex items-end gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Starting price
                </p>
                <p className="text-3xl font-black text-emerald-700">
                  {formatMoney(service.basePrice)}
                </p>
              </div>
              <p className="pb-1 text-xs text-slate-400">Final amount confirmed after repair</p>
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-600">{service.description}</p>

            <dl className="mt-6 grid gap-3 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Estimated duration
                </dt>
                <dd className="mt-1 font-bold text-slate-800">{service.estimatedDuration}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Service mode
                </dt>
                <dd className="mt-1 font-bold text-slate-800">{service.serviceMode}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Service area
                </dt>
                <dd className="mt-1 font-bold text-slate-800">📍 {service.serviceArea}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Availability
                </dt>
                <dd className="mt-1 font-bold text-slate-800">
                  {service.isAvailable ? "Available now" : "Currently unavailable"}
                </dd>
              </div>
            </dl>

            {/* ---------- Technician ---------- */}
            <div className="mt-6 flex items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-lg font-black text-white"
                aria-hidden="true"
              >
                {service.technicianName?.charAt(0)?.toUpperCase() || "T"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">
                  {service.technicianName}
                </p>
                <p className="truncate text-xs text-slate-500">Verified FixMate technician</p>
              </div>
              <span className="chip ml-auto bg-white text-emerald-700">✓ Approved</span>
            </div>

            {/* ---------- Actions ---------- */}
            <div className="mt-6">
              {isTechnicianOrAdmin ? (
                <div
                  className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800"
                  role="status"
                >
                  <strong className="font-black">Repair requests are for customers.</strong> Your{" "}
                  {role} account can manage services and jobs from the{" "}
                  <Link
                    href={role === "admin" ? "/dashboard/admin" : "/dashboard/technician"}
                    className="font-bold underline"
                  >
                    dashboard
                  </Link>
                  .
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestRepair}
                  disabled={isPending || !service.isAvailable}
                  className="btn btn-primary btn-lg w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {service.isAvailable ? "Request Repair →" : "Currently Unavailable"}
                </button>
              )}
              {!session && !isPending && (
                <p className="mt-3 text-center text-xs text-slate-500">
                  You will be asked to sign in before sending a request.
                </p>
              )}
              <p className="mt-3 text-center text-xs text-slate-500">
                Payment is only required after the repair is completed.
              </p>
            </div>
          </div>
        </div>

        {/* ---------- Extra content ---------- */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="card card-pad">
            <h2 className="text-base font-black text-slate-950">What happens next?</h2>
            <ol className="mt-4 space-y-4">
              {[
                "Send your repair request with the problem details and preferred date.",
                "The technician accepts or rejects the request within hours.",
                "Track status live from your customer dashboard.",
                "Pay securely online once the repair is marked completed.",
              ].map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-6 text-slate-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>

          <section className="card card-pad">
            <h2 className="text-base font-black text-slate-950">Service policy</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>• Starting price covers the standard repair; complex parts are quoted first.</li>
              <li>• Duplicate active requests for the same service are blocked.</li>
              <li>• Cancel free of charge while the request is still pending.</li>
              <li>• Completed jobs come with a 30-day service warranty.</li>
            </ul>
            <Link href="/services" className="btn btn-outline btn-sm mt-5">
              ← Back to all services
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function ServiceDetailsPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading service…" />}>
      <ServiceDetailsContent />
    </Suspense>
  );
}
