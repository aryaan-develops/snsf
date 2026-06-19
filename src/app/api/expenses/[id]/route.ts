import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Expense from "@/models/Expense";
import mongoose from "mongoose";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid expense ID" }, { status: 400 });
    }

    const expense = await Expense.findById(id).populate("category", "name").lean();
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    return NextResponse.json(expense);
  } catch (error) {
    console.error("Get expense error:", error);
    return NextResponse.json({ error: "Failed to fetch expense" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid expense ID" }, { status: 400 });
    }

    const body = await request.json();
    const { modeOfPayment, paymentProofUrl, paymentProofFileId } = body;

    if (!modeOfPayment) {
      return NextResponse.json({ error: "Mode of payment is required" }, { status: 400 });
    }

    // Validate proof required for Digital/Cheque
    if (
      (modeOfPayment === "Digital" || modeOfPayment === "Cheque") &&
      !paymentProofUrl
    ) {
      return NextResponse.json(
        { error: "Payment proof image is required for Digital/Cheque settlement" },
        { status: 400 }
      );
    }

    const expense = await Expense.findByIdAndUpdate(
      id,
      {
        modeOfPayment,
        paymentProofUrl: paymentProofUrl || undefined,
        paymentProofFileId: paymentProofFileId || undefined,
        settledAt: new Date(),
        billingType: "Paid",
      },
      { new: true, runValidators: true }
    ).populate("category", "name");

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Update expense error:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid expense ID" }, { status: 400 });
    }

    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Delete expense error:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
