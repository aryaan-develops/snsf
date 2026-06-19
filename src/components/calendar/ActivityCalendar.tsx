"use client";

import { useState, useEffect, useCallback } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";
import { X, TrendingUp, CreditCard } from "lucide-react";

interface Activity {
  type: string;
  vendorName?: string;
  amount: number;
  billingType: string;
  modeOfPayment: string | null;
  category: string;
  billNumber: string;
}

interface DayActivity {
  date: string;
  count: number;
  activities: Activity[];
}

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function ActivityCalendar() {
  const [activities, setActivities] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [popoverData, setPopoverData] = useState<DayActivity | null>(null);
  const [value, setValue] = useState<Value>(new Date());

  useEffect(() => {
    fetch("/api/calendar")
      .then((r) => {
        if (!r.ok) throw new Error("API error");
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setActivities(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activityMap = new Map(activities.map((a) => [a.date, a]));

  const getTileContent = useCallback(
    ({ date, view }: { date: Date; view: string }) => {
      if (view !== "month") return null;
      const key = getLocalDateString(date);
      const activity = activityMap.get(key);
      if (!activity) return null;

      return (
        <div className="flex justify-center mt-0.5">
          <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
        </div>
      );
    },
    [activities] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const getTileClassName = useCallback(
    ({ date, view }: { date: Date; view: string }) => {
      if (view !== "month") return "";
      const key = getLocalDateString(date);
      if (activityMap.has(key)) return "has-activity";
      return "";
    },
    [activities] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleDateClick = (date: Date) => {
    const key = getLocalDateString(date);
    const data = activityMap.get(key) || null;
    setSelectedDate(date);
    setPopoverData(data);
    setValue(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[auto,1fr]">
      {/* Calendar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <style>{`
          .react-calendar {
            background: transparent !important;
            border: none !important;
            font-family: inherit !important;
            color: #382c24;
            width: 100%;
          }
          .react-calendar__navigation button {
            color: #5c1d24;
            font-size: 0.9rem;
            font-weight: 600;
            background: transparent;
            border-radius: 0.5rem;
            padding: 6px 10px;
          }
          .react-calendar__navigation button:hover,
          .react-calendar__navigation button:focus {
            background: #f2ebd9 !important;
            color: #5c1d24;
          }
          .react-calendar__month-view__weekdays {
            color: #806b5c;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .react-calendar__month-view__weekdays abbr {
            text-decoration: none;
          }
          .react-calendar__tile {
            background: transparent;
            color: #382c24;
            border-radius: 0.5rem;
            padding: 8px 4px;
            font-size: 0.85rem;
            transition: background 0.15s;
          }
          .react-calendar__tile:hover {
            background: #f2ebd9 !important;
            color: #231913 !important;
          }
          .react-calendar__tile--now {
            background: #faf3e8 !important;
            color: #b58c42 !important;
            font-weight: 700;
          }
          .react-calendar__tile--active,
          .react-calendar__tile--active:hover {
            background: #5c1d24 !important;
            color: white !important;
          }
          .react-calendar__tile.has-activity {
            background: rgba(181, 140, 66, 0.1) !important;
            color: #5c1d24 !important;
            border: 1px solid rgba(181, 140, 66, 0.25) !important;
          }
          .react-calendar__month-view__days__day--neighboringMonth {
            color: #a89484 !important;
          }
          .react-calendar__navigation__label {
            font-size: 1rem !important;
          }
        `}</style>
        <Calendar
          onChange={(val) => {
            setValue(val);
            if (val instanceof Date) handleDateClick(val);
          }}
          value={value}
          tileContent={getTileContent}
          tileClassName={getTileClassName}
        />

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 border-t border-slate-800 pt-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-indigo-600/20 border border-indigo-500/20" />
            Has activity
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-indigo-600" />
            Selected
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#312e81]" />
            Today
          </div>
        </div>
      </div>

      {/* Activity Panel */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        {!selectedDate ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
            <div className="mb-3 text-4xl">📅</div>
            <h3 className="font-semibold text-slate-300">Select a date</h3>
            <p className="mt-1 text-sm text-slate-500">
              Click on any highlighted date to see activities
            </p>
          </div>
        ) : !popoverData ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
            <div className="mb-3 text-4xl">🌙</div>
            <h3 className="font-semibold text-slate-300">
              {formatDate(selectedDate)}
            </h3>
            <p className="mt-1 text-sm text-slate-500">No activities on this date</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-200">
                  {formatDate(selectedDate)}
                </h3>
                <p className="text-sm text-slate-600">
                  {popoverData.count} activit{popoverData.count !== 1 ? "ies" : "y"}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedDate(null);
                  setPopoverData(null);
                }}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-800 hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {popoverData.activities.map((activity, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        activity.type === "Payment Settled"
                          ? "bg-emerald-600/10 text-emerald-600 border border-emerald-600/20"
                          : "bg-indigo-600/10 text-indigo-600 border border-indigo-600/20"
                      }`}
                    >
                      {activity.type === "Payment Settled" ? (
                        <CreditCard size={11} />
                      ) : (
                        <TrendingUp size={11} />
                      )}
                      {activity.type}
                    </span>
                    <span className="font-bold text-slate-200">
                      {formatCurrency(activity.amount)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Vendor</span>
                      <span className="text-slate-300 font-medium">{activity.vendorName || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Category</span>
                      <span className="text-slate-300">{activity.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Bill No.</span>
                      <span className="text-slate-600 font-mono">{activity.billNumber}</span>
                    </div>
                    {activity.modeOfPayment && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Mode</span>
                        <span className="text-slate-300">{activity.modeOfPayment}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
