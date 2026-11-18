"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Service } from "@/lib/types";
import ServiceForm, { type ServiceFormValues } from "@/components/dashboard/ServiceForm";
import { ApprovalBadge } from "@/components/ui/Badge";
import { ErrorState, PageLoader } from "@/components/ui/Feedback";
import { useToast } from "@/components/Toast";

export default function EditServicePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadService = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<{ services?: Service[] }>("/api/services/mine");
      const found = (data.services || []).find((item) => item._id === id);
      if (!found) throw new Error("Service not found in your listings.");
      setService(found);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the service.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadService();
  }, [loadService]);

  async function handleSubmit(values: ServiceFormValues) {
    setSubmitting(true);
    try {
      await api.patch(`/api/services/${id}`, {
        ...values,
        basePrice: Number(values.basePrice),
      });
      toast.success("Service updated — re-submitted for admin approval.");
      router.push("/dashboard/technician/my-services");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the service.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-56 rounded-lg" />
        <div className="skeleton h-96 w-full rounded-2xl" />
        <PageLoader label="Loading service…" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="space-y-5">
        <ErrorState title="Service not found" description={error} onRetry={loadService} />
        <div className="flex justify-center">
          <Link href="/dashboard/technician/my-services" className="btn btn-outline">
            ← Back to my services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/dashboard/technician/my-services"
            className="text-sm font-bold text-emerald-700 hover:underline"
          >
            ← Back to my services
          </Link>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Edit Service
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <ApprovalBadge status={service.approvalStatus} />
            <span className="text-sm text-slate-500">
              Saving changes resets approval to pending.
            </span>
          </div>
        </div>
      </div>

      <section className="card card-pad sm:p-7">
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <strong className="font-black">Heads up:</strong> after saving, this service will be
          hidden from the public catalog until an admin approves it again.
        </div>

        <ServiceForm
          initialValue={{
            title: service.title,
            category: service.category,
            description: service.description,
            image: service.image,
            basePrice: String(service.basePrice),
            estimatedDuration: service.estimatedDuration,
            serviceMode: service.serviceMode,
            serviceArea: service.serviceArea,
          }}
          submitLabel="Save Changes"
          submitting={submitting}
          onSubmit={handleSubmit}
          footerNote="Edits require fresh admin approval before customers can see the service."
        />
      </section>
    </div>
  );
}
