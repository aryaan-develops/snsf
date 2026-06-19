import type { Metadata } from "next";
import EntryForm from "@/components/entry/EntryForm";
import { PlusCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "New Expense Entry",
  description: "Record a new expenditure for Swad Shri Nidhi Foods",
};

export default function EntryPage() {
  return (
    <div className="page-enter p-6 lg:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-400">
            <PlusCircle size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-200">New Expense Entry</h1>
            <p className="text-sm text-slate-600">
              Fill in the details to record a new expenditure
            </p>
          </div>
        </div>

        <EntryForm />
      </div>
    </div>
  );
}
