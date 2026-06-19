import type { Metadata } from "next";
import ActivityCalendar from "@/components/calendar/ActivityCalendar";
import { Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Activity Calendar",
  description:
    "View expense and payment activity by date for Swad Shri Nidhi Foods",
};

export default function CalendarPage() {
  return (
    <div className="page-enter space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-400">
          <Calendar size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-200">Activity Calendar</h1>
          <p className="text-sm text-slate-600">
            Dates with expenses are highlighted — click to see details
          </p>
        </div>
      </div>

      <ActivityCalendar />
    </div>
  );
}
