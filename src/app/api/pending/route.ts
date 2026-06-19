import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Expense from "@/models/Expense";

export async function GET() {
  try {
    await connectDB();
    const pendingExpenses = await Expense.find({ modeOfPayment: "Pending" })
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(pendingExpenses);
  } catch (error) {
    console.error("Get pending expenses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending expenses" },
      { status: 500 }
    );
  }
}
