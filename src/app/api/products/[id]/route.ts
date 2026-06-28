import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = parseInt(resolvedParams.id);
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Product GET details error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product details" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const user = await getAuthenticatedUser(request);
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const id = parseInt(resolvedParams.id);
    const { name, sku, price, cost, stock, minStock, image, categoryId } =
      await request.json();

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check SKU unique conflict
    if (sku && sku !== existingProduct.sku) {
      const skuConflict = await prisma.product.findUnique({
        where: { sku },
      });
      if (skuConflict) {
        return NextResponse.json(
          { error: "SKU code is already used by another product" },
          { status: 400 }
        );
      }
    }

    const parsedPrice = parseFloat(price);
    const parsedCost = parseFloat(cost);
    const parsedStock = parseInt(stock);
    const parsedMinStock = parseInt(minStock);
    const parsedCategoryId = parseInt(categoryId);

    const oldStock = existingProduct.stock;
    const newStock = isNaN(parsedStock) ? oldStock : parsedStock;

    // Transaction to update product and log inventory adjust if stock changed
    const updatedProduct = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.update({
        where: { id },
        data: {
          name: name || existingProduct.name,
          sku: sku || existingProduct.sku,
          price: isNaN(parsedPrice) ? existingProduct.price : parsedPrice,
          cost: isNaN(parsedCost) ? existingProduct.cost : parsedCost,
          stock: newStock,
          minStock: isNaN(parsedMinStock) ? existingProduct.minStock : parsedMinStock,
          image: image !== undefined ? image : existingProduct.image,
          categoryId: isNaN(parsedCategoryId) ? existingProduct.categoryId : parsedCategoryId,
        },
      });

      if (newStock !== oldStock) {
        const diff = newStock - oldStock;
        await tx.inventoryLog.create({
          data: {
            productId: prod.id,
            type: "ADJUST",
            quantity: diff,
            beforeQty: oldStock,
            afterQty: newStock,
            note: `Product edit stock adjustment by ${user.name}`,
            userId: user.id,
          },
        });
      }

      return prod;
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Product PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const user = await getAuthenticatedUser(request);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const id = parseInt(resolvedParams.id);

    // Delete product. Note: We must handle cascading if there are related items, 
    // but Prisma defaults to erroring out if there are related order items.
    // For simplicity, let's check if the product has orders. If yes, we can disable or error,
    // which prevents deleting historical sales data.
    const orderItemsCount = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItemsCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete product because it has associated sales history. Try adjusting stock to 0 instead." },
        { status: 400 }
      );
    }

    // Clean up inventory logs first since they reference the product
    await prisma.inventoryLog.deleteMany({
      where: { productId: id },
    });

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
