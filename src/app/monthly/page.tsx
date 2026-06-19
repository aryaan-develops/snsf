import type { Metadata } from "next";
import MonthlyTable from "@/components/monthly/MonthlyTable";
import { CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Monthly Billing",
  description: "Manage recurring monthly bills for Swad Shri Nidhi Foods",
};

export const revalidate = 0;

async function getMonthlyExpenses() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/monthly`, { cache: "no-store" });
    if (!res.ok) return { expenses: [], grouped: {} };
    return res.json();
  } catch {
    return { expenses: [], grouped: {} };
  }
}

export default async function MonthlyPage() {
  const { expenses, grouped } = await getMonthlyExpenses();
  const totalMonthly = expenses.reduce(
    (sum: number, e: { amount: number }) => sum + e.amount,
    0
  );
  const categoryCount = Object.keys(grouped).length;

  return (
    <div className="page-enter space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-400">
            <CreditCard size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-200">Monthly Billing</h1>
            <p className="text-sm text-slate-600">
              {expenses.length} recurring bill{expenses.length !== 1 ? "s" : ""} across{" "}
              {categoryCount} categor{categoryCount !== 1 ? "ies" : "y"}
            </p>
          </div>
        </div>

        {expenses.length > 0 && (
          <div className="rounded-xl border border-indigo-600/30 bg-indigo-600/10 px-4 py-2.5">
            <p className="text-xs text-slate-600">Total Monthly</p>
            <p className="text-lg font-bold text-indigo-600">
              {formatCurrency(totalMonthly)}
            </p>
          </div>
        )}
      </div>

      <MonthlyTable grouped={grouped} />
    </div>
  );
}
