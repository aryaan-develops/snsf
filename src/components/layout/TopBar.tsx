"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  Clock,
  Calendar,
  CreditCard,
  Menu,
  X,
  Utensils,
  Image,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/entry", label: "New Entry", icon: PlusCircle },
  { href: "/pending", label: "Pending", icon: Clock },
  { href: "/monthly", label: "Monthly", icon: CreditCard },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/gallery", label: "Bills & Proofs", icon: Image },
];

export default function TopBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pageName =
    mounted && pathname
      ? (navItems.find((n) => n.href === pathname)?.label ?? "Dashboard")
      : "Dashboard";

  return (
    <>
      {/* Mobile TopBar */}
      <header className="lg:hidden flex items-center justify-between border-b border-slate-700/60 bg-slate-950 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-400">
            <Utensils size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-200">Swad Shri Nidhi</p>
            <p className="text-xs text-slate-600">{pageName}</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 bg-slate-950 border-r border-slate-700 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-400">
                  <Utensils size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">Swad Shri Nidhi</p>
                  <p className="text-xs text-slate-600">Foods — Expenses</p>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 transition-all",
                      isActive
                        ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon size={20} />
                    <span className="text-sm font-medium">{label}</span>
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
