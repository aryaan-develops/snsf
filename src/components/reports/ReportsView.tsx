"use client";

import { useState, useCallback, useEffect } from "react";
import { cn, formatCurrency, formatDate, getMonthName } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";
import {
  ChevronDown,
  SlidersHorizontal,
  RotateCcw,
  X,
  ZoomIn,
  ImageOff,
  Receipt,
  ShieldCheck,
} from "lucide-react";

interface Category {
  _id: string;
  name: string;
}

interface Expense {
  _id: string;
  category: { name: string } | string;
  billNumber: string;
  billingMonth: number;
  billingYear: number;
  billingType: string;
  modeOfPayment: string | null;
  amount: number;
  vendorName?: string;
  notes?: string;
  billImageUrl?: string;
  paymentProofUrl?: string;
  settledAt?: string | null;
  createdAt: string;
}

interface ReportsViewProps {
  categories: Category[];
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

type StatusFilter = "all" | "paid" | "unpaid";
type Screen = "filters" | "results";

const STEP_META = [
  { key: "month",    title: "Month, Year & Date",  subtitle: "Choose the period — optionally narrow to a specific day" },
  { key: "category", title: "Category",             subtitle: "Filter by expense category (optional)" },
  { key: "vendor",   title: "Vendor",               subtitle: "Filter by vendor name (optional)" },
];

// ─── Image lightbox sub-component ────────────────────────────────────────────
function ImageLightbox({
  src,
  label,
  onClose,
}: {
  src: string;
  label: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div className="relative max-h-full max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-700 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <img
          src={src}
          alt={label}
          className="max-h-[80vh] w-full rounded-2xl object-contain shadow-2xl"
        />
      </div>
    </div>
  );
}

// ─── Expense detail modal ─────────────────────────────────────────────────────
function ExpenseModal({
  expense,
  catName,
  onClose,
}: {
  expense: Expense;
  catName: string;
  onClose: () => void;
}) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxLabel, setLightboxLabel] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !lightboxSrc) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, lightboxSrc]);

  const openLightbox = (src: string, label: string) => {
    setLightboxSrc(src);
    setLightboxLabel(label);
  };

  const isPaid = expense.modeOfPayment !== "Pending" && expense.modeOfPayment !== null;

  const rows = [
    { label: "Date",         value: formatDate(expense.createdAt) },
    { label: "Category",     value: catName },
    { label: "Vendor",       value: expense.vendorName || "—" },
    { label: "Bill No.",     value: <span className="font-mono">{expense.billNumber}</span> },
    { label: "Amount",       value: <span className="font-bold text-indigo-400">{formatCurrency(expense.amount)}</span> },
    { label: "Mode",         value: expense.modeOfPayment || "—" },
    ...(expense.notes ? [{ label: "Notes", value: expense.notes }] : []),
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl shadow-black/60 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold",
                isPaid
                  ? "bg-emerald-600/10 border border-emerald-600/20 text-emerald-400"
                  : "bg-amber-600/10 border border-amber-600/20 text-amber-400"
              )}>
                {isPaid ? "✓" : "⏳"}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">{expense.vendorName || catName}</p>
                <p className="text-xs text-slate-600">{formatDate(expense.createdAt)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-slate-700 p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Details */}
          <div className="px-6 py-2">
            <div className="divide-y divide-slate-800/80">
              {rows.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-3">
                  <span className="text-xs text-slate-600">{label}</span>
                  <span className="text-sm font-medium text-slate-300">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Image section */}
          <div className="grid grid-cols-2 gap-3 border-t border-slate-800 px-6 py-4">
            {/* Bill Image */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Receipt size={12} className="text-slate-600" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Bill Image</span>
              </div>
              {expense.billImageUrl ? (
                <button
                  type="button"
                  onClick={() => openLightbox(expense.billImageUrl!, "Bill / Invoice")}
                  className="group relative w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-900 aspect-[4/3] hover:border-indigo-500/50 transition-all"
                >
                  <img
                    src={expense.billImageUrl}
                    alt="Bill"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all">
                    <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                  </div>
                </button>
              ) : (
                <div className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900 gap-1.5">
                  <ImageOff size={20} className="text-slate-700" />
                  <span className="text-xs text-slate-700">Not uploaded</span>
                </div>
              )}
            </div>

            {/* Payment Proof */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-slate-600" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Payment Proof</span>
              </div>
              {expense.paymentProofUrl ? (
                <button
                  type="button"
                  onClick={() => openLightbox(expense.paymentProofUrl!, "Payment Proof")}
                  className="group relative w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-900 aspect-[4/3] hover:border-indigo-500/50 transition-all"
                >
                  <img
                    src={expense.paymentProofUrl}
                    alt="Payment Proof"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all">
                    <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                  </div>
                </button>
              ) : (
                <div className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900 gap-1.5">
                  <ImageOff size={20} className="text-slate-700" />
                  <span className="text-xs text-slate-700">Not uploaded</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inner lightbox */}
      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          label={lightboxLabel}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ReportsView({ categories }: ReportsViewProps) {
  const now = new Date();

  // Filter state
  const [filterMonth, setFilterMonth] = useState<number>(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(now.getFullYear());
  const [filterDate, setFilterDate] = useState<string>("");   // YYYY-MM-DD specific day (optional)
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterVendor, setFilterVendor] = useState<string>("");

  // Wizard step (0-2)
  const [wizardStep, setWizardStep] = useState(0);
  const [screen, setScreen] = useState<Screen>("filters");

  // Results
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Selected expense for modal
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Applied (frozen at search time) filters
  const [appliedFilters, setAppliedFilters] = useState<{
    month: number; year: number; date: string; category: string; vendor: string;
  } | null>(null);

  const fetchResults = useCallback(async (
    month: number, year: number, date: string, category: string, vendor: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ month: String(month), year: String(year), limit: "500" });
      if (category) params.set("category", category);
      if (vendor.trim()) params.set("vendorName", vendor.trim());

      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setExpenses(data.expenses ?? []);
      setTotal(data.total ?? 0);
      setAppliedFilters({ month, year, date, category, vendor });
    } catch {
      setError("Could not load expenses. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleShowReport = async () => {
    setScreen("results");
    setStatusFilter("all");
    await fetchResults(filterMonth, filterYear, filterDate, filterCategory, filterVendor);
  };

  const handleEditFilters = () => { setScreen("filters"); setWizardStep(0); };

  // Client-side filters (status + optional specific date)
  const filteredExpenses = expenses.filter((e) => {
    // Status filter
    if (statusFilter === "paid" && (e.modeOfPayment === "Pending" || e.modeOfPayment === null)) return false;
    if (statusFilter === "unpaid" && e.modeOfPayment !== "Pending" && e.modeOfPayment !== null) return false;
    // Specific date filter (client-side, match createdAt date portion)
    if (appliedFilters?.date) {
      const expDate = new Date(e.createdAt).toISOString().slice(0, 10);
      if (expDate !== appliedFilters.date) return false;
    }
    return true;
  });

  const filteredTotal = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const progressPct = ((wizardStep + 1) / STEP_META.length) * 100;
  const currentMeta = STEP_META[wizardStep];

  const catName = (exp: Expense) =>
    typeof exp.category === "object" && exp.category !== null && "name" in exp.category
      ? exp.category.name : "Unknown";

  // Max date string for today (IST-safe)
  const todayStr = (() => {
    const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  // Enforce date picker range = selected month+year
  const minDate = `${filterYear}-${String(filterMonth).padStart(2, "0")}-01`;
  const maxDateForMonth = (() => {
    const d = new Date(filterYear, filterMonth, 0); // last day of month
    const s = `${filterYear}-${String(filterMonth).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return s < todayStr ? s : todayStr;
  })();

  // ─── FILTER WIZARD ──────────────────────────────────────────────────────────
  if (screen === "filters") {
    return (
      <div className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-600">
            <span>Step {wizardStep + 1} of {STEP_META.length}</span>
            <span>{Math.round(progressPct)}% Set</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Wizard card */}
        <div
          key={currentMeta.key}
          className="page-enter space-y-6 rounded-2xl border border-slate-700/50 bg-slate-900 p-6 shadow-md"
        >
          <div>
            <h2 className="text-lg font-bold text-slate-200">{currentMeta.title}</h2>
            <p className="text-xs text-slate-600">{currentMeta.subtitle}</p>
          </div>

          <div className="py-1 space-y-4">
            {/* Step 0: Month + Year + optional specific date */}
            {wizardStep === 0 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Month</label>
                    <div className="relative">
                      <select
                        value={filterMonth}
                        onChange={(e) => { setFilterMonth(parseInt(e.target.value)); setFilterDate(""); }}
                        className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
                      >
                        {MONTHS.map((m, i) => (
                          <option key={m} value={i + 1}>{m}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Year</label>
                    <div className="relative">
                      <select
                        value={filterYear}
                        onChange={(e) => { setFilterYear(parseInt(e.target.value)); setFilterDate(""); }}
                        className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
                      >
                        {YEARS.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Optional specific date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Specific Date <span className="normal-case text-slate-700 font-normal">(optional — leave blank for full month)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={filterDate}
                      min={minDate}
                      max={maxDateForMonth}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500 [color-scheme:dark]"
                    />
                  </div>
                  {filterDate && (
                    <button
                      type="button"
                      onClick={() => setFilterDate("")}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <RotateCcw size={11} /> Clear specific date
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Step 1: Category */}
            {wizardStep === 1 && (
              <div className="space-y-2">
                <div className="relative">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
                  >
                    <option value="">All categories</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                {filterCategory && (
                  <button type="button" onClick={() => setFilterCategory("")}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-400 transition-colors">
                    <RotateCcw size={11} /> Clear category
                  </button>
                )}
              </div>
            )}

            {/* Step 2: Vendor */}
            {wizardStep === 2 && (
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={filterVendor}
                  onChange={(e) => setFilterVendor(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleShowReport(); }}
                  placeholder="e.g. Raj Traders (leave blank for all)"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500 placeholder:text-slate-500"
                />
                {filterVendor && (
                  <button type="button" onClick={() => setFilterVendor("")}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-400 transition-colors">
                    <RotateCcw size={11} /> Clear vendor
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Nav buttons */}
          <div className="flex gap-4 border-t border-slate-800/80 pt-4">
            {wizardStep === 2 ? (
              <>
                <button type="button" onClick={() => setWizardStep((p) => p - 1)}
                  className="flex-1 rounded-xl border border-slate-700 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                  Back
                </button>
                <button type="button" onClick={handleShowReport}
                  className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] transition-all">
                  <SlidersHorizontal size={16} /> Show Report
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setWizardStep((p) => p - 1)} disabled={wizardStep === 0}
                  className={cn(
                    "flex-1 rounded-xl border border-slate-700 py-3 text-sm font-semibold transition-colors",
                    wizardStep === 0 ? "pointer-events-none opacity-50 text-slate-600" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}>
                  Back
                </button>
                <button type="button" onClick={() => setWizardStep((p) => p + 1)}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] transition-all">
                  Next
                </button>
              </>
            )}
          </div>
        </div>

        {appliedFilters && (
          <p className="text-center text-xs text-slate-600">
            Last report: {getMonthName(appliedFilters.month)} {appliedFilters.year}
            {appliedFilters.date ? ` · ${formatDate(appliedFilters.date)}` : ""}
            {appliedFilters.category ? ` · ${categories.find(c => c._id === appliedFilters.category)?.name}` : ""}
            {appliedFilters.vendor ? ` · "${appliedFilters.vendor}"` : ""}
          </p>
        )}
      </div>
    );
  }

  // ─── RESULTS SCREEN ─────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-6">
        {/* Active filter chips + Edit button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2 flex-1">
            {appliedFilters && (
              <>
                <span className="rounded-full border border-indigo-500/30 bg-indigo-600/10 px-3 py-1 text-xs font-semibold text-indigo-400">
                  {getMonthName(appliedFilters.month)} {appliedFilters.year}
                </span>
                {appliedFilters.date && (
                  <span className="rounded-full border border-violet-500/30 bg-violet-600/10 px-3 py-1 text-xs font-semibold text-violet-400">
                    {formatDate(appliedFilters.date)}
                  </span>
                )}
                {appliedFilters.category && (
                  <span className="rounded-full border border-slate-700 bg-slate-850 px-3 py-1 text-xs font-medium text-slate-400">
                    {categories.find(c => c._id === appliedFilters.category)?.name}
                  </span>
                )}
                {appliedFilters.vendor && (
                  <span className="rounded-full border border-slate-700 bg-slate-850 px-3 py-1 text-xs font-medium text-slate-400">
                    "{appliedFilters.vendor}"
                  </span>
                )}
              </>
            )}
          </div>
          <button type="button" onClick={handleEditFilters}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-400 hover:border-indigo-500/40 hover:bg-slate-800 hover:text-slate-200 transition-all">
            <SlidersHorizontal size={13} /> Edit Filters
          </button>
        </div>

        {/* Status toggle */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-850 p-1 w-fit">
          {([
            { key: "all",    label: "All" },
            { key: "paid",   label: "Paid" },
            { key: "unpaid", label: "Unpaid" },
          ] as { key: StatusFilter; label: string }[]).map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setStatusFilter(key)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all",
                statusFilter === key ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-200"
              )}>
              {label}
            </button>
          ))}
        </div>

        {/* Summary cards */}
        {!loading && filteredExpenses.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-700/50 bg-slate-900 p-4">
              <p className="text-xs text-slate-600">Showing</p>
              <p className="text-lg font-bold text-slate-200">
                {filteredExpenses.length} <span className="text-sm font-normal text-slate-600">entries</span>
              </p>
            </div>
            <div className="rounded-xl border border-indigo-600/20 bg-indigo-600/5 p-4">
              <p className="text-xs text-slate-600">Total Amount</p>
              <p className="text-lg font-bold text-indigo-600">{formatCurrency(filteredTotal)}</p>
            </div>
            {statusFilter === "all" && total > expenses.length && (
              <div className="rounded-xl border border-slate-700/50 bg-slate-900 p-4">
                <p className="text-xs text-slate-600">In DB</p>
                <p className="text-lg font-bold text-slate-200">{total}</p>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-4 text-sm text-rose-400">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredExpenses.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800">
              <SlidersHorizontal size={24} className="text-slate-600" />
            </div>
            <h3 className="font-semibold text-slate-300">No expenses found</h3>
            <p className="mt-1 text-sm text-slate-600">Try adjusting your filters or changing the period.</p>
            <button type="button" onClick={handleEditFilters}
              className="mt-4 rounded-xl border border-indigo-500/30 px-4 py-2 text-xs font-semibold text-indigo-400 hover:bg-indigo-600/10 transition-colors">
              Edit Filters
            </button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && filteredExpenses.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-950/30">
                    {["Date", "Category", "Vendor", "Bill No.", "Amount", "Mode", "Status", "Notes", "Docs"].map((h) => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredExpenses.map((exp) => {
                    const hasDocs = !!(exp.billImageUrl || exp.paymentProofUrl);
                    return (
                      <tr
                        key={exp._id}
                        onClick={() => setSelectedExpense(exp)}
                        className="cursor-pointer transition-colors hover:bg-slate-800/60 active:bg-slate-800"
                        title="Click to view details & documents"
                      >
                        <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{formatDate(exp.createdAt)}</td>
                        <td className="px-4 py-3.5">
                          <span className="rounded-md border border-slate-700/50 bg-slate-850 px-2.5 py-1 text-xs font-medium text-slate-300">
                            {catName(exp)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-200">{exp.vendorName || "—"}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{exp.billNumber}</td>
                        <td className="px-4 py-3.5 font-bold text-slate-100">{formatCurrency(exp.amount)}</td>
                        <td className="px-4 py-3.5 text-slate-400">{exp.modeOfPayment || "—"}</td>
                        <td className="px-4 py-3.5">
                          {exp.modeOfPayment === "Pending" || exp.modeOfPayment === null ? (
                            <span className="rounded-full border border-amber-600/30 bg-amber-600/10 px-2.5 py-1 text-xs font-medium text-amber-600">Unpaid</span>
                          ) : (
                            <span className="rounded-full border border-emerald-600/30 bg-emerald-600/10 px-2.5 py-1 text-xs font-medium text-emerald-600">Paid</span>
                          )}
                        </td>
                        <td className="max-w-[140px] truncate px-4 py-3.5 text-xs italic text-slate-600">{exp.notes || "—"}</td>
                        <td className="px-4 py-3.5">
                          {hasDocs ? (
                            <div className="flex gap-1">
                              {exp.billImageUrl && (
                                <span className="rounded-md bg-indigo-600/10 border border-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-500">
                                  Bill
                                </span>
                              )}
                              {exp.paymentProofUrl && (
                                <span className="rounded-md bg-violet-600/10 border border-violet-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-violet-500">
                                  Proof
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-700">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-700 bg-slate-950/20 px-5 py-3">
              <span className="text-xs text-slate-600">
                {filteredExpenses.length} record{filteredExpenses.length !== 1 ? "s" : ""}
                {" · "}
                <span className="text-slate-700 italic">Click any row to view documents</span>
              </span>
              <span className="text-sm font-bold text-indigo-600">{formatCurrency(filteredTotal)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Expense detail modal */}
      {selectedExpense && (
        <ExpenseModal
          expense={selectedExpense}
          catName={catName(selectedExpense)}
          onClose={() => setSelectedExpense(null)}
        />
      )}
    </>
  );
}
