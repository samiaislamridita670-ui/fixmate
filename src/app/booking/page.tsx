"use client";

import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { API_BASE, api } from "@/lib/api";
import { formatMoney } from "@/lib/constants";
import type { Service } from "@/lib/types";
import { useToast } from "@/components/Toast";
import Button from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Feedback";

const MIN_PROBLEM_LENGTH = 20;

function BookingContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const toast = useToast();

  const requestedServiceId = searchParams.get("serviceId") || "";

  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [serviceId, setServiceId] = useState(requestedServiceId);
  // Drafts stay null until the user edits a field; the session value is used
  // as the fallback, so identity is prefilled without a set-state effect.
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [phoneDraft, setPhoneDraft] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [problem, setProblem] = useState("");
  const [formError, setFormError] = useState("");

  const sessionUser = session?.user;
  const name = nameDraft ?? sessionUser?.name ?? "";
  const email = emailDraft ?? sessionUser?.email ?? "";
  const phone = phoneDraft ?? String((sessionUser as { phone?: string } | undefined)?.phone || "");

  const role = String((sessionUser as { role?: string } | undefined)?.role || "customer");
  const isBlockedRole = role === "technician" || role === "admin";

  useEffect(() => {
    if (sessionPending) return;
    if (!session) {
      const next = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      router.replace(`/login?redirect=${encodeURIComponent(next)}`);
    }
  }, [session, sessionPending, router, pathname, searchParams]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/services?limit=100&sort=newest`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const list: Service[] = Array.isArray(data?.services) ? data.services : [];
        setServices(list);
        setServiceId((current) => {
          if (current && list.some((item) => item._id === current)) return current;
          if (requestedServiceId && list.some((item) => item._id === requestedServiceId)) {
            return requestedServiceId;
          }
          return list[0]?._id || "";
        });
      })
      .catch(() => {
        if (!cancelled) setServices([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingServices(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requestedServiceId]);

  const selectedService = useMemo(
    () => services.find((service) => service._id === serviceId),
    [services, serviceId]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!serviceId) {
      setFormError("Please choose a repair service.");
      return;
    }
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim() || !preferredDate) {
      setFormError("Please complete every required field.");
      return;
    }
    if (problem.trim().length < MIN_PROBLEM_LENGTH) {
      setFormError(
        `Please describe the problem in at least ${MIN_PROBLEM_LENGTH} characters (${problem.trim().length} entered).`
      );
      return;
    }
    if (new Date(preferredDate).getTime() <= Date.now()) {
      setFormError("Please select a future date and time.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/bookings", {
        serviceId,
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        address: address.trim(),
        preferredDate: new Date(preferredDate).toISOString(),
        problemDescription: problem.trim(),
      });

      setSubmitted(true);
      toast.success("Your repair request has been submitted!");
      setPhoneDraft(null);
      setAddress("");
      setPreferredDate("");
      setProblem("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Booking request failed.";
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (sessionPending) {
    return (
      <main className="flex-1 bg-slate-50">
        <PageLoader label="Checking your session…" />
      </main>
    );
  }

  if (!session) return null;

  if (isBlockedRole) {
    return (
      <main className="flex-1 bg-slate-50 px-5 py-16 sm:px-6">
        <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-white p-10 text-center shadow-sm">
          <span className="text-5xl" aria-hidden="true">
            🚫
          </span>
          <h1 className="mt-5 text-2xl font-black text-slate-950">Customers only</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Repair requests can only be placed by customer accounts. {role === "admin" ? "Admins" : "Technicians"} manage
            jobs from the dashboard.
          </p>
          <Link
            href={role === "admin" ? "/dashboard/admin" : "/dashboard/technician"}
            className="btn btn-primary mt-6"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-slate-50">
      <section className="bg-slate-950 px-5 py-12 text-white sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">
            Book a repair
          </p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Request a service</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Tell us what is broken and when you are available. Your technician will confirm the
            request shortly.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-10 sm:px-6">
        {submitted && (
          <div
            className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-900"
            role="status"
          >
            <strong className="font-black">Request submitted! </strong>
            Track its progress from your bookings page.
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/dashboard/customer/bookings" className="btn btn-primary btn-sm">
                View My Bookings
              </Link>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setSubmitted(false)}
              >
                Submit another request
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="card card-pad space-y-5 sm:p-8"
          noValidate
        >
          {/* Service picker */}
          <div>
            <label htmlFor="booking-service" className="label">
              Repair service *
            </label>
            {loadingServices ? (
              <div className="skeleton h-12 w-full rounded-xl" />
            ) : services.length === 0 ? (
              <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                No approved services are available right now. Please check back soon.
              </p>
            ) : (
              <select
                id="booking-service"
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
                className="input"
                required
              >
                {services.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.title} — {formatMoney(service.basePrice)} ({service.serviceMode})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedService && (
            <div className="flex items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
              {selectedService.image && (
                <img onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/image-fallback.svg"; }}
                  src={selectedService.image}
                  alt=""
                  className="h-16 w-16 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">
                  {selectedService.title}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedService.category} · {selectedService.serviceArea} ·{" "}
                  {selectedService.estimatedDuration}
                </p>
                <p className="mt-1 text-sm font-black text-emerald-700">
                  From {formatMoney(selectedService.basePrice)} · technician{" "}
                  {selectedService.technicianName}
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="booking-name" className="label">
                Full name *
              </label>
              <input
                id="booking-name"
                value={name}
                onChange={(event) => setNameDraft(event.target.value)}
                className="input"
                placeholder="Your full name"
                required
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="booking-email" className="label">
                Email address *
              </label>
              <input
                id="booking-email"
                type="email"
                value={email}
                onChange={(event) => setEmailDraft(event.target.value)}
                className="input"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="booking-phone" className="label">
                Phone number *
              </label>
              <input
                id="booking-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhoneDraft(event.target.value)}
                className="input"
                placeholder="+880 1XXXXXXXXX"
                required
                autoComplete="tel"
              />
            </div>
            <div>
              <label htmlFor="booking-date" className="label">
                Preferred date & time *
              </label>
              <input
                id="booking-date"
                type="datetime-local"
                value={preferredDate}
                onChange={(event) => setPreferredDate(event.target.value)}
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="booking-address" className="label">
              Repair address *
            </label>
            <textarea
              id="booking-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              rows={2}
              className="input"
              placeholder="House, road, area and city"
              required
            />
          </div>

          <div>
            <label htmlFor="booking-problem" className="label">
              Problem description *
            </label>
            <textarea
              id="booking-problem"
              value={problem}
              onChange={(event) => setProblem(event.target.value)}
              rows={5}
              maxLength={1000}
              className="input"
              placeholder="Explain the issue, when it started and anything the technician should know…"
              required
            />
            <p
              className={`mt-1.5 text-xs ${
                problem.trim().length >= MIN_PROBLEM_LENGTH ? "text-emerald-600" : "text-slate-500"
              }`}
            >
              {problem.trim().length}/1000 characters (minimum {MIN_PROBLEM_LENGTH})
            </p>
          </div>

          {formError && (
            <div
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
              role="alert"
            >
              {formError}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-500">
              Requests are free — payment happens only after the repair is completed.
            </p>
            <Button type="submit" loading={submitting} size="lg" disabled={!services.length}>
              {submitting ? "Submitting…" : "Confirm Booking Request"}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-emerald-600 border-t-transparent" />
            <p className="text-sm font-semibold text-slate-500">Loading booking form…</p>
          </div>
        </main>
      }
    >
      <BookingContent />
    </Suspense>
  );
}


