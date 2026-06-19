import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Expense from "@/models/Expense";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    await connectDB();

    const expenses = await Expense.find({})
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .lean();

    const rows = expenses.map((exp) => {
      const catName =
        typeof exp.category === "object" &&
        exp.category !== null &&
        "name" in exp.category
          ? (exp.category as { name: string }).name
          : "Unknown";

      return {
        Date: new Date(exp.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
        Category: catName,
        "Bill No": exp.billNumber,
        "Vendor Name": exp.vendorName || "",
        "Billing Type": exp.billingType,
        "Mode of Payment": exp.modeOfPayment || "N/A",
        "Amount (₹)": exp.amount,
        "Bill Image URL": exp.billImageUrl || "",
        "Payment Proof URL": exp.paymentProofUrl || "",
        "Settled At": exp.settledAt
          ? new Date(exp.settledAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })
          : "",
        Notes: exp.notes || "",
        "Billing Month": exp.billingMonth,
        "Billing Year": exp.billingYear,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenditures");

    // Auto-column widths
    const colWidths = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(key.length, 20),
    }));
    worksheet["!cols"] = colWidths;

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    const filename = `SwadShriNidhi_Expenditures_${new Date()
      .toISOString()
      .split("T")[0]}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
