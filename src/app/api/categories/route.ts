import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";

export async function GET() {
  try {
    await connectDB();

    const defaultCategories = [
      "Pav",
      "Coconut water",
      "Egg",
      "Milk & CURD",
      "Coffee",
      "Chicken",
      "Mutton",
      "Fish",
      "Sweet",
      "Chappati",
      "Tea Powder",
      "Dry Fruits",
      "Bakery Items",
      "Packing Material",
      "Bisleri Bottle",
      "Vegetables",
      "Fruits",
      "Grocery",
      "GAS",
      "General Items",
      "Cake",
      "PANEER",
      "Oil",
      "Other item",
      "Biscuits"
    ];

    const existing = await Category.find({}).lean();
    const existingNamesLower = new Set(existing.map((c) => c.name.toLowerCase()));

    const toInsert = defaultCategories.filter(
      (name) => !existingNamesLower.has(name.toLowerCase())
    );

    if (toInsert.length > 0) {
      await Category.insertMany(toInsert.map((name) => ({ name: name.trim() })));
    }

    const categories = await Category.find({}).sort({ name: 1 }).lean();
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 409 }
      );
    }

    const category = await Category.create({ name: name.trim() });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
