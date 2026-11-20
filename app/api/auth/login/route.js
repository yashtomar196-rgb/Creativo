import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { comparePassword } from "../../../../lib/password";
import { signSession, CUSTOMER_COOKIE } from "../../../../lib/auth";

export async function POST(request) {
  const { email, password } = await request.json();

  const customer = await prisma.customer.findUnique({ where: { email: (email || "").toLowerCase().trim() } });
  if (!customer) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  const valid = await comparePassword(password, customer.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = await signSession({ type: "customer", id: customer.id });
  const res = NextResponse.json({ customer: { id: customer.id, name: customer.name, email: customer.email } });
  res.cookies.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
