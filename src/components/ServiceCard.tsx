"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/constants";
import type { Service } from "@/lib/types";

interface ServiceCardProps {
  service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl">
      <div className="relative h-48 overflow-hidden bg-slate-100">
        {service.image ? (
          <img onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/image-fallback.svg"; }}
            src={service.image}
            alt={service.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl" aria-hidden="true">
            🔧
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-emerald-700 shadow-sm">
          {service.category}
        </span>
        {!service.isAvailable && (
          <span className="absolute right-3 top-3 rounded-full bg-slate-900/90 px-3 py-1 text-xs font-black text-white">
            Unavailable
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
          <span className="rounded-md bg-slate-100 px-2 py-1">{service.serviceMode}</span>
          <span className="truncate" title={service.serviceArea}>
            📍 {service.serviceArea}
          </span>
        </div>

        <h2 className="mt-3 line-clamp-2 text-lg font-black leading-6 text-slate-950">
          {service.title}
        </h2>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{service.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">👨‍🔧 {service.technicianName}</span>
          <span>⏱ {service.estimatedDuration}</span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Starting at
            </p>
            <p className="text-xl font-black text-emerald-700">{formatMoney(service.basePrice)}</p>
          </div>
          <Link href={`/services/${service._id}`} className="btn btn-dark btn-sm">
            View Details →
          </Link>
        </div>
      </div>
    </article>
  );
}


