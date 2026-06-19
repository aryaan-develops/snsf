import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Expense from "@/models/Expense";

export async function GET() {
  try {
    await connectDB();

    // Fetch expenses that have either a bill image or a payment proof image
    const expenses = await Expense.find({
      $or: [
        { billImageUrl: { $nin: [null, ""], $exists: true } },
        { paymentProofUrl: { $nin: [null, ""], $exists: true } },
      ],
    })
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Get gallery error:", error);
    return NextResponse.json(
      { error: "Failed to fetch gallery items" },
      { status: 500 }
    );
  }
}
