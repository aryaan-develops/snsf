import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Expense from "@/models/Expense";

function getKolkataDateString(date: Date): string {
  const kolkataDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const year = kolkataDate.getFullYear();
  const month = String(kolkataDate.getMonth() + 1).padStart(2, "0");
  const day = String(kolkataDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET() {
  try {
    await connectDB();

    // Aggregate activity by date (createdAt and settledAt)
    const expenses = await Expense.find({})
      .populate("category", "name")
      .select("createdAt settledAt vendorName amount billingType modeOfPayment category billNumber")
      .lean();

    const activityMap: Record<
      string,
      { date: string; count: number; activities: Array<{
        type: string;
        vendorName: string;
        amount: number;
        billingType: string;
        modeOfPayment: string | null;
        category: string;
        billNumber: string;
      }> }
    > = {};

    for (const expense of expenses) {
      const catName =
        typeof expense.category === "object" &&
        expense.category !== null &&
        "name" in expense.category
          ? (expense.category as { name: string }).name
          : "Unknown";

      // Created activity
      const createdDate = getKolkataDateString(expense.createdAt);
      if (!activityMap[createdDate]) {
        activityMap[createdDate] = { date: createdDate, count: 0, activities: [] };
      }
      activityMap[createdDate].count += 1;
      activityMap[createdDate].activities.push({
        type: "Expense Added",
        vendorName: expense.vendorName || "",
        amount: expense.amount,
        billingType: expense.billingType,
        modeOfPayment: expense.modeOfPayment,
        category: catName,
        billNumber: expense.billNumber,
      });

      // Settled activity
      if (expense.settledAt) {
        const settledDate = getKolkataDateString(expense.settledAt);
        if (!activityMap[settledDate]) {
          activityMap[settledDate] = { date: settledDate, count: 0, activities: [] };
        }
        activityMap[settledDate].count += 1;
        activityMap[settledDate].activities.push({
          type: "Payment Settled",
          vendorName: expense.vendorName || "",
          amount: expense.amount,
          billingType: expense.billingType,
          modeOfPayment: expense.modeOfPayment,
          category: catName,
          billNumber: expense.billNumber,
        });
      }
    }

    return NextResponse.json(Object.values(activityMap));
  } catch (error) {
    console.error("Get calendar data error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar data" },
      { status: 500 }
    );
  }
}
