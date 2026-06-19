import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Expense from "@/models/Expense";

export async function GET() {
  try {
    await connectDB();
    const monthlyExpenses = await Expense.find({ billingType: "Monthly Billing" })
      .populate("category", "name")
      .sort({ billingYear: -1, billingMonth: -1, createdAt: -1 })
      .lean();

    // Group by category name
    const grouped: Record<string, typeof monthlyExpenses> = {};
    for (const expense of monthlyExpenses) {
      const catName =
        typeof expense.category === "object" &&
        expense.category !== null &&
        "name" in expense.category
          ? (expense.category as { name: string }).name
          : "Unknown";
      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName].push(expense);
    }

    return NextResponse.json({ expenses: monthlyExpenses, grouped });
  } catch (error) {
    console.error("Get monthly expenses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly billing expenses" },
      { status: 500 }
    );
  }
}
