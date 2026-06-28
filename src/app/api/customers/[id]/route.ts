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
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Customer GET detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer profile" },
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
    const { name, phone, email, address, points } = await request.json();

    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Phone uniqueness check
    if (phone && phone !== existingCustomer.phone) {
      const phoneConflict = await prisma.customer.findUnique({
        where: { phone },
      });
      if (phoneConflict) {
        return NextResponse.json(
          { error: "Phone number already registered by another customer" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: name || existingCustomer.name,
        phone: phone !== undefined ? phone : existingCustomer.phone,
        email: email !== undefined ? email : existingCustomer.email,
        address: address !== undefined ? address : existingCustomer.address,
        points: points !== undefined ? parseInt(points) : existingCustomer.points,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Customer PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}
