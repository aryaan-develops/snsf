"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  Clock,
  Calendar,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Utensils,
  Image,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Overview & Export",
  },
  {
    href: "/entry",
    label: "New Entry",
    icon: PlusCircle,
    description: "Add Expense",
  },
  {
    href: "/pending",
    label: "Pending",
    icon: Clock,
    description: "Unsettled Payments",
  },
  {
    href: "/monthly",
    label: "Monthly Billing",
    icon: CreditCard,
    description: "Recurring Bills",
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: Calendar,
    description: "Activity View",
  },
  {
    href: "/gallery",
    label: "Bills & Proofs",
    icon: Image,
    description: "Bills & Receipts",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative hidden lg:flex flex-col bg-slate-950 border-r border-slate-700/60",
        "transition-all duration-300 ease-in-out shrink-0",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-slate-700/60 px-4 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-400 shadow-md">
          <Utensils size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="truncate text-sm font-bold text-slate-200 leading-tight">
              Swad Shri Nidhi
            </p>
            <p className="truncate text-xs text-slate-600">Foods — Expenses</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ href, label, icon: Icon, description }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150",
                isActive
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
              )}
            >
              <Icon
                size={20}
                className={cn(
                  "shrink-0 transition-colors",
                  isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              {!collapsed && (
                <div className="overflow-hidden">
                  <p className="truncate text-sm font-medium">{label}</p>
                  <p className="truncate text-xs text-slate-500">{description}</p>
                </div>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse button */}
      <div className="border-t border-slate-700/60 p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
        >
          {collapsed ? <ChevronRight size={16} /> : (
            <>
              <ChevronLeft size={16} />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
