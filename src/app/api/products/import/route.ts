import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { products } = await request.json();

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: "Invalid payload: 'products' array is required" },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Cache categories to reduce DB hits
    const categories = await prisma.category.findMany();
    const categoryCache = new Map<string, number>();
    categories.forEach((c) => categoryCache.set(c.name.toLowerCase(), c.id));

    for (const item of products) {
      const { name, sku, price, cost, stock, minStock, categoryName } = item;

      if (!name || !sku || !price || !cost || !categoryName) {
        results.errors.push(`Row with SKU ${sku || "unknown"}: Missing required columns.`);
        results.skipped++;
        continue;
      }

      // Check if SKU exists
      const exists = await prisma.product.findUnique({
        where: { sku: String(sku).trim() },
      });

      if (exists) {
        results.errors.push(`SKU ${sku} already exists, skipped.`);
        results.skipped++;
        continue;
      }

      // Get or create category
      let categoryId: number;
      const key = String(categoryName).trim().toLowerCase();
      if (categoryCache.has(key)) {
        categoryId = categoryCache.get(key)!;
      } else {
        const cat = await prisma.category.create({
          data: { name: String(categoryName).trim() },
        });
        categoryId = cat.id;
        categoryCache.set(key, categoryId);
      }

      const parsedPrice = parseFloat(price);
      const parsedCost = parseFloat(cost);
      const parsedStock = parseInt(stock) || 0;
      const parsedMinStock = parseInt(minStock) || 5;

      try {
        await prisma.$transaction(async (tx) => {
          const prod = await tx.product.create({
            data: {
              name: String(name).trim(),
              sku: String(sku).trim(),
              price: parsedPrice,
              cost: parsedCost,
              stock: parsedStock,
              minStock: parsedMinStock,
              categoryId,
            },
          });

          if (parsedStock > 0) {
            await tx.inventoryLog.create({
              data: {
                productId: prod.id,
                type: "IN",
                quantity: parsedStock,
                beforeQty: 0,
                afterQty: parsedStock,
                note: "CSV Bulk Import Setup",
                userId: user.id,
              },
            });
          }
        });

        results.success++;
      } catch (txErr: any) {
        results.errors.push(`SKU ${sku}: Failed to save to database. Error: ${txErr.message}`);
        results.skipped++;
      }
    }

    return NextResponse.json({
      message: `Import completed: ${results.success} successfully added, ${results.skipped} skipped.`,
      results,
    });
  } catch (error) {
    console.error("Bulk Import API error:", error);
    return NextResponse.json(
      { error: "Failed to process import payload" },
      { status: 500 }
    );
  }
}
