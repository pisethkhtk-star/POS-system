import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "./lib/auth";

function getMatchedPermissionPath(pathname: string): string | null {
  if (pathname === "/") return "/";

  // List of all protected section prefixes
  const paths = [
    "/pos",
    "/products",
    "/categories",
    "/discounts",
    "/inventory",
    "/purchases",
    "/suppliers",
    "/customers",
    "/orders",
    "/reports",
    "/users",
    "/settings",
    "/roles",
  ];

  for (const path of paths) {
    if (pathname === path || pathname.startsWith(path + "/")) {
      return path;
    }
  }

  return null;
}

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
    const permissions = user.permissions || [];
    const firstAllowed = permissions[0] || (user.role === "CASHIER" ? "/pos" : "/");
    return NextResponse.redirect(new URL(firstAllowed, request.url));
  }

  // 4. Dynamic route permission check
  if (user) {
    const permissions = user.permissions || [];
    const matchedPath = getMatchedPermissionPath(pathname);

    if (matchedPath && !permissions.includes(matchedPath)) {
      // User is not allowed to access this page. Redirect to their first allowed page.
      const firstAllowed = permissions[0] || (user.role === "CASHIER" ? "/pos" : "/");
      
      // Prevent infinite redirect loop
      if (firstAllowed !== pathname) {
        return NextResponse.redirect(new URL(firstAllowed, request.url));
      }
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
