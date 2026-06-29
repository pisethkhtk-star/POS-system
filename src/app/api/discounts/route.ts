import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const discounts = await prisma.discount.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json(discounts);
  } catch (error) {
    console.error("Discounts GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, type, value, minPurchase, startDate, endDate, isActive } = await request.json();

    if (!type || value === undefined || minPurchase === undefined) {
      return NextResponse.json(
        { error: "Type, value, and minPurchase are required" },
        { status: 400 }
      );
    }

    const discount = await prisma.discount.create({
      data: {
        name: name || null,
        type,
        value: Number(value),
        minPurchase: Number(minPurchase),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(discount);
  } catch (error) {
    console.error("Discount POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
