import type { BookingStatus, Role } from "./types";

export const SERVICE_CATEGORIES = [
  "Smartphone",
  "Laptop & PC",
  "AC",
  "Refrigerator",
  "TV",
  "Washing Machine",
  "Electrical",
] as const;

export const CATEGORY_META: Record<string, { icon: string; blurb: string }> = {
  Smartphone: { icon: "📱", blurb: "Screens, batteries & charging ports" },
  "Laptop & PC": { icon: "💻", blurb: "Hardware, OS & performance fixes" },
  AC: { icon: "❄️", blurb: "Cooling, gas refill & servicing" },
  Refrigerator: { icon: "🧊", blurb: "Cooling, thermostat & compressor" },
  TV: { icon: "📺", blurb: "Display, sound & smart TV issues" },
  "Washing Machine": { icon: "🧺", blurb: "Drum, motor & plumbing faults" },
  Electrical: { icon: "⚡", blurb: "Wiring, sockets & fixtures" },
};

export const SERVICE_MODES = ["Home Visit", "Shop Drop-off"] as const;

export const BOOKING_STATUS_META: Record<
  BookingStatus,
  { label: string; badge: string; dot: string }
> = {
  requested: { label: "Requested", badge: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  accepted: { label: "Accepted", badge: "bg-blue-100 text-blue-800", dot: "bg-blue-500" },
  "in-progress": { label: "In Progress", badge: "bg-indigo-100 text-indigo-800", dot: "bg-indigo-500" },
  completed: { label: "Completed", badge: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  rejected: { label: "Rejected", badge: "bg-red-100 text-red-800", dot: "bg-red-500" },
  cancelled: { label: "Cancelled", badge: "bg-slate-200 text-slate-700", dot: "bg-slate-500" },
};

export const APPROVAL_META: Record<string, { label: string; badge: string }> = {
  pending: { label: "Pending Approval", badge: "bg-amber-100 text-amber-800" },
  approved: { label: "Approved", badge: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Rejected", badge: "bg-red-100 text-red-800" },
};

export const ROLE_META: Record<Role, { label: string; badge: string }> = {
  customer: { label: "Customer", badge: "bg-sky-100 text-sky-800" },
  technician: { label: "Technician", badge: "bg-emerald-100 text-emerald-800" },
  admin: { label: "Admin", badge: "bg-violet-100 text-violet-800" },
};

export const DASHBOARD_HOME: Record<Role, string> = {
  customer: "/dashboard/customer",
  technician: "/dashboard/technician",
  admin: "/dashboard/admin",
};

export function dashboardPathForRole(role?: string | null): string {
  if (role === "admin") return DASHBOARD_HOME.admin;
  if (role === "technician") return DASHBOARD_HOME.technician;
  return DASHBOARD_HOME.customer;
}

export function formatMoney(amount?: number | null): string {
  const value = Number(amount ?? 0);
  return `$${value.toFixed(2).replace(/\.00$/, "")}`;
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value?: string | Date | null): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initials(name?: string | null): string {
  if (!name) return "U";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
