import type { Metadata } from "next";
import { BarChart2 } from "lucide-react";
import ReportsView from "@/components/reports/ReportsView";

export const metadata: Metadata = {
  title: "Reports",
  description: "Filter and analyse expenditures for Swad Shri Nidhi Foods",
};

export const revalidate = 0;

async function getCategories() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/categories`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function ReportsPage() {
  const categories = await getCategories();

  return (
    <div className="page-enter space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-400">
          <BarChart2 size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-200">Reports</h1>
          <p className="text-sm text-slate-600">Filter and analyse expenditure records</p>
        </div>
      </div>

      <ReportsView categories={categories} />
    </div>
  );
}
