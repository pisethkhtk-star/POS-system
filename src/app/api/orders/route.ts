import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const startDateStr = searchParams.get("startDate") || "";
  const endDateStr = searchParams.get("endDate") || "";

  try {
    const where: any = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (startDateStr || endDateStr) {
      where.createdAt = {};
      if (startDateStr) {
        where.createdAt.gte = new Date(startDateStr);
      }
      if (endDateStr) {
        // Enforce end of day boundary
        const end = new Date(endDateStr);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        user: {
          select: { name: true, role: true },
        },
        items: {
          include: {
            product: {
              select: { name: true, sku: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      customerId,
      items,
      subtotal,
      discount,
      tax,
      total,
      paymentMethod,
      amountPaid,
      change,
      note,
    } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0 || !paymentMethod) {
      return NextResponse.json(
        { error: "Invalid order details: items and paymentMethod are required" },
        { status: 400 }
      );
    }

    // Generate unique order number: POS-YYYYMMDD-XXXX (timestamp + random number)
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `POS-${dateStr}-${rand}`;

    const parsedSubtotal = parseFloat(subtotal);
    const parsedDiscount = parseFloat(discount) || 0;
    const parsedTax = parseFloat(tax) || 0;
    const parsedTotal = parseFloat(total);
    const parsedAmountPaid = parseFloat(amountPaid);
    const parsedChange = parseFloat(change) || 0;

    // Run the entire checkout inside a transaction to ensure database integrity
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create the main Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          customerId: customerId ? parseInt(customerId) : null,
          subtotal: parsedSubtotal,
          discount: parsedDiscount,
          tax: parsedTax,
          total: parsedTotal,
          paymentMethod,
          amountPaid: parsedAmountPaid,
          change: parsedChange,
          status: "COMPLETED",
          note,
        },
      });

      // 2. Process each Order Item
      for (const item of items) {
        const prodId = parseInt(item.productId);
        const qty = parseInt(item.quantity);
        const price = parseFloat(item.price);
        const itemSubtotal = price * qty;

        // Fetch current product to check stock levels
        const product = await tx.product.findUnique({
          where: { id: prodId },
        });

        if (!product) {
          throw new Error(`Product ID ${prodId} not found`);
        }

        if (product.stock < qty) {
          throw new Error(`Insufficient stock for product: ${product.name}. Available: ${product.stock}, Requested: ${qty}`);
        }

        const oldStock = product.stock;
        const newStock = oldStock - qty;

        // Decrement product stock levels
        await tx.product.update({
          where: { id: prodId },
          data: { stock: newStock },
        });

        // Write inventory logs
        await tx.inventoryLog.create({
          data: {
            productId: prodId,
            type: "OUT",
            quantity: qty,
            beforeQty: oldStock,
            afterQty: newStock,
            note: `Order sale ${orderNumber}`,
            userId: user.id,
          },
        });

        // Save order item
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: prodId,
            quantity: qty,
            price,
            subtotal: itemSubtotal,
          },
        });
      }

      // 3. Award loyalty points to customer (1 point per dollar spent)
      if (customerId) {
        const custId = parseInt(customerId);
        const pointsToAdd = Math.floor(parsedTotal);
        await tx.customer.update({
          where: { id: custId },
          data: {
            points: {
              increment: pointsToAdd,
            },
          },
        });
      }

      return newOrder;
    });

    // Fetch full order details to return to client
    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        customer: true,
        user: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true } },
          },
        },
      },
    });

    return NextResponse.json(fullOrder, { status: 201 });
  } catch (error: any) {
    console.error("Order POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit order" },
      { status: 500 }
    );
  }
}
