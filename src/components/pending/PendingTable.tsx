"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import ImageUploader from "@/components/ui/ImageUploader";
import { Spinner } from "@/components/ui/Spinner";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface Expense {
  _id: string;
  category: { name: string };
  billNumber: string;
  vendorName?: string;
  amount: number;
  billingMonth: number;
  billingYear: number;
  modeOfPayment: string | null;
  createdAt: string;
}

const PAYMENT_MODES = ["Cash", "Digital", "Cheque"] as const;
type PayMode = typeof PAYMENT_MODES[number];

interface SettleModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onSettled: (id: string) => void;
}

function SettleModal({ expense, isOpen, onClose, onSettled }: SettleModalProps) {
  const [mode, setMode] = useState<PayMode | "">("");
  const [proof, setProof] = useState<{ url: string; fileId: string } | null>(null);
  const [settling, setSettling] = useState(false);

  const needsProof = mode === "Digital" || mode === "Cheque";

  const handleSettle = async () => {
    if (!expense || !mode) return;
    if (needsProof && !proof) {
      toast.error("Payment proof is required for Digital/Cheque");
      return;
    }
    setSettling(true);
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
        toast.error(data.error || "Failed to settle payment");
        return;
      }
      toast.success("Payment settled successfully!");
      onSettled(expense._id);
      onClose();
      setMode("");
      setProof(null);
    } catch {
      toast.error("Failed to settle payment");
    } finally {
      setSettling(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settle Payment" size="md">
      {expense && (
        <div className="space-y-4">
          {/* Expense Summary */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Vendor</span>
              <span className="text-slate-100 font-medium">{expense.vendorName || "-"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Bill No.</span>
              <span className="text-slate-100">{expense.billNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Amount</span>
              <span className="text-emerald-600 font-bold text-base">
                {formatCurrency(expense.amount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Date Added</span>
              <span className="text-slate-300">{formatDate(expense.createdAt)}</span>
            </div>
          </div>

          {/* Payment Mode */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-300">Select Payment Mode</p>
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

          {/* Proof Upload */}
          {needsProof && (
            <ImageUploader
              id="settle-proof"
              label="Payment Proof"
              required
              folder="/swad-shri-nidhi/payment-proofs"
              currentUrl={proof?.url}
              onUpload={(r) => setProof({ url: r.url, fileId: r.fileId })}
              onRemove={() => setProof(null)}
            />
          )}

          {/* Actions */}
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
              onClick={handleSettle}
              disabled={!mode || settling || (needsProof && !proof)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {settling ? <Spinner size="sm" /> : null}
              {settling ? "Settling..." : "Confirm Settlement"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

interface PendingTableProps {
  initialExpenses: Expense[];
}

export default function PendingTable({ initialExpenses }: PendingTableProps) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSettled = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e._id !== id));
  };

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600/10">
          <span className="text-3xl">✅</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-200">All Payments Settled!</h3>
        <p className="mt-1 text-sm text-slate-600">No pending payments found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-950/30">
                {["Date", "Category", "Vendor", "Bill No.", "Amount", "Action"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {expenses.map((exp) => (
                <tr
                  key={exp._id}
                  className="group transition-colors hover:bg-slate-800/30"
                >
                  <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                    {formatDate(exp.createdAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-md bg-slate-850 px-2.5 py-1 text-xs font-medium text-slate-300 border border-slate-700/50">
                      {exp.category?.name}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-200 font-medium">
                    {exp.vendorName || "-"}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 font-mono text-xs">
                    {exp.billNumber}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-amber-600">
                    {formatCurrency(exp.amount)}
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => {
                        setSelectedExpense(exp);
                        setModalOpen(true);
                      }}
                      className="rounded-lg bg-emerald-600/10 border border-emerald-600/30 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-all hover:bg-emerald-600 hover:text-white"
                    >
                      Settle Payment
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SettleModal
        expense={selectedExpense}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedExpense(null);
        }}
        onSettled={handleSettled}
      />
    </>
  );
}
