import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/requireAdmin";
import { ROLE_PERMISSIONS } from "../../../../lib/permissions";

export async function GET() {
  const { admin, error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  return NextResponse.json({
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    permissions: ROLE_PERMISSIONS[admin.role] || [],
  });
}
