import Link from "next/link";
import type { ReactNode } from "react";

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`${className} inline-block animate-spin rounded-full border-2 border-emerald-600 border-t-transparent`}
    />
  );
}

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Spinner className="h-8 w-8" />
      <p className="text-sm font-semibold">{label}</p>
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "🔧",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 text-center">
      <span className="text-4xl" aria-hidden="true">
        {icon}
      </span>
      <h3 className="mt-4 text-base font-black text-slate-900">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn btn-primary btn-sm mt-5">
          {actionLabel}
        </Link>
      )}
      {actionLabel && !actionHref && onAction && (
        <button type="button" onClick={onAction} className="btn btn-primary btn-sm mt-5">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
      <span className="text-4xl" aria-hidden="true">
        ⚠️
      </span>
      <h3 className="mt-4 text-base font-black text-red-800">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-6 text-red-600">{description}</p>
      )}
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-outline btn-sm mt-5">
          Try again
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} aria-hidden="true" />;
}

export function ServiceCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-3">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card card-pad">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-4 h-9 w-16" />
      <Skeleton className="mt-3 h-3 w-36" />
    </div>
  );
}
