"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/constants";
import type { ApprovalStatus, Service } from "@/lib/types";
import { ApprovalBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/Toast";

/** Focused pending-approval queue (subset of Manage Services). */
export default function AdminApprovalsPage() {
  const toast = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [target, setTarget] = useState<{ service: Service; status: ApprovalStatus } | null>(null);
  const [saving, setSaving] = useState(false);

  // Loader touches state only inside promise callbacks, so the effect never
  // sets state synchronously (react-hooks/set-state-in-effect).
  const loadPending = useCallback(
    () =>
      api
        .get<{ services?: Service[] }>("/api/services/admin/pending")
        .then((data) => {
          setServices(data.services || []);
          setError("");
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Could not load pending services.");
        })
        .finally(() => {
          setLoading(false);
        }),
    []
  );

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  async function confirmDecision() {
    if (!target) return;
    setSaving(true);
    setBusyId(target.service._id);
    try {
      await api.patch(`/api/services/${target.service._id}/approval`, {
        approvalStatus: target.status,
      });
      setServices((current) => current.filter((item) => item._id !== target.service._id));
      toast.success(`“${target.service.title}” ${target.status}.`);
      setTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the service.");
    } finally {
      setSaving(false);
      setBusyId("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
            Admin dashboard
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Service Approvals
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {services.length} service{services.length === 1 ? "" : "s"} waiting for review.
          </p>
        </div>
        <Link href="/dashboard/admin/services" className="btn btn-outline">
          All Services
        </Link>
      </div>

      {error && (
        <ErrorState
          description={error}
          onRetry={() => {
            setError("");
            setLoading(true);
            void loadPending();
          }}
        />
      )}

      {loading ? (
        <div className="card p-2">
          <TableSkeleton rows={4} />
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          icon="✅"
          title="Approval queue is clear"
          description="Every submitted service has been reviewed. New submissions will appear here."
          actionLabel="View all services"
          actionHref="/dashboard/admin/services"
        />
      ) : (
        <div className="space-y-5">
          {services.map((service) => (
            <article key={service._id} className="card overflow-hidden">
              <div className="grid gap-5 p-5 md:grid-cols-[220px_1fr]">
                <div className="h-40 overflow-hidden rounded-xl bg-slate-100 md:h-full">
                  {service.image ? (
                    <img src={service.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">🔧</div>
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-slate-950">{service.title}</h2>
                      <p className="mt-1 text-sm font-semibold text-emerald-700">
                        {service.category}
                      </p>
                    </div>
                    <ApprovalBadge status={service.approvalStatus} />
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-600">{service.description}</p>

                  <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                    <p>
                      <strong>Technician:</strong> {service.technicianName}
                    </p>
                    <p>
                      <strong>Email:</strong> {service.technicianEmail}
                    </p>
                    <p>
                      <strong>Base price:</strong> {formatMoney(service.basePrice)}
                    </p>
                    <p>
                      <strong>Duration:</strong> {service.estimatedDuration}
                    </p>
                    <p>
                      <strong>Mode:</strong> {service.serviceMode}
                    </p>
                    <p>
                      <strong>Area:</strong> {service.serviceArea}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button
                      size="sm"
                      loading={saving && busyId === service._id}
                      onClick={() => setTarget({ service, status: "approved" })}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setTarget({ service, status: "rejected" })}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!target}
        danger={target?.status === "rejected"}
        title={target?.status === "approved" ? "Approve this service?" : "Reject this service?"}
        message={
          target?.status === "approved"
            ? `“${target?.service.title}” will become visible in the public marketplace.`
            : `“${target?.service.title}” will be hidden and the technician notified. You can approve it later.`
        }
        confirmLabel={target?.status === "approved" ? "Approve service" : "Reject service"}
        busy={saving}
        onConfirm={confirmDecision}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
