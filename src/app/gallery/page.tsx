import type { Metadata } from "next";
import GalleryView from "@/components/gallery/GalleryView";
import { Image as ImageIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Bills & Payment Proofs",
  description: "Browse uploaded bill invoices and payment proofs for Swad Shri Nidhi Foods",
};

export const revalidate = 0; // always fresh

async function getGalleryItems() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/gallery`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function GalleryPage() {
  const items = await getGalleryItems();

  return (
    <div className="page-enter space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-400">
          <ImageIcon size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-200">Bills & Payment Proofs</h1>
          <p className="text-sm text-slate-600">
            Browse all uploaded bill invoices and payment receipts with date and details
          </p>
        </div>
      </div>

      <GalleryView initialItems={items} />
    </div>
  );
}
