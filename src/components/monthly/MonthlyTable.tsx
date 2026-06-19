"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import ImageUploader from "@/components/ui/ImageUploader";
import { Spinner } from "@/components/ui/Spinner";
import { cn, formatCurrency, formatDate, getMonthName } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Expense {
  _id: string;
  category: { name: string } | string;
  billNumber: string;
  vendorName?: string;
  amount: number;
  billingMonth: number;
  billingYear: number;
  modeOfPayment: string | null;
  billingType: string;
  createdAt: string;
}

const PAYMENT_MODES = ["Cash", "Digital", "Cheque"] as const;
type PayMode = typeof PAYMENT_MODES[number];

interface PayNowModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onPaid: (id: string) => void;
}

function PayNowModal({ expense, isOpen, onClose, onPaid }: PayNowModalProps) {
  const [mode, setMode] = useState<PayMode | "">("");
  const [proof, setProof] = useState<{ url: string; fileId: string } | null>(null);
  const [paying, setPaying] = useState(false);

  const needsProof = mode === "Digital" || mode === "Cheque";

  const handlePay = async () => {
    if (!expense || !mode) return;
    if (needsProof && !proof) {
      toast.error("Payment proof is required");
      return;
    }
    setPaying(true);
    try {
      const res = await fetch(`/api/expenses/${expense._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modeOfPayment: mode,
          paymentProofUrl: proof?.url,
          paymentProofFileId: proof?.fileId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Payment failed");
        return;
      }
      toast.success("Payment recorded!");
      onPaid(expense._id);
      onClose();
      setMode("");
      setProof(null);
    } catch {
      toast.error("Payment failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pay Now" size="md">
      {expense && (
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Vendor</span>
              <span className="font-medium text-slate-100">{expense.vendorName || "-"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Period</span>
              <span className="text-slate-300">
                {getMonthName(expense.billingMonth)} {expense.billingYear}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Amount Due</span>
              <span className="text-emerald-600 font-bold text-base">
                {formatCurrency(expense.amount)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-300">Payment Mode</p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-xl border py-2.5 text-sm font-medium transition-all",
                    mode === m
                      ? "border-indigo-600 bg-indigo-600/10 text-indigo-600"
                      : "border-slate-700 bg-slate-850 text-slate-600 hover:border-slate-600 hover:bg-slate-800 hover:text-slate-200"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {needsProof && (
            <ImageUploader
              id="pay-proof"
              label="Payment Proof"
              required
              folder="/swad-shri-nidhi/payment-proofs"
              currentUrl={proof?.url}
              onUpload={(r) => setProof({ url: r.url, fileId: r.fileId })}
              onRemove={() => setProof(null)}
            />
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm text-slate-600 hover:border-slate-600 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePay}
              disabled={!mode || paying || (needsProof && !proof)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {paying ? <Spinner size="sm" /> : null}
              {paying ? "Processing..." : "Confirm Payment"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

interface GroupedExpenses {
  [category: string]: Expense[];
}

interface MonthlyTableProps {
  grouped: GroupedExpenses;
}

export default function MonthlyTable({ grouped }: MonthlyTableProps) {
  const [expenses, setExpenses] = useState(grouped);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    Object.keys(grouped).reduce((acc, k) => ({ ...acc, [k]: true }), {})
  );

  const handlePaid = (id: string) => {
    setExpenses((prev) => {
      const updated = { ...prev };
      for (const cat of Object.keys(updated)) {
        updated[cat] = updated[cat].filter((e) => e._id !== id);
        if (updated[cat].length === 0) delete updated[cat];
      }
      return updated;
    });
  };

  const toggleGroup = (cat: string) => {
    setExpenses((prev) => prev); // prevent stale closure
    setExpandedGroups((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const categories = Object.keys(expenses);

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/10">
          <span className="text-3xl">📋</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-200">No Monthly Bills</h3>
        <p className="mt-1 text-sm text-slate-600">
          All monthly bills have been paid or none exist yet.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {categories.map((cat) => {
          const catExpenses = expenses[cat];
          const total = catExpenses.reduce((s, e) => s + e.amount, 0);
          const isExpanded = expandedGroups[cat];

          return (
            <div
              key={cat}
              className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900"
            >
              {/* Group Header */}
              <button
                type="button"
                onClick={() => toggleGroup(cat)}
                className="flex w-full items-center justify-between border-b border-slate-700/0 bg-slate-950/30 px-5 py-4 text-left transition-colors hover:bg-slate-800/30"
                style={{ borderBottomWidth: isExpanded ? 1 : 0 }}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-slate-600" />
                  ) : (
                    <ChevronRight size={16} className="text-slate-600" />
                  )}
                  <span className="font-semibold text-slate-200">{cat}</span>
                  <span className="rounded-full bg-slate-850 px-2.5 py-0.5 text-xs text-slate-600 border border-slate-700/50">
                    {catExpenses.length} bill{catExpenses.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <span className="text-sm font-bold text-indigo-600">
                  {formatCurrency(total)}
                </span>
              </button>

              {isExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700 bg-slate-950/30">
                        {["Period", "Vendor", "Bill No.", "Amount", "Status", "Action"].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {catExpenses.map((exp) => (
                        <tr
                          key={exp._id}
                          className="transition-colors hover:bg-slate-800/30"
                        >
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">
                            {getMonthName(exp.billingMonth)} {exp.billingYear}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-200">
                            {exp.vendorName || "-"}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">
                            {exp.billNumber}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-100">
                            {formatCurrency(exp.amount)}
                          </td>
                          <td className="px-4 py-3">
                            {exp.modeOfPayment ? (
                              <span className="rounded-full bg-emerald-600/10 border border-emerald-600/30 px-2.5 py-1 text-xs font-medium text-emerald-600">
                                {exp.modeOfPayment}
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-600/10 border border-amber-600/30 px-2.5 py-1 text-xs font-medium text-amber-600">
                                Unpaid
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {!exp.modeOfPayment && (
                              <button
                                onClick={() => {
                                  setSelectedExpense(exp);
                                  setModalOpen(true);
                                }}
                                className="rounded-lg bg-indigo-600/10 border border-indigo-600/30 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-all hover:bg-indigo-600 hover:text-white"
                              >
                                Pay Now
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <PayNowModal
        expense={selectedExpense}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedExpense(null);
        }}
        onPaid={handlePaid}
      />
    </>
  );
}
