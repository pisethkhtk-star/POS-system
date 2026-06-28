import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: true,
        user: { select: { name: true } },
        items: {
          include: {
            product: true,
          }
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error("Purchases GET error:", error);
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { supplierId, note, items } = await request.json();

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Invalid purchase data" }, { status: 400 });
    }

    const reference = "PO-" + Date.now();
    let totalAmount = 0;

    for (const item of items) {
      totalAmount += (parseFloat(item.quantity) || 0) * (parseFloat(item.cost) || 0);
    }
    totalAmount = Number(totalAmount.toFixed(2));

    const purchase = await prisma.$transaction(async (tx) => {
      // Create Purchase
      const createdPurchase = await tx.purchase.create({
        data: {
          reference,
          supplierId: parseInt(supplierId),
          userId: user.id,
          totalAmount,
          note,
          items: {
            create: items.map((item: any) => ({
              productId: parseInt(item.productId),
              quantity: parseInt(item.quantity),
              cost: Number(parseFloat(item.cost).toFixed(2)),
              subtotal: Number((parseInt(item.quantity) * parseFloat(item.cost)).toFixed(2)),
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // Update Stock and create InventoryLogs
      for (const item of createdPurchase.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;

        const newStock = product.stock + item.quantity;

        await tx.product.update({
          where: { id: product.id },
          data: { stock: newStock },
        });

        await tx.inventoryLog.create({
          data: {
            productId: product.id,
            type: "IN",
            quantity: item.quantity,
            beforeQty: product.stock,
            afterQty: newStock,
            note: `Purchase Order: ${reference}`,
            userId: user.id,
          },
        });
      }

      return createdPurchase;
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (error: any) {
    console.error("Purchase POST error:", error);
    return NextResponse.json({ error: error.message || "Failed to create purchase" }, { status: 500 });
  }
}
