import type { Metadata } from "next";
import PendingTable from "@/components/pending/PendingTable";
import { Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pending Payments",
  description: "View and settle pending payments for Swad Shri Nidhi Foods",
};

export const revalidate = 0;

async function getPendingExpenses() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/pending`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function PendingPage() {
  const expenses = await getPendingExpenses();
  const totalPending = expenses.reduce(
    (sum: number, e: { amount: number }) => sum + e.amount,
    0
  );

  return (
    <div className="page-enter space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
            <Clock size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-200">Pending Payments</h1>
            <p className="text-sm text-slate-600">
              {expenses.length} bill{expenses.length !== 1 ? "s" : ""} awaiting
              settlement
            </p>
          </div>
        </div>

        {expenses.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
            <p className="text-xs text-slate-600">Total Outstanding</p>
            <p className="text-lg font-bold text-indigo-600">
              {formatCurrency(totalPending)}
            </p>
          </div>
        )}
      </div>

      <PendingTable initialExpenses={expenses} />
    </div>
  );
}
