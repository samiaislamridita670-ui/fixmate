"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import ServiceForm, {
  EMPTY_SERVICE_FORM,
  type ServiceFormValues,
} from "@/components/dashboard/ServiceForm";
import { useToast } from "@/components/Toast";

export default function AddServicePage() {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(values: ServiceFormValues) {
    setSubmitting(true);
    try {
      await api.post("/api/services", {
        ...values,
        basePrice: Number(values.basePrice),
      });
      toast.success("Service submitted for admin approval.");
      router.push("/dashboard/technician/my-services");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the service.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
            Technician dashboard
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Add New Service
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Your name and email are copied automatically from your signed-in account.
          </p>
        </div>
        <Link href="/dashboard/technician/my-services" className="btn btn-outline">
          My Services
        </Link>
      </div>

      <section className="card card-pad sm:p-7">
        <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm leading-6 text-emerald-900">
          <strong className="font-black">Note:</strong> every new service starts as{" "}
          <strong>pending</strong> and goes live only after an admin approves it. Editing the
          service later resets its approval status.
        </div>

        <ServiceForm
          initialValue={EMPTY_SERVICE_FORM}
          submitLabel="Submit Service for Approval"
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      </section>
    </div>
  );
}
