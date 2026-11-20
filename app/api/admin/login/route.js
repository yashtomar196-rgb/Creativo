import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { comparePassword } from "../../../../lib/password";
import { signSession, ADMIN_COOKIE } from "../../../../lib/auth";

export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } });

  if (!admin) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  if (admin.status === "DISABLED") {
    return NextResponse.json({ error: "This admin account has been disabled." }, { status: 403 });
  }

  const valid = await comparePassword(password, admin.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = await signSession({ type: "admin", id: admin.id, role: admin.role });

  const res = NextResponse.json({
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
