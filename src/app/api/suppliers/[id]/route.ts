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
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }
    return NextResponse.json(supplier);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch supplier" }, { status: 500 });
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
    const { name, contact, phone, email, address } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Supplier name is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        contact: contact || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Supplier PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update supplier" },
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

    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    await prisma.supplier.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Supplier DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete supplier" },
      { status: 500 }
    );
  }
}
