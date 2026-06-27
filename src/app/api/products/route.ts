import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const query = searchParams.get("query") || "";
  const categoryIdStr = searchParams.get("categoryId") || "";

  try {
    const where: any = {};

    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
      ];
    }

    if (categoryIdStr && categoryIdStr !== "all") {
      where.categoryId = parseInt(categoryIdStr);
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
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
    const { name, sku, price, cost, stock, minStock, image, categoryId } =
      await request.json();

    if (!name || !sku || !price || !cost || categoryId === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const exists = await prisma.product.findUnique({
      where: { sku },
    });

    if (exists) {
      return NextResponse.json(
        { error: "Product SKU already exists" },
        { status: 400 }
      );
    }

    const parsedPrice = parseFloat(price);
    const parsedCost = parseFloat(cost);
    const parsedStock = parseInt(stock) || 0;
    const parsedMinStock = parseInt(minStock) || 5;
    const parsedCategoryId = parseInt(categoryId);

    // Transaction to create product and log the initial stock level
    const product = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.create({
        data: {
          name,
          sku,
          price: parsedPrice,
          cost: parsedCost,
          stock: parsedStock,
          minStock: parsedMinStock,
          image,
          categoryId: parsedCategoryId,
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
            note: "Initial stock registration",
            userId: user.id,
          },
        });
      }

      return prod;
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Product POST error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
