import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const startDateStr = searchParams.get("startDate") || "";
  const endDateStr = searchParams.get("endDate") || "";

  try {
    const where: any = {
      status: "COMPLETED", // Only include completed sales in reports
    };

    if (startDateStr || endDateStr) {
      where.createdAt = {};
      if (startDateStr) {
        where.createdAt.gte = new Date(startDateStr);
      }
      if (endDateStr) {
        const end = new Date(endDateStr);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true, cost: true, category: { select: { name: true } } } },
          },
        },
      },
    });

    // 1. Overall Calculations
    let totalRevenue = 0;
    let totalCostOfGoods = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let orderCount = orders.length;

    const salesByDateMap = new Map<string, { revenue: number; cost: number; count: number }>();
    const salesByCategoryMap = new Map<string, { revenue: number; quantity: number }>();
    const salesByCashierMap = new Map<string, { revenue: number; count: number }>();

    for (const order of orders) {
      const rev = Number(order.total);
      const disc = Number(order.discount);
      const txVal = Number(order.tax);

      totalRevenue += rev;
      totalDiscount += disc;
      totalTax += txVal;

      // Calculate cost of this order
      let orderCost = 0;
      for (const item of order.items) {
        const qty = item.quantity;
        const itemCost = Number(item.product?.cost || 0) * qty;
        orderCost += itemCost;

        // Group by Category
        const catName = item.product?.category?.name || "Uncategorized";
        const catVal = salesByCategoryMap.get(catName) || { revenue: 0, quantity: 0 };
        catVal.revenue += Number(item.subtotal);
        catVal.quantity += qty;
        salesByCategoryMap.set(catName, catVal);
      }
      totalCostOfGoods += orderCost;

      // Group by Date (YYYY-MM-DD)
      const dateKey = order.createdAt.toISOString().slice(0, 10);
      const dateVal = salesByDateMap.get(dateKey) || { revenue: 0, cost: 0, count: 0 };
      dateVal.revenue += rev;
      dateVal.cost += orderCost;
      dateVal.count += 1;
      salesByDateMap.set(dateKey, dateVal);

      // Group by Cashier
      const cashierName = order.user?.name || "System";
      const cashierVal = salesByCashierMap.get(cashierName) || { revenue: 0, count: 0 };
      cashierVal.revenue += rev;
      cashierVal.count += 1;
      salesByCashierMap.set(cashierName, cashierVal);
    }

    const netProfit = totalRevenue - totalCostOfGoods;
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    // Convert Maps to sorted arrays for client presentation
    const salesByDate = Array.from(salesByDateMap.entries())
      .map(([date, val]) => ({
        date,
        revenue: val.revenue,
        cost: val.cost,
        profit: val.revenue - val.cost,
        orders: val.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const salesByCategory = Array.from(salesByCategoryMap.entries()).map(([category, val]) => ({
      category,
      revenue: val.revenue,
      quantity: val.quantity,
    }));

    const salesByCashier = Array.from(salesByCashierMap.entries()).map(([cashier, val]) => ({
      cashier,
      revenue: val.revenue,
      orders: val.count,
    }));

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalCostOfGoods,
        totalDiscount,
        totalTax,
        netProfit,
        orderCount,
        avgOrderValue,
      },
      salesByDate,
      salesByCategory,
      salesByCashier,
    });
  } catch (error) {
    console.error("Reports GET error:", error);
    return NextResponse.json(
      { error: "Failed to generate sales reports" },
      { status: 500 }
    );
  }
}
