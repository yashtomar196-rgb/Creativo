import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { hashPassword } from "../../../../../lib/password";
import { requireAdmin } from "../../../../../lib/requireAdmin";
import { canDeleteManagedRole } from "../../../../../lib/permissions";

export async function PATCH(request, { params }) {
  const { admin: me, error, status } = await requireAdmin("admins");
  if (error) return NextResponse.json({ error }, { status });

  const target = await prisma.adminUser.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Admin not found." }, { status: 404 });
  if (target.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "The Super Admin account can't be edited from here." }, { status: 403 });
  }

  const body = await request.json();
  const data = {};

  if (body.email) {
    const existing = await prisma.adminUser.findUnique({ where: { email: body.email.toLowerCase().trim() } });
    if (existing && existing.id !== target.id) {
      return NextResponse.json({ error: "Another admin already uses this email." }, { status: 409 });
    }
    data.email = body.email.toLowerCase().trim();
  }
  if (body.password) {
    if (body.password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    data.passwordHash = await hashPassword(body.password);
  }
  if (body.status && ["ACTIVE", "DISABLED"].includes(body.status)) {
    data.status = body.status;
  }
  if (body.name) {
    data.name = body.name;
  }

  const updated = await prisma.adminUser.update({
    where: { id: target.id },
    data,
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
  });

  return NextResponse.json({ admin: updated });
}

export async function DELETE(request, { params }) {
  const { error, status } = await requireAdmin("admins");
  if (error) return NextResponse.json({ error }, { status });

  const target = await prisma.adminUser.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Admin not found." }, { status: 404 });
  if (target.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "The Super Admin account can't be deleted." }, { status: 403 });
  }
  if (!canDeleteManagedRole(target.role)) {
    return NextResponse.json({ error: "This role can only be disabled, not deleted." }, { status: 403 });
  }

  await prisma.adminUser.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}
