import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { signJWT } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    // Fetch the latest permissions dynamically from the database
    const rolePerm = await prisma.rolePermission.findUnique({
      where: { role: user.role },
    });

    let permissions = rolePerm?.pages;
    if (!permissions) {
      if (user.role === "ADMIN") {
        permissions = ["/", "/pos", "/products", "/categories", "/discounts", "/inventory", "/purchases", "/suppliers", "/customers", "/orders", "/reports", "/users", "/settings", "/roles"];
      } else if (user.role === "MANAGER") {
        permissions = ["/", "/pos", "/products", "/categories", "/discounts", "/inventory", "/purchases", "/suppliers", "/customers", "/orders"];
      } else {
        permissions = ["/pos"];
      }
    }

    // Update user object with the latest permissions
    user.permissions = permissions;

    const response = NextResponse.json({ user });

    // Refresh JWT with the latest permissions
    const token = await signJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Session GET error:", error);
    return NextResponse.json({ user });
  }
}
