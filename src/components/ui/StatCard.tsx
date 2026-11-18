import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: "emerald" | "amber" | "blue" | "violet" | "red";
  sub?: string;
}

const accents: Record<NonNullable<StatCardProps["accent"]>, string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  blue: "bg-blue-100 text-blue-700",
  violet: "bg-violet-100 text-violet-700",
  red: "bg-red-100 text-red-700",
};

export default function StatCard({ label, value, icon, accent = "emerald", sub }: StatCardProps) {
  return (
    <div className="card card-pad flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
        {sub && <p className="mt-1.5 truncate text-xs text-slate-400">{sub}</p>}
      </div>
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ${accents[accent]}`}
        aria-hidden="true"
      >
        {icon}
      </span>
    </div>
  );
}
