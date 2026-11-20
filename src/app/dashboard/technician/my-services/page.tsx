"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/constants";
import type { Service } from "@/lib/types";
import { ApprovalBadge, Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/Toast";

export default function MyServicesPage() {
  const toast = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Loader touches state only inside promise callbacks, so the effect never
  // sets state synchronously (react-hooks/set-state-in-effect).
  // Loading starts as true for the initial fetch.
  const loadServices = useCallback(
    () =>
      api
        .get<{ services?: Service[] }>("/api/services/mine")
        .then((data) => {
          setServices(data.services || []);
          setError("");
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Could not load your services.");
        })
        .finally(() => {
          setLoading(false);
        }),
    []
  );

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  async function toggleAvailability(service: Service) {
    setBusyId(service._id);
    try {
      const data = await api.patch<{ service?: Service }>(
        `/api/services/${service._id}/availability`
      );
      setServices((current) =>
        current.map((item) =>
          item._id === service._id
            ? { ...item, isAvailable: data?.service?.isAvailable ?? !item.isAvailable }
            : item
        )
      );
      toast.success(
        data?.service?.isAvailable === false
          ? "Service marked unavailable."
          : "Service is now available."
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update availability.");
    } finally {
      setBusyId("");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/services/${deleteTarget._id}`);
      toast.success("Service deleted.");
      setDeleteTarget(null);
      await loadServices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the service.");
    } finally {
      setDeleting(false);
    }
  }

  const approved = services.filter((s) => s.approvalStatus === "approved").length;
  const pending = services.filter((s) => s.approvalStatus === "pending").length;
  const rejected = services.filter((s) => s.approvalStatus === "rejected").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
            Technician dashboard
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            My Services
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {services.length} service{services.length === 1 ? "" : "s"} · {approved} approved ·{" "}
            {pending} pending{rejected ? ` · ${rejected} rejected` : ""}
          </p>
        </div>
        <Link href="/dashboard/technician/add-service" className="btn btn-primary">
          + Add Service
        </Link>
      </div>

      {error && (
        <ErrorState
          description={error}
          onRetry={() => {
            setError("");
            setLoading(true);
            void loadServices();
          }}
        />
      )}

      {loading ? (
        <div className="card p-2">
          <TableSkeleton rows={4} />
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          icon="🧰"
          title="You haven't published any services yet"
          description="Create a service listing with an image, price and description. The admin team reviews every submission."
          actionLabel="Add your first service"
          actionHref="/dashboard/technician/add-service"
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {services.map((service) => (
            <article key={service._id} className="card overflow-hidden">
              <div className="relative h-40 bg-slate-100">
                {service.image ? (
                  <img onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/image-fallback.svg"; }} src={service.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">🔧</div>
                )}
                <span className="absolute right-3 top-3">
                  <ApprovalBadge status={service.approvalStatus} />
                </span>
                <span className="absolute left-3 top-3">
                  <Badge
                    className={
                      service.isAvailable
                        ? "bg-white/95 text-emerald-700"
                        : "bg-slate-900/90 text-white"
                    }
                  >
                    {service.isAvailable ? "Available" : "Unavailable"}
                  </Badge>
                </span>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-black leading-6 text-slate-950">
                    {service.title}
                  </h2>
                  <p className="shrink-0 text-lg font-black text-emerald-700">
                    {formatMoney(service.basePrice)}
                  </p>
                </div>
                <p className="mt-1.5 text-xs font-semibold text-slate-500">
                  {service.category} · {service.serviceMode} · {service.serviceArea}
                </p>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                  {service.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <Link
                    href={`/dashboard/technician/my-services/edit/${service._id}`}
                    className="btn btn-dark btn-sm"
                  >
                    Edit
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    loading={busyId === service._id}
                    onClick={() => toggleAvailability(service)}
                  >
                    {service.isAvailable ? "Make unavailable" : "Make available"}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteTarget(service)}>
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        danger
        title="Delete this service?"
        message={`“${deleteTarget?.title}” will be permanently removed. Existing bookings keep their records, but customers will no longer see this service.`}
        confirmLabel="Delete service"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

