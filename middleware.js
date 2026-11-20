import { NextResponse } from "next/server";
import { verifySession, ADMIN_COOKIE } from "./lib/auth";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Everything under /admin except the login page itself requires a valid session
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    const session = await verifySession(token);

    if (!session || session.type !== "admin") {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
