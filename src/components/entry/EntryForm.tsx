"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { PlusCircle, CheckCircle, ChevronDown } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const formSchema = z
  .object({
    categoryId: z.string().min(1, "Category is required"),
    billNumber: z.string().min(1, "Bill number is required"),
    billingMonth: z.number().min(1).max(12),
    billingYear: z.number().min(2000),
    billingType: z.enum(["Paid", "Monthly Billing"]),
    modeOfPayment: z
      .enum(["Cash", "Digital", "Cheque", "Pending"])
      .optional()
      .nullable(),
    amount: z.string().min(1, "Amount is required"),
    vendorName: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.billingType === "Paid" && !data.modeOfPayment) return false;
      return true;
    },
    { message: "Mode of payment is required for Paid billing", path: ["modeOfPayment"] }
  );

type FormData = z.infer<typeof formSchema>;

interface Category {
  _id: string;
  name: string;
}

const PAYMENT_MODES = ["Cash", "Digital", "Cheque"] as const;

// Get today in Asia/Kolkata as YYYY-MM-DD
const getKolkataTodayString = () => {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// localStorage vendor memory helpers
const getVendorKey = (catId: string) => `vendors_cat_${catId}`;
const getSavedVendors = (catId: string): string[] => {
  if (typeof window === "undefined" || !catId) return [];
  try {
    const raw = localStorage.getItem(getVendorKey(catId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
};
const saveVendorForCategory = (catId: string, vendor: string) => {
  if (typeof window === "undefined" || !catId || !vendor.trim()) return;
  try {
    const existing = getSavedVendors(catId);
    const updated = Array.from(new Set([vendor.trim(), ...existing])).slice(0, 8);
    localStorage.setItem(getVendorKey(catId), JSON.stringify(updated));
  } catch {}
};

const STEP_META: Record<string, { title: string; subtitle: string }> = {
  date:          { title: "Select Date",       subtitle: "When did this expense occur?" },
  category:      { title: "Select Category",   subtitle: "What type of expense is this?" },
  vendor:        { title: "Vendor Name",        subtitle: "Select a saved vendor or type a new one" },
  billNumber:    { title: "Bill Number",        subtitle: "Enter the invoice or receipt number" },
  paymentStatus: { title: "Payment Status",    subtitle: "Has this bill been paid?" },
  amount:        { title: "Expense Amount",     subtitle: "How much did it cost?" },
  paymentMode:   { title: "Payment Mode",       subtitle: "How was the payment made?" },
  notes:         { title: "Notes",              subtitle: "Add any additional remarks (Optional)" },
  review:        { title: "Review & Submit",    subtitle: "Double-check the details before saving" },
};

export default function EntryForm() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [savedVendors, setSavedVendors] = useState<string[]>([]);

  // Wizard
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(getKolkataTodayString());
  const [dateError, setDateError] = useState<string | null>(null);

  const now = new Date();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      billingType: "Paid",
      billingMonth: now.getMonth() + 1,
      billingYear: now.getFullYear(),
      modeOfPayment: null,
    },
  });

  const billingType = watch("billingType");
  const modeOfPayment = watch("modeOfPayment");
  const categoryId = watch("categoryId");
  const vendorName = watch("vendorName");
  const billNumber = watch("billNumber");
  const amount = watch("amount");
  const notes = watch("notes");

  // Sync date → billingMonth/billingYear
  useEffect(() => {
    if (selectedDate) {
      const [year, month] = selectedDate.split("-");
      setValue("billingMonth", parseInt(month, 10));
      setValue("billingYear", parseInt(year, 10));
    }
  }, [selectedDate, setValue]);

  // Load categories
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => toast.error("Could not load categories."));
  }, []);

  // Load saved vendors when category changes
  useEffect(() => {
    setSavedVendors(categoryId ? getSavedVendors(categoryId) : []);
  }, [categoryId]);

  // Dynamic step list
  const getActiveSteps = useCallback(
    (pMode: string | null | undefined): string[] => {
      const steps = ["date", "category", "vendor", "billNumber", "paymentStatus", "amount"];
      if (pMode !== "Pending") steps.push("paymentMode");
      steps.push("notes", "review");
      return steps;
    },
    []
  );

  const activeSteps = getActiveSteps(modeOfPayment);
  const currentStepKey = activeSteps[currentStep] ?? "date";
  const progressPct = ((currentStep + 1) / activeSteps.length) * 100;

  // Per-step validation
  const isStepValid = useCallback(
    (key: string): boolean => {
      switch (key) {
        case "date":          return !!selectedDate && selectedDate <= getKolkataTodayString();
        case "category":      return !!categoryId;
        case "vendor":        return true;
        case "billNumber":    return !!billNumber?.trim();
        case "paymentStatus": return !!billingType;
        case "amount": {
          const v = parseFloat(amount);
          return !!amount && !isNaN(v) && v > 0;
        }
        case "paymentMode":   return !!modeOfPayment && PAYMENT_MODES.includes(modeOfPayment as any);
        case "notes":         return true;
        default:              return true;
      }
    },
    [selectedDate, categoryId, billNumber, billingType, amount, modeOfPayment]
  );

  const validateAndAdvance = async (): Promise<boolean> => {
    if (currentStepKey === "date") {
      if (!selectedDate) { setDateError("Date is required"); return false; }
      if (selectedDate > getKolkataTodayString()) { setDateError("Future date not allowed"); return false; }
      setDateError(null); return true;
    }
    if (currentStepKey === "category") return await trigger("categoryId");
    if (currentStepKey === "billNumber") return await trigger("billNumber");
    if (currentStepKey === "amount") return await trigger("amount");
    if (currentStepKey === "paymentMode") return await trigger("modeOfPayment");
    return true;
  };

  const handleNext = async () => {
    if (await validateAndAdvance() && currentStep < activeSteps.length - 1) {
      setCurrentStep((p) => p + 1);
    }
  };
  const handleBack = () => { if (currentStep > 0) setCurrentStep((p) => p - 1); };
  const jumpToStep = (key: string) => {
    const i = activeSteps.indexOf(key);
    if (i !== -1) setCurrentStep(i);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); if (isStepValid(currentStepKey)) handleNext(); }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setAddingCategory(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to add category"); return; }
      setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setValue("categoryId", data._id);
      setNewCategoryName("");
      setShowNewCategory(false);
      toast.success(`Category "${data.name}" added!`);
    } catch { toast.error("Failed to add category"); }
    finally { setAddingCategory(false); }
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const [year, month] = selectedDate.split("-");
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: data.categoryId,
          billNumber: data.billNumber,
          billingMonth: parseInt(month, 10),
          billingYear: parseInt(year, 10),
          billingType: data.billingType,
          modeOfPayment: data.billingType === "Monthly Billing" ? null : data.modeOfPayment,
          amount: parseFloat(data.amount),
          vendorName: data.vendorName || "",
          notes: data.notes,
        }),
      });
      const result = await res.json();
      if (!res.ok) { toast.error(result.error || "Failed to save expense"); return; }
      if (data.vendorName?.trim()) saveVendorForCategory(data.categoryId, data.vendorName.trim());
      setSuccess(true);
      toast.success("Expense saved successfully!");
      setTimeout(() => window.location.reload(), 1500);
    } catch { toast.error("Failed to save expense"); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-400">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">Expense recorded successfully!</span>
        </div>
      )}

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-600">
          <span>Step {currentStep + 1} of {activeSteps.length}</span>
          <span>{Math.round(progressPct)}% Complete</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Step card */}
      <div
        key={currentStepKey}
        className="page-enter space-y-6 rounded-2xl border border-slate-700/50 bg-slate-900 p-6 shadow-md"
      >
        {/* Header */}
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold text-slate-200">{STEP_META[currentStepKey]?.title}</h2>
          <p className="text-xs text-slate-600">{STEP_META[currentStepKey]?.subtitle}</p>
        </div>

        {/* Inputs */}
        <div className="py-1">

          {/* Date */}
          {currentStepKey === "date" && (
            <div className="space-y-2">
              <input
                type="date"
                value={selectedDate}
                max={getKolkataTodayString()}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (e.target.value <= getKolkataTodayString()) setDateError(null);
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
              />
              {dateError && <p className="text-xs font-semibold text-rose-400">{dateError}</p>}
            </div>
          )}

          {/* Category */}
          {currentStepKey === "category" && (
            <div className="space-y-3">
              <div className="relative">
                <select
                  {...register("categoryId")}
                  className={cn(
                    "w-full appearance-none rounded-xl border bg-slate-800 px-4 py-3 text-sm text-slate-100 outline-none transition-colors",
                    errors.categoryId ? "border-rose-500" : "border-slate-700 focus:border-indigo-500"
                  )}
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              {errors.categoryId && <p className="text-xs text-rose-400">{errors.categoryId.message}</p>}

              {!showNewCategory ? (
                <button type="button" onClick={() => setShowNewCategory(true)}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  <PlusCircle size={13} /> Add new category
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }}
                    placeholder="Category name..."
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-500"
                  />
                  <button type="button" onClick={handleAddCategory} disabled={addingCategory}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
                    {addingCategory ? <Spinner size="sm" /> : "Add"}
                  </button>
                  <button type="button" onClick={() => setShowNewCategory(false)}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Vendor */}
          {currentStepKey === "vendor" && (
            <div className="space-y-3">
              {savedVendors.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Previously used</p>
                  <div className="flex flex-wrap gap-2">
                    {savedVendors.map((v) => (
                      <button key={v} type="button" onClick={() => setValue("vendorName", v)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                          watch("vendorName") === v
                            ? "border-indigo-500 bg-indigo-600/10 text-indigo-400"
                            : "border-slate-700 bg-slate-850 text-slate-600 hover:border-indigo-500/50 hover:text-slate-300"
                        )}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <input
                {...register("vendorName")}
                onKeyDown={handleKeyDown}
                placeholder="Type vendor name or pick above (Optional)"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500 placeholder:text-slate-500"
              />
            </div>
          )}

          {/* Bill Number */}
          {currentStepKey === "billNumber" && (
            <div className="space-y-1.5">
              <input
                {...register("billNumber")}
                onKeyDown={handleKeyDown}
                placeholder="e.g. INV-2024-001"
                className={cn(
                  "w-full rounded-xl border bg-slate-800 px-4 py-3 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500",
                  errors.billNumber ? "border-rose-500" : "border-slate-700 focus:border-indigo-500"
                )}
              />
              {errors.billNumber && <p className="text-xs text-rose-400">{errors.billNumber.message}</p>}
            </div>
          )}

          {/* Payment Status */}
          {currentStepKey === "paymentStatus" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <button type="button"
                onClick={() => { setValue("billingType", "Paid"); if (modeOfPayment === "Pending") setValue("modeOfPayment", null); }}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5",
                  billingType === "Paid" && modeOfPayment !== "Pending"
                    ? "border-indigo-500 bg-indigo-600/10"
                    : "border-slate-700 bg-slate-850 hover:border-slate-600"
                )}>
                <span className="text-base font-bold text-slate-200">Paid</span>
                <span className="text-xs text-slate-600">The payment has already been completed.</span>
              </button>
              <button type="button"
                onClick={() => { setValue("billingType", "Paid"); setValue("modeOfPayment", "Pending"); }}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5",
                  modeOfPayment === "Pending"
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-slate-700 bg-slate-850 hover:border-slate-600"
                )}>
                <span className="text-base font-bold text-slate-200">Unpaid / Pending</span>
                <span className="text-xs text-slate-600">Outstanding dues to be settled later.</span>
              </button>
            </div>
          )}

          {/* Amount */}
          {currentStepKey === "amount" && (
            <div className="space-y-1.5">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">₹</span>
                <input
                  {...register("amount")}
                  type="number" step="0.01" min="0"
                  onKeyDown={handleKeyDown}
                  placeholder="0.00"
                  className={cn(
                    "w-full rounded-xl border bg-slate-800 pl-8 pr-4 py-3 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500",
                    errors.amount ? "border-rose-500" : "border-slate-700 focus:border-indigo-500"
                  )}
                />
              </div>
              {errors.amount && <p className="text-xs text-rose-400">{errors.amount.message}</p>}
            </div>
          )}

          {/* Payment Mode */}
          {currentStepKey === "paymentMode" && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_MODES.map((mode) => (
                  <button key={mode} type="button" onClick={() => setValue("modeOfPayment", mode)}
                    className={cn(
                      "flex items-center justify-center rounded-xl border py-4 text-sm font-semibold transition-all hover:-translate-y-0.5",
                      modeOfPayment === mode
                        ? "border-indigo-500 bg-indigo-600/10 text-indigo-400"
                        : "border-slate-700 bg-slate-850 text-slate-600 hover:border-slate-600 hover:text-slate-200"
                    )}>
                    {mode}
                  </button>
                ))}
              </div>
              {errors.modeOfPayment && <p className="text-xs text-rose-400">{errors.modeOfPayment.message}</p>}
            </div>
          )}

          {/* Notes */}
          {currentStepKey === "notes" && (
            <input
              {...register("notes")}
              onKeyDown={handleKeyDown}
              placeholder="Optional notes..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500 placeholder:text-slate-500"
            />
          )}

          {/* Review */}
          {currentStepKey === "review" && (
            <div className="divide-y divide-slate-800 text-sm">
              {[
                { label: "Date",    value: formatDate(selectedDate),    step: "date" },
                { label: "Category", value: categories.find((c) => c._id === categoryId)?.name || "—", step: "category" },
                { label: "Vendor",  value: vendorName || "—",           step: "vendor" },
                { label: "Bill No", value: <span className="font-mono">{billNumber || "—"}</span>, step: "billNumber" },
                { label: "Status",  value: modeOfPayment === "Pending"
                    ? <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs text-amber-400 font-semibold">Unpaid / Pending</span>
                    : <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs text-emerald-400 font-semibold">Paid</span>,
                  step: "paymentStatus" },
                { label: "Amount",  value: <span className="font-bold">{formatCurrency(parseFloat(amount || "0"))}</span>, step: "amount" },
                ...(modeOfPayment !== "Pending" ? [{ label: "Mode", value: modeOfPayment || "—", step: "paymentMode" }] : []),
                { label: "Notes",   value: <span className="italic">{notes || "—"}</span>, step: "notes" },
              ].map(({ label, value, step }) => (
                <div key={label} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs text-slate-600">{label}</p>
                    <p className="font-semibold text-slate-200">{value}</p>
                  </div>
                  <button type="button" onClick={() => jumpToStep(step)}
                    className="text-xs font-semibold text-indigo-500 hover:text-indigo-400">
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nav buttons */}
        <div className="flex gap-4 border-t border-slate-800/80 pt-4">
          {currentStepKey !== "review" ? (
            <>
              <button type="button" onClick={handleBack} disabled={currentStep === 0}
                className={cn(
                  "flex-1 rounded-xl border border-slate-700 py-3 text-sm font-semibold transition-colors",
                  currentStep === 0 ? "pointer-events-none opacity-50 text-slate-600" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}>
                Back
              </button>
              <button type="button" onClick={handleNext} disabled={!isStepValid(currentStepKey)}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition-all hover:from-indigo-500 hover:to-violet-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]">
                Next
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={handleBack}
                className="flex-1 rounded-xl border border-slate-700 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                Back
              </button>
              <button type="submit" disabled={submitting}
                className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition-all hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 active:scale-[0.98]">
                {submitting ? <><Spinner size="sm" /> Saving...</> : <><CheckCircle size={18} /> Save Expense</>}
              </button>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
