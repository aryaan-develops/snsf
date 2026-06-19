import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Swad Shri Nidhi Foods — Expenditure Manager",
    template: "%s | Swad Shri Nidhi Foods",
  },
  description:
    "Production-grade expenditure management system for Swad Shri Nidhi Foods. Track expenses, manage pending payments, and export financial reports.",
  keywords: ["expenditure", "expense management", "billing", "finance", "Swad Shri Nidhi"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="flex h-full bg-slate-950 text-slate-100 antialiased">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#ffffff",
              color: "#382c24",
              border: "1px solid #e5dccb",
              borderRadius: "16px",
              fontSize: "14px",
              boxShadow: "0 10px 30px -10px rgba(92, 29, 36, 0.08)",
            },
            success: {
              iconTheme: { primary: "#446e53", secondary: "#ffffff" },
            },
            error: {
              iconTheme: { primary: "#a33843", secondary: "#ffffff" },
            },
          }}
        />
      </body>
    </html>
  );
}
