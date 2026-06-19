import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Expense from "@/models/Expense";

export async function GET() {
  try {
    await connectDB();

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const [
      totalExpenses,
      totalAmount,
      pendingCount,
      pendingAmount,
      monthlyBillingCount,
      monthlyBillingAmount,
      thisMonthCount,
      thisMonthAmount,
    ] = await Promise.all([
      Expense.countDocuments(),
      Expense.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
      Expense.countDocuments({ modeOfPayment: "Pending" }),
      Expense.aggregate([
        { $match: { modeOfPayment: "Pending" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Expense.countDocuments({ billingType: "Monthly Billing" }),
      Expense.aggregate([
        { $match: { billingType: "Monthly Billing" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Expense.countDocuments({ billingMonth: currentMonth, billingYear: currentYear }),
      Expense.aggregate([
        { $match: { billingMonth: currentMonth, billingYear: currentYear } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    return NextResponse.json({
      totalExpenses,
      totalAmount: totalAmount[0]?.total || 0,
      pendingCount,
      pendingAmount: pendingAmount[0]?.total || 0,
      monthlyBillingCount,
      monthlyBillingAmount: monthlyBillingAmount[0]?.total || 0,
      thisMonthCount,
      thisMonthAmount: thisMonthAmount[0]?.total || 0,
      currentMonth,
      currentYear,
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard summary" },
      { status: 500 }
    );
  }
}
