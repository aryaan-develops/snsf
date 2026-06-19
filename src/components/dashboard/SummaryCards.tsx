import { formatCurrency, getMonthName } from "@/lib/utils";
import { TrendingUp, Clock, CreditCard, Calendar } from "lucide-react";

interface SummaryData {
  totalExpenses: number;
  totalAmount: number;
  pendingCount: number;
  pendingAmount: number;
  monthlyBillingCount: number;
  monthlyBillingAmount: number;
  thisMonthCount: number;
  thisMonthAmount: number;
  currentMonth: number;
  currentYear: number;
}

interface CardProps {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  gradient: string;
  borderColor: string;
}

function SummaryCard({ title, value, sub, icon, gradient, borderColor }: CardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-slate-900 p-5 transition-transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-950/5 ${borderColor}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            {title}
          </p>
          <p className="text-2xl font-bold text-slate-200">{value}</p>
          <p className="text-xs text-slate-600">{sub}</p>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${gradient}`}
        >
          {icon}
        </div>
      </div>
      {/* Subtle glow */}
      <div
        className={`absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-15 blur-xl ${gradient}`}
      />
    </div>
  );
}

export default function SummaryCards({ data }: { data: SummaryData }) {
  const cards: CardProps[] = [
    {
      title: "Total Expenses",
      value: formatCurrency(data.totalAmount),
      sub: `${data.totalExpenses} entries total`,
      icon: <TrendingUp size={20} className="text-white" />,
      gradient: "bg-gradient-to-br from-indigo-500 to-violet-600",
      borderColor: "border-indigo-500/20",
    },
    {
      title: "Pending Dues",
      value: formatCurrency(data.pendingAmount),
      sub: `${data.pendingCount} unpaid bills`,
      icon: <Clock size={20} className="text-white" />,
      gradient: "bg-gradient-to-br from-amber-500 to-orange-600",
      borderColor: "border-amber-500/20",
    },
    {
      title: "Monthly Billing",
      value: formatCurrency(data.monthlyBillingAmount),
      sub: `${data.monthlyBillingCount} recurring bills`,
      icon: <CreditCard size={20} className="text-white" />,
      gradient: "bg-gradient-to-br from-violet-500 to-purple-600",
      borderColor: "border-violet-500/20",
    },
    {
      title: `${getMonthName(data.currentMonth)} ${data.currentYear}`,
      value: formatCurrency(data.thisMonthAmount),
      sub: `${data.thisMonthCount} entries this month`,
      icon: <Calendar size={20} className="text-white" />,
      gradient: "bg-gradient-to-br from-emerald-500 to-teal-600",
      borderColor: "border-emerald-500/20",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <SummaryCard key={card.title} {...card} />
      ))}
    </div>
  );
}
