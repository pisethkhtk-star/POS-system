import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { signJWT } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  try {
    const rolesPermissions = await prisma.rolePermission.findMany({
      orderBy: { role: "asc" }
    });
    return NextResponse.json(rolesPermissions);
  } catch (error) {
    console.error("Roles GET error:", error);
    return NextResponse.json({ error: "Failed to fetch roles permissions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const currentUser = await getAuthenticatedUser(request);
  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  try {
    const { role, pages } = await request.json();

    if (!role || !Array.isArray(pages)) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    // Upsert the permission list for this role
    const updatedPermission = await prisma.rolePermission.upsert({
      where: { role },
      update: { pages },
      create: { role, pages },
    });

    const response = NextResponse.json({ success: true, updatedPermission });

    // If the updated role matches the current user's role, resign their JWT and set cookie!
    if (currentUser.role === role) {
      const token = await signJWT({
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role,
        permissions: pages,
      });

      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      });
    }

    return response;
  } catch (error) {
    console.error("Roles POST error:", error);
    return NextResponse.json({ error: "Failed to update permissions" }, { status: 500 });
  }
}
