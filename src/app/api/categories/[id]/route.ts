import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

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
    const { name, icon } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (name !== existingCategory.name) {
      const conflict = await prisma.category.findUnique({
        where: { name },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "Category name already exists" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name, icon },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Category PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
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
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const id = parseInt(resolvedParams.id);

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Check if category has products
    const productsCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete category that contains products. Please reassign or delete the products first." },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Category DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
