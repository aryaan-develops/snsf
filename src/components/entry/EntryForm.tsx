"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { PlusCircle, CheckCircle, ChevronDown } from "lucide-react";
import ImageUploader from "@/components/ui/ImageUploader";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

const formSchema = z
  .object({
    categoryId: z.string().min(1, "Category is required"),
    newCategory: z.string().optional(),
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

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const PAYMENT_MODES = ["Cash", "Digital", "Cheque", "Pending"] as const;

export default function EntryForm() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [billImage, setBillImage] = useState<{ url: string; fileId: string } | null>(null);
  const [paymentProof, setPaymentProof] = useState<{ url: string; fileId: string } | null>(null);
  const [success, setSuccess] = useState(false);

  const now = new Date();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
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
  const needsProof =
    billingType === "Paid" &&
    (modeOfPayment === "Digital" || modeOfPayment === "Cheque");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => {
        if (!r.ok) throw new Error("API error");
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {
        toast.error("Could not load categories. Check your MongoDB connection.");
      });
  }, []);

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
      if (!res.ok) {
        toast.error(data.error || "Failed to add category");
        return;
      }
      setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setValue("categoryId", data._id);
      setNewCategoryName("");
      setShowNewCategory(false);
      toast.success(`Category "${data.name}" added!`);
    } catch {
      toast.error("Failed to add category");
    } finally {
      setAddingCategory(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (needsProof && !paymentProof) {
      toast.error("Payment proof image is required for Digital/Cheque payments");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: data.categoryId,
          billNumber: data.billNumber,
          billingMonth: data.billingMonth,
          billingYear: data.billingYear,
          billingType: data.billingType,
          modeOfPayment: data.billingType === "Monthly Billing" ? null : data.modeOfPayment,
          amount: parseFloat(data.amount),
          vendorName: data.vendorName || "",
          notes: data.notes,
          billImageUrl: billImage?.url,
          billImageFileId: billImage?.fileId,
          paymentProofUrl: paymentProof?.url,
          paymentProofFileId: paymentProof?.fileId,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to save expense");
        return;
      }
      setSuccess(true);
      toast.success("Expense saved successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch {
      toast.error("Failed to save expense");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-400">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">Expense recorded successfully!</span>
        </div>
      )}

      {/* Step 1: Category */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900 p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Step 1 — Category & Vendor
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Category Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">
              Category <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <select
                {...register("categoryId")}
                className={cn(
                  "w-full appearance-none rounded-xl border bg-slate-800 px-4 py-2.5 text-sm text-slate-100 outline-none transition-colors",
                  errors.categoryId
                    ? "border-rose-500 focus:border-rose-400"
                    : "border-slate-700 focus:border-indigo-500"
                )}
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
            {errors.categoryId && (
              <p className="text-xs text-rose-400">{errors.categoryId.message}</p>
            )}

            {/* Add new category */}
            {!showNewCategory ? (
              <button
                type="button"
                onClick={() => setShowNewCategory(true)}
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <PlusCircle size={13} /> Add new category
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCategory())}
                  placeholder="Category name..."
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={addingCategory}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 hover:bg-indigo-500"
                >
                  {addingCategory ? <Spinner size="sm" /> : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Vendor Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">
              Vendor Name <span className="text-slate-500 text-xs font-normal">(Optional)</span>
            </label>
            <input
              {...register("vendorName")}
              placeholder="e.g. Raj Traders"
              className={cn(
                "w-full rounded-xl border bg-slate-800 px-4 py-2.5 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500",
                errors.vendorName
                  ? "border-rose-500 focus:border-rose-400"
                  : "border-slate-700 focus:border-indigo-500"
              )}
            />
            {errors.vendorName && (
              <p className="text-xs text-rose-400">{errors.vendorName.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Step 2: Bill Details */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900 p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Step 2 — Bill Details
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Bill Number */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-sm font-medium text-slate-300">
              Bill Number <span className="text-rose-400">*</span>
            </label>
            <input
              {...register("billNumber")}
              placeholder="e.g. INV-2024-001"
              className={cn(
                "w-full rounded-xl border bg-slate-800 px-4 py-2.5 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500",
                errors.billNumber
                  ? "border-rose-500 focus:border-rose-400"
                  : "border-slate-700 focus:border-indigo-500"
              )}
            />
            {errors.billNumber && (
              <p className="text-xs text-rose-400">{errors.billNumber.message}</p>
            )}
          </div>

          {/* Month */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">Month</label>
            <div className="relative">
              <select
                {...register("billingMonth", { valueAsNumber: true })}
                className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Year */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">Year</label>
            <input
              {...register("billingYear", { valueAsNumber: true })}
              type="number"
              min={2000}
              max={2100}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Amount */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">
              Amount (₹) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">₹</span>
              <input
                {...register("amount")}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className={cn(
                  "w-full rounded-xl border bg-slate-800 pl-8 pr-4 py-2.5 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500",
                  errors.amount
                    ? "border-rose-500 focus:border-rose-400"
                    : "border-slate-700 focus:border-indigo-500"
                )}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-rose-400">{errors.amount.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">Notes</label>
            <input
              {...register("notes")}
              placeholder="Optional notes..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500 placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Billing Type */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">Billing Type</label>
          <div className="flex gap-3">
            {(["Paid", "Monthly Billing"] as const).map((type) => (
              <label
                key={type}
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                  billingType === type
                    ? "border-indigo-500 bg-indigo-600/20 text-indigo-400"
                    : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                )}
              >
                <input
                  type="radio"
                  {...register("billingType")}
                  value={type}
                  className="sr-only"
                />
                {type}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Step 3: Payment */}
      {billingType === "Paid" && (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900 p-5 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Step 3 — Payment Details
          </h3>

          {/* Mode of Payment */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Mode of Payment <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PAYMENT_MODES.map((mode) => (
                <label
                  key={mode}
                  className={cn(
                    "flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                    modeOfPayment === mode
                      ? mode === "Pending"
                        ? "border-amber-500 bg-amber-500/20 text-amber-400"
                        : "border-indigo-500 bg-indigo-600/20 text-indigo-400"
                      : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                  )}
                >
                  <input
                    type="radio"
                    {...register("modeOfPayment")}
                    value={mode}
                    className="sr-only"
                  />
                  {mode}
                </label>
              ))}
            </div>
            {errors.modeOfPayment && (
              <p className="text-xs text-rose-400">{errors.modeOfPayment.message}</p>
            )}
          </div>

          {/* Payment Proof Upload (conditional) */}
          {needsProof && (
            <ImageUploader
              id="payment-proof"
              label="Payment Proof"
              required
              folder="/swad-shri-nidhi/payment-proofs"
              currentUrl={paymentProof?.url}
              onUpload={(result) => setPaymentProof({ url: result.url, fileId: result.fileId })}
              onRemove={() => setPaymentProof(null)}
            />
          )}
        </div>
      )}

      {/* Step 4: Bill Image */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900 p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          {billingType === "Paid" ? "Step 4" : "Step 3"} — Bill Image
        </h3>
        <ImageUploader
          id="bill-image"
          label="Bill / Invoice Image"
          folder="/swad-shri-nidhi/bills"
          currentUrl={billImage?.url}
          onUpload={(result) => setBillImage({ url: result.url, fileId: result.fileId })}
          onRemove={() => setBillImage(null)}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition-all hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 active:scale-[0.98]"
      >
        {submitting ? (
          <>
            <Spinner size="sm" />
            Saving Expense...
          </>
        ) : (
          <>
            <CheckCircle size={18} />
            Save Expense
          </>
        )}
      </button>
    </form>
  );
}
