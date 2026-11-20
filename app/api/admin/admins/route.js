import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { hashPassword } from "../../../../lib/password";
import { requireAdmin } from "../../../../lib/requireAdmin";

const ALLOWED_ROLES = ["ADMIN", "ORDER_MANAGER", "PRODUCT_MANAGER"];

export async function GET() {
  const { error, status } = await requireAdmin("admins");
  if (error) return NextResponse.json({ error }, { status });

  const admins = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
  });
  return NextResponse.json({ admins });
}

export async function POST(request) {
  const { error, status } = await requireAdmin("admins");
  if (error) return NextResponse.json({ error }, { status });

  const { name, email, password, role } = await request.json();

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Name, email, password and role are all required." }, { status: 400 });
  }
  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "That role can't be assigned here." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const existing = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) {
    return NextResponse.json({ error: "An admin with this email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const admin = await prisma.adminUser.create({
    data: { name, email: email.toLowerCase().trim(), passwordHash, role, status: "ACTIVE" },
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
  });

  return NextResponse.json({ admin }, { status: 201 });
}
