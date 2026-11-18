"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Service {
  _id: string;
  title: string;
  category: string;
  image: string;
  basePrice: number;
  technicianName: string;
}

export default function BookingPage() {
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/services");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Could not load services.");
        }

        const availableServices: Service[] = data.services || [];
        setServices(availableServices);

        const params = new URLSearchParams(window.location.search);
        const selectedId = params.get("serviceId");

        if (selectedId && availableServices.some((service) => service._id === selectedId)) {
          setServiceId(selectedId);
        } else if (availableServices.length > 0) {
          setServiceId(availableServices[0]._id);
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not connect to server.");
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  const selectedService = services.find((service) => service._id === serviceId);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    if (!serviceId || !customerPhone.trim() || !address.trim() || !preferredDate || problemDescription.trim().length < 20) {
      setMessage("Please complete all fields. Problem description must contain at least 20 characters.");
      return;
    }

    if (new Date(preferredDate).getTime() <= Date.now()) {
      setMessage("Please select a future date and time.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          serviceId,
          customerPhone: customerPhone.trim(),
          address: address.trim(),
          preferredDate: new Date(preferredDate).toISOString(),
          problemDescription: problemDescription.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(data.message || "Booking request failed.");
      }

      setSuccess(true);
      setMessage("Your booking request has been submitted successfully!");
      setCustomerPhone("");
      setAddress("");
      setPreferredDate("");
      setProblemDescription("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5">
        <nav className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-2xl font-black text-blue-700">
            Fix<span className="text-slate-900">Mate.</span>
          </Link>
          <Link href="/services" className="font-semibold text-slate-600 hover:text-blue-700">
            Browse Services
          </Link>
        </nav>
      </header>

      <section className="bg-slate-950 px-6 py-12 text-center text-white">
        <p className="font-bold uppercase tracking-widest text-blue-400">
          Book a Repair
        </p>
        <h1 className="mt-3 text-4xl font-black">Request a Service</h1>
        <p className="mt-3 text-slate-300">
          Tell us about your problem and schedule your repair.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <div>
            <label htmlFor="service" className="mb-2 block text-sm font-bold text-slate-800">
              Select Repair Service *
            </label>
            {loading ? (
              <p className="text-sm text-slate-500">Loading services...</p>
            ) : services.length === 0 ? (
              <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                No approved services are currently available. Please visit the services page later.
              </p>
            ) : (
              <select
                id="service"
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
                required
                className={inputClass}
              >
                {services.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.title} — ${service.basePrice}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedService && (
            <div className="flex items-center gap-4 rounded-xl bg-blue-50 p-4">
              {selectedService.image && (
                <img
                  src={selectedService.image}
                  alt={selectedService.title}
                  className="h-20 w-20 rounded-lg object-cover"
                />
              )}
              <div>
                <p className="font-bold text-slate-900">{selectedService.title}</p>
                <p className="text-sm text-slate-600">{selectedService.category}</p>
                <p className="mt-1 font-bold text-blue-700">${selectedService.basePrice}</p>
                <p className="text-sm text-slate-600">Technician: {selectedService.technicianName}</p>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-bold text-slate-800">
              Contact Phone Number *
            </label>
            <input
              id="phone"
              type="tel"
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              placeholder="Enter your phone number"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="address" className="mb-2 block text-sm font-bold text-slate-800">
              Full Repair Address *
            </label>
            <textarea
              id="address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Enter house, road, area and city"
              rows={3}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="date" className="mb-2 block text-sm font-bold text-slate-800">
              Preferred Date and Time *
            </label>
            <input
              id="date"
              type="datetime-local"
              value={preferredDate}
              onChange={(event) => setPreferredDate(event.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="problem" className="mb-2 block text-sm font-bold text-slate-800">
              Describe Your Problem *
            </label>
            <textarea
              id="problem"
              value={problemDescription}
              onChange={(event) => setProblemDescription(event.target.value)}
              placeholder="Explain the device problem in at least 20 characters..."
              rows={5}
              minLength={20}
              maxLength={1000}
              required
              className={inputClass}
            />
            <p className="mt-1 text-right text-xs text-slate-500">
              {problemDescription.length}/1000 characters (minimum 20)
            </p>
          </div>

          {message && (
            <div className={`rounded-xl p-4 text-sm font-semibold ${
              success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || submitting || services.length === 0}
            className="w-full rounded-xl bg-blue-700 px-6 py-4 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting Request..." : "Confirm Booking Request"}
          </button>

          <p className="text-center text-xs text-slate-500">
            Booking requests require customer login. Payment is available after service completion.
          </p>
        </form>
      </section>
    </main>
  );
}
