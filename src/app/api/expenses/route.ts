import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Expense from "@/models/Expense";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const billingType = searchParams.get("billingType");
    const modeOfPayment = searchParams.get("modeOfPayment");
    const categoryId = searchParams.get("category");
    const vendorName = searchParams.get("vendorName");

    const filter: Record<string, unknown> = {};
    if (month) filter.billingMonth = parseInt(month);
    if (year) filter.billingYear = parseInt(year);
    if (billingType) filter.billingType = billingType;
    if (modeOfPayment) filter.modeOfPayment = modeOfPayment;
    if (categoryId) filter.category = categoryId;
    if (vendorName) filter.vendorName = { $regex: new RegExp(vendorName.trim(), "i") };

    const skip = (page - 1) * limit;
    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Expense.countDocuments(filter),
    ]);

    return NextResponse.json({
      expenses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get expenses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const {
      category,
      billNumber,
      billingType,
      modeOfPayment,
      amount,
      vendorName,
      notes,
      billImageUrl,
      billImageFileId,
      paymentProofUrl,
      paymentProofFileId,
    } = body;

    // Validation
    if (!category || !billNumber || !billingType || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const now = new Date();
    const billingMonth = body.billingMonth || now.getMonth() + 1;
    const billingYear = body.billingYear || now.getFullYear();

    // Enforce unique bill number per month + year
    const existing = await Expense.findOne({
      billNumber: billNumber.trim(),
      billingMonth,
      billingYear,
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `Bill number "${billNumber}" already exists for ${billingMonth}/${billingYear}`,
        },
        { status: 409 }
      );
    }

    // Payment proof is optional — can be attached later via settle/edit flow

    const expense = await Expense.create({
      category,
      billNumber: billNumber.trim(),
      billingMonth,
      billingYear,
      billingType,
      modeOfPayment: billingType === "Monthly Billing" ? null : modeOfPayment,
      amount: parseFloat(amount),
      vendorName: vendorName ? vendorName.trim() : "",
      notes: notes?.trim(),
      billImageUrl,
      billImageFileId,
      paymentProofUrl,
      paymentProofFileId,
    });

    const populated = await expense.populate("category", "name");
    return NextResponse.json(populated, { status: 201 });
  } catch (error: unknown) {
    console.error("Create expense error:", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: "Bill number already exists for this month" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
