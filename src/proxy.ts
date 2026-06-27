import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "./lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip proxy for static files, public assets, and non-page requests
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
  const user = token ? await verifyJWT(token) : null;

  // 2. Redirect to /login if trying to access a protected route without a token
  if (!user && pathname !== "/login") {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Redirect logged-in users away from /login
  if (user && pathname === "/login") {
    if (user.role === "CASHIER") {
      return NextResponse.redirect(new URL("/pos", request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 4. Role-based route protection
  if (user) {
    // Cashiers cannot access the admin dashboard, products list, reports, etc.
    // They are restricted to the POS terminal page (/pos)
    const adminPages = ["/products", "/inventory", "/orders", "/customers", "/suppliers", "/reports", "/settings"];
    const isDashboardRoot = pathname === "/";
    const isAdminPage = adminPages.some((page) => pathname.startsWith(page));

    if (user.role === "CASHIER" && (isDashboardRoot || isAdminPage)) {
      return NextResponse.redirect(new URL("/pos", request.url));
    }

    // Reports page is ADMIN only
    if (pathname.startsWith("/reports") && user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
