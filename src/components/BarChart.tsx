"use client";

interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  title?: string;
  data: BarDatum[];
  suffix?: string;
  emptyLabel?: string;
}

/**
 * Dependency-free horizontal bar chart used across dashboards.
 * Scales each bar against the highest value in the dataset.
 */
export default function BarChart({ title, data, suffix = "", emptyLabel = "No data yet" }: BarChartProps) {
  const max = Math.max(1, ...data.map((item) => item.value));

  return (
    <div className="card card-pad h-full">
      {title && <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">{title}</h3>}

      {data.length === 0 ? (
        <p className="mt-8 text-sm text-slate-400">{emptyLabel}</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {data.map((item) => (
            <li key={item.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">{item.label}</span>
                <span className="font-black text-slate-900">
                  {item.value}
                  {suffix}
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${item.color || "bg-emerald-500"}`}
                  style={{ width: `${Math.max(4, Math.round((item.value / max) * 100))}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
