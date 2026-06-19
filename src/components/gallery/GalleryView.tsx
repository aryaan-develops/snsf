"use client";

import { useState } from "react";
import { formatDate, formatCurrency } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import { Image as ImageIcon, Calendar, FileText, User, Receipt, Info, ExternalLink, X } from "lucide-react";

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
  billImageFileId?: string;
  paymentProofUrl?: string;
  paymentProofFileId?: string;
  createdAt: string;
}

interface GalleryViewProps {
  initialItems: Expense[];
}

export default function GalleryView({ initialItems }: GalleryViewProps) {
  const [activeTab, setActiveTab] = useState<"bills" | "proofs">("bills");
  const [selectedItem, setSelectedItem] = useState<Expense | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string; type: string } | null>(null);

  // Filter items that have the respective image types
  const bills = initialItems.filter((item) => !!item.billImageUrl);
  const proofs = initialItems.filter((item) => !!item.paymentProofUrl);

  const currentItems = activeTab === "bills" ? bills : proofs;

  const handleOpenLightbox = (item: Expense, url: string, type: "bill" | "proof") => {
    const categoryName =
      typeof item.category === "object" && item.category !== null && "name" in item.category
        ? item.category.name
        : "Unknown";

    setSelectedItem(item);
    setSelectedImage({
      url,
      title: type === "bill" ? `Bill: ${categoryName}` : `Payment Proof: ${categoryName}`,
      type,
    });
  };

  const handleCloseLightbox = () => {
    setSelectedImage(null);
    setSelectedItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Tabs Selector */}
      <div className="flex border-b border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("bills")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all ${
            activeTab === "bills"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Receipt size={16} />
          <span>Bill & Invoice Images</span>
          <span className={`ml-1.5 px-2 py-0.5 text-xs font-semibold rounded-full ${
            activeTab === "bills" ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-800 text-slate-500"
          }`}>
            {bills.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("proofs")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all ${
            activeTab === "proofs"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <ImageIcon size={16} />
          <span>Payment Proofs</span>
          <span className={`ml-1.5 px-2 py-0.5 text-xs font-semibold rounded-full ${
            activeTab === "proofs" ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-800 text-slate-500"
          }`}>
            {proofs.length}
          </span>
        </button>
      </div>

      {/* Grid List */}
      {currentItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/50 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-600">
            <ImageIcon size={24} />
          </div>
          <h3 className="text-base font-semibold text-slate-300">No images found</h3>
          <p className="mt-1 text-sm text-slate-500">
            No {activeTab === "bills" ? "bills" : "payment proofs"} have been uploaded yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {currentItems.map((item) => {
            const categoryName =
              typeof item.category === "object" && item.category !== null && "name" in item.category
                ? item.category.name
                : "Unknown";

            const imageUrl = activeTab === "bills" ? item.billImageUrl! : item.paymentProofUrl!;

            return (
              <div
                key={item._id}
                className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-lg hover:shadow-indigo-950/10 flex flex-col"
              >
                {/* Image Section */}
                <div
                  onClick={() => handleOpenLightbox(item, imageUrl, activeTab === "bills" ? "bill" : "proof")}
                  className="relative h-48 w-full cursor-zoom-in overflow-hidden bg-slate-950"
                >
                  <img
                    src={imageUrl}
                    alt={`${categoryName} image`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60" />
                  
                  {/* Floating Date Badge */}
                  <div className="absolute left-3 top-3 rounded-lg bg-slate-950/70 px-2 py-1 text-[11px] font-medium text-slate-300 backdrop-blur-sm border border-slate-800">
                    {formatDate(item.createdAt)}
                  </div>
                </div>

                {/* Info Details */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-block rounded-md bg-indigo-600/10 border border-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-400">
                        {categoryName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {item.billNumber}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-slate-600">Vendor</p>
                      <p className="text-sm font-semibold text-slate-200 truncate">
                        {item.vendorName || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-600 uppercase tracking-wider">Amount</p>
                      <p className="text-base font-bold text-slate-100">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenLightbox(item, imageUrl, activeTab === "bills" ? "bill" : "proof")}
                      className="rounded-lg bg-slate-800 hover:bg-slate-750 p-2 text-slate-400 hover:text-slate-200 transition-colors"
                      title="View Details"
                    >
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox / Details Modal */}
      {selectedImage && selectedItem && (
        <Modal
          isOpen={true}
          onClose={handleCloseLightbox}
          title={selectedImage.title}
          size="xl"
        >
          <div className="grid gap-6 md:grid-cols-2">
            {/* Image Viewer */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[300px] md:min-h-[450px]">
              <img
                src={selectedImage.url}
                alt="Enlarged view"
                className="max-h-[450px] w-auto object-contain"
              />
              <a
                href={selectedImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-lg bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-white border border-slate-700 hover:bg-slate-800 backdrop-blur transition-colors"
              >
                <ExternalLink size={12} />
                Open Original
              </a>
            </div>

            {/* Metadata Sidebar */}
            <div className="flex flex-col justify-between h-full space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Expense Details
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Receipt size={12} />
                      <span>Category</span>
                    </div>
                    <p className="text-sm font-bold text-slate-200">
                      {typeof selectedItem.category === "object" && selectedItem.category !== null && "name" in selectedItem.category
                        ? selectedItem.category.name
                        : "Unknown"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Calendar size={12} />
                      <span>Date Added</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-200">
                      {formatDate(selectedItem.createdAt)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-1 col-span-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <User size={12} />
                      <span>Vendor Name</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-200">
                      {selectedItem.vendorName || "—"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <FileText size={12} />
                      <span>Bill Number</span>
                    </div>
                    <p className="text-sm font-mono font-medium text-slate-300">
                      {selectedItem.billNumber}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Receipt size={12} />
                      <span>Amount</span>
                    </div>
                    <p className="text-base font-bold text-indigo-400">
                      {formatCurrency(selectedItem.amount)}
                    </p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-3 pt-2">
                  <div className="flex gap-4 text-xs text-slate-500">
                    <div>
                      <span className="font-semibold text-slate-600">Billing Type:</span> {selectedItem.billingType}
                    </div>
                    {selectedItem.modeOfPayment && (
                      <div>
                        <span className="font-semibold text-slate-600">Paid Via:</span> {selectedItem.modeOfPayment}
                      </div>
                    )}
                  </div>

                  {selectedItem.notes && (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Info size={12} />
                        <span>Notes</span>
                      </div>
                      <p className="text-xs text-slate-400 italic whitespace-pre-wrap leading-relaxed">
                        {selectedItem.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseLightbox}
                className="w-full rounded-xl bg-slate-800 hover:bg-slate-750 py-3 text-sm font-semibold text-slate-300 transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
