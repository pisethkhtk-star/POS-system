import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        user: { select: { name: true, role: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Order GET detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser(request);
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const id = parseInt(params.id);
    const { status } = await request.json(); // "REFUNDED" or "CANCELLED"

    if (!status || (status !== "REFUNDED" && status !== "CANCELLED")) {
      return NextResponse.json(
        { error: "Invalid target status: must be CANCELLED or REFUNDED" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "REFUNDED" || order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Order has already been cancelled or refunded" },
        { status: 400 }
      );
    }

    // Run order status update and stock returns inside a transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Update order status
      const updated = await tx.order.update({
        where: { id },
        data: { status },
      });

      // 2. Revert stocks for each product inside the order
      for (const item of order.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (product) {
          const oldStock = product.stock;
          const newStock = oldStock + item.quantity;

          // Increment product stock
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: newStock },
          });

          // Write IN inventory logs
          await tx.inventoryLog.create({
            data: {
              productId: item.productId,
              type: "IN",
              quantity: item.quantity,
              beforeQty: oldStock,
              afterQty: newStock,
              note: `Order ${status} restock return - Order #${order.orderNumber}`,
              userId: user.id,
            },
          });
        }
      }

      // 3. Deduct points from the customer
      if (order.customerId) {
        const pointsToDeduct = Math.floor(Number(order.total));
        
        // Ensure customer points don't drop below 0
        const customer = await tx.customer.findUnique({
          where: { id: order.customerId },
        });

        if (customer) {
          const currentPoints = customer.points;
          const finalPoints = Math.max(0, currentPoints - pointsToDeduct);
          
          await tx.customer.update({
            where: { id: order.customerId },
            data: { points: finalPoints },
          });
        }
      }

      return updated;
    });

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error("Order status update PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update order status" },
      { status: 500 }
    );
  }
}
