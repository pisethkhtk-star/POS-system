import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { signJWT } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Fetch permissions for this role
    const rolePerm = await prisma.rolePermission.findUnique({
      where: { role: user.role },
    });

    // Default fallback permissions if not found in db
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

    const token = await signJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions,
      },
    });

    // Set HTTP-only cookie containing the JWT token
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
