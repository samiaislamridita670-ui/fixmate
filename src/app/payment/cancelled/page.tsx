import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Payment Cancelled",
  description: "Your FixMate payment was cancelled — no charge was made.",
};

export default function PaymentCancelledPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-5 py-16">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white text-center shadow-sm">
        <div className="bg-slate-900 px-7 py-10 text-white">
          <span className="text-5xl" aria-hidden="true">
            🛑
          </span>
          <h1 className="mt-4 text-2xl font-black">Payment cancelled</h1>
          <p className="mt-2 text-sm text-slate-300">
            No charge was made. Your booking is still waiting for payment.
          </p>
        </div>

        <div className="p-7">
          <div className="rounded-xl bg-amber-50 p-4 text-left text-sm leading-6 text-amber-900">
            You can retry payment any time from your bookings page — completed bookings stay payable
            until settled.
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/dashboard/customer/bookings" className="btn btn-primary">
              Back to My Bookings
            </Link>
            <Link href="/services" className="btn btn-outline">
              Browse Services
            </Link>
          </div>

          <p className="mt-5 text-xs text-slate-500">
            Need help? Email{" "}
            <a href="mailto:support@fixmate.com" className="font-bold text-emerald-700">
              support@fixmate.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
