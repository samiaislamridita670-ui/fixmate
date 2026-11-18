import type { ReactNode } from "react";
import {
  APPROVAL_META,
  BOOKING_STATUS_META,
  ROLE_META,
} from "@/lib/constants";
import type { ApprovalStatus, BookingStatus, Role } from "@/lib/types";

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, className = "" }: BadgeProps) {
  return <span className={`chip ${className}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: BookingStatus | string }) {
  const meta = BOOKING_STATUS_META[status as BookingStatus];
  if (!meta) return <Badge className="bg-slate-100 text-slate-700">{status}</Badge>;
  return (
    <span className={`chip ${meta.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function PaymentBadge({ paid }: { paid: boolean }) {
  return paid ? (
    <Badge className="bg-emerald-100 text-emerald-800">Paid</Badge>
  ) : (
    <Badge className="bg-amber-100 text-amber-800">Unpaid</Badge>
  );
}

export function ApprovalBadge({ status }: { status: ApprovalStatus | string }) {
  const meta = APPROVAL_META[status];
  if (!meta) return <Badge className="bg-slate-100 text-slate-700">{status}</Badge>;
  return <Badge className={meta.badge}>{meta.label}</Badge>;
}

export function RoleBadge({ role }: { role: Role | string }) {
  const meta = ROLE_META[role as Role];
  if (!meta) return <Badge className="bg-slate-100 text-slate-700">{role}</Badge>;
  return <Badge className={meta.badge}>{meta.label}</Badge>;
}
