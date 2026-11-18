"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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
};

function ServiceDetailsContent() {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`http://localhost:5000/api/services/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Service not found.");
        setService(data.service);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <main className="p-20 text-center text-slate-700">Loading service...</main>;

  if (error || !service) {
    return <main className="p-20 text-center"><h1 className="text-3xl font-bold text-slate-900">Service unavailable</h1><p className="mt-3 text-slate-600">{error}</p><Link href="/services" className="mt-6 inline-block rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white">Browse Services</Link></main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12">
      <div className="mx-auto max-w-6xl">
        <Link href="/services" className="font-semibold text-emerald-700">← Back to Services</Link>
        <div className="mt-7 grid overflow-hidden rounded-3xl border bg-white shadow-sm md:grid-cols-2">
          <div className="min-h-72 bg-slate-100">
            {service.image ? <img src={service.image} alt={service.title} className="h-full max-h-[560px] w-full object-cover" /> : <div className="flex h-full items-center justify-center text-7xl">🛠️</div>}
          </div>
          <div className="p-7 md:p-10">
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">{service.category}</span>
            <h1 className="mt-6 text-3xl font-extrabold text-slate-900">{service.title}</h1>
            <p className="mt-5 leading-8 text-slate-600">{service.description}</p>
            <div className="mt-8 space-y-4 border-t pt-6 text-slate-700">
              <p>Starting price: <strong className="text-emerald-700">${service.basePrice}</strong></p>
              <p>Technician: <strong>{service.technicianName}</strong></p>
              <p>Estimated duration: <strong>{service.estimatedDuration}</strong></p>
              <p>Service mode: <strong>{service.serviceMode}</strong></p>
              <p>Service area: <strong>{service.serviceArea}</strong></p>
            </div>
            <Link href={`/booking?serviceId=${service._id}`} className="mt-9 block rounded-xl bg-emerald-600 px-6 py-4 text-center font-bold text-white hover:bg-emerald-700">Book This Service →</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ServiceDetailsPage() {
  return <Suspense fallback={<main className='p-20 text-center text-slate-600'>Loading...</main>}>
    <ServiceDetailsContent />
  </Suspense>;
}

