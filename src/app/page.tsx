import type { Metadata } from "next";
import Link from "next/link";
import SummaryCards from "@/components/dashboard/SummaryCards";
import ExportButton from "@/components/dashboard/ExportButton";
import { PlusCircle, Clock, CreditCard, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Expenditure dashboard overview for Swad Shri Nidhi Foods",
};

export const revalidate = 0; // always fresh

async function getDashboardData() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/dashboard`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch dashboard data");
    return res.json();
  } catch {
    return {
      totalExpenses: 0,
      totalAmount: 0,
      pendingCount: 0,
      pendingAmount: 0,
      monthlyBillingCount: 0,
      monthlyBillingAmount: 0,
      thisMonthCount: 0,
      thisMonthAmount: 0,
      currentMonth: new Date().getMonth() + 1,
      currentYear: new Date().getFullYear(),
    };
  }
}

const quickLinks = [
  {
    href: "/entry",
    label: "New Expense",
    desc: "Record a new bill or payment",
    icon: PlusCircle,
    color: "from-indigo-500 to-violet-600",
    border: "border-indigo-500/20 hover:border-indigo-500/50",
  },
  {
    href: "/pending",
    label: "Pending Dues",
    desc: "Settle outstanding payments",
    icon: Clock,
    color: "from-amber-500 to-orange-600",
    border: "border-amber-500/20 hover:border-amber-500/50",
  },
  {
    href: "/monthly",
    label: "Monthly Billing",
    desc: "Manage recurring bills",
    icon: CreditCard,
    color: "from-violet-500 to-purple-600",
    border: "border-violet-500/20 hover:border-violet-500/50",
  },
];

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="page-enter space-y-8 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-200 lg:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Swad Shri Nidhi Foods — Financial Overview
          </p>
        </div>
        <ExportButton />
      </div>

      {/* Summary Cards */}
      <SummaryCards data={data} />

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickLinks.map(({ href, label, desc, icon: Icon, color, border }) => (
            <Link
              key={href}
              href={href}
              className={`group flex items-center justify-between rounded-2xl border bg-slate-900 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-950/20 ${border}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}
                >
                  <Icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-200">{label}</p>
                  <p className="text-xs text-slate-600">{desc}</p>
                </div>
              </div>
              <ArrowRight
                size={16}
                className="text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-slate-200"
              />
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-600">
        Swad Shri Nidhi Foods Expenditure Manager • Data secured in MongoDB
      </p>
    </div>
  );
}
