import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const discountId = parseInt(id);

  try {
    const { name, type, value, minPurchase, startDate, endDate, isActive } = await request.json();

    const current = await prisma.discount.findUnique({
      where: { id: discountId },
    });

    if (!current) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }

    const updated = await prisma.discount.update({
      where: { id: discountId },
      data: {
        name: name !== undefined ? name : current.name,
        type: type !== undefined ? type : current.type,
        value: value !== undefined ? Number(value) : current.value,
        minPurchase: minPurchase !== undefined ? Number(minPurchase) : current.minPurchase,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : current.startDate,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : current.endDate,
        isActive: isActive !== undefined ? isActive : current.isActive,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Discount PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const discountId = parseInt(id);

  try {
    const current = await prisma.discount.findUnique({
      where: { id: discountId },
    });

    if (!current) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }

    await prisma.discount.delete({
      where: { id: discountId },
    });

    return NextResponse.json({ message: "Discount deleted successfully" });
  } catch (error) {
    console.error("Discount DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
