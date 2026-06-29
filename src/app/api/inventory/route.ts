import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Return all inventory logs with product and user info
    const logs = await prisma.inventoryLog.findMany({
      include: {
        product: {
          select: { name: true, code: true, stock: true },
        },
        user: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Inventory logs GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { productId, type, quantity, note } = await request.json(); // type: "IN" | "OUT" | "ADJUST"

    if (!productId || !type || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields: productId, type, quantity are required" },
        { status: 400 }
      );
    }

    if (type !== "IN" && type !== "OUT" && type !== "ADJUST") {
      return NextResponse.json(
        { error: "Type must be IN, OUT, or ADJUST" },
        { status: 400 }
      );
    }

    const prodId = parseInt(productId);
    const parsedQty = parseInt(quantity);

    if (isNaN(parsedQty) || parsedQty <= 0) {
      return NextResponse.json(
        { error: "Quantity must be a positive number greater than 0" },
        { status: 400 }
      );
    }

    const updatedProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: prodId },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      const oldStock = product.stock;
      let newStock = oldStock;

      if (type === "IN") {
        newStock = oldStock + parsedQty;
      } else if (type === "OUT" || type === "ADJUST") {
        // Quantities for manual OUT/ADJUST adjustments can adjust down
        newStock = oldStock - parsedQty;
      }

      if (newStock < 0) {
        throw new Error(`Insufficient stock. Current stock is ${oldStock}, cannot deduct ${parsedQty}`);
      }

      // Update product stock level
      const updated = await tx.product.update({
        where: { id: prodId },
        data: { stock: newStock },
      });

      // Write inventory log
      await tx.inventoryLog.create({
        data: {
          productId: prodId,
          type,
          quantity: parsedQty,
          beforeQty: oldStock,
          afterQty: newStock,
          note: note || `Manual stock adjustment (${type})`,
          userId: user.id,
        },
      });

      return updated;
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error("Inventory POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to adjust inventory" },
      { status: 500 }
    );
  }
}
