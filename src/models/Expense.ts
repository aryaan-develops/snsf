import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type BillingType = "Paid" | "Monthly Billing";
export type ModeOfPayment = "Cash" | "Digital" | "Cheque" | "Pending";

export interface IExpense extends Document {
  _id: Types.ObjectId;
  category: Types.ObjectId;
  billNumber: string;
  billingMonth: number;
  billingYear: number;
  billingType: BillingType;
  modeOfPayment: ModeOfPayment | null;
  amount: number;
  vendorName?: string;
  notes?: string;
  billImageUrl?: string;
  billImageFileId?: string;
  paymentProofUrl?: string;
  paymentProofFileId?: string;
  settledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    billNumber: {
      type: String,
      required: [true, "Bill number is required"],
      trim: true,
    },
    billingMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    billingYear: {
      type: Number,
      required: true,
    },
    billingType: {
      type: String,
      enum: ["Paid", "Monthly Billing"],
      required: [true, "Billing type is required"],
    },
    modeOfPayment: {
      type: String,
      enum: ["Cash", "Digital", "Cheque", "Pending", null],
      default: null,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    vendorName: {
      type: String,
      required: false,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    billImageUrl: {
      type: String,
    },
    billImageFileId: {
      type: String,
    },
    paymentProofUrl: {
      type: String,
    },
    paymentProofFileId: {
      type: String,
    },
    settledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: bill number must be unique per month+year
ExpenseSchema.index(
  { billNumber: 1, billingMonth: 1, billingYear: 1 },
  { unique: true }
);

// Index for common queries
ExpenseSchema.index({ modeOfPayment: 1 });
ExpenseSchema.index({ billingType: 1 });
ExpenseSchema.index({ createdAt: -1 });

const Expense: Model<IExpense> =
  mongoose.models.Expense ||
  mongoose.model<IExpense>("Expense", ExpenseSchema);

export default Expense;
