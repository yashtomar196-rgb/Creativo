import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { verifySession, ADMIN_COOKIE, CUSTOMER_COOKIE } from "./auth";
import { canAccess } from "./permissions";

// Verifies the admin session cookie against the database (so a disabled or
// deleted account is rejected immediately, even if their token hasn't expired
// yet). Optionally checks the admin's role has access to `section`.
export async function requireAdmin(section) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session || session.type !== "admin") {
    return { error: "Not signed in.", status: 401 };
  }

  const admin = await prisma.adminUser.findUnique({ where: { id: session.id } });
  if (!admin || admin.status === "DISABLED") {
    return { error: "This admin account is no longer active.", status: 403 };
  }

  if (section && !canAccess(admin.role, section)) {
    return { error: "You don't have permission to do this.", status: 403 };
  }

  return { admin };
}

export async function getCustomer() {
  const token = cookies().get(CUSTOMER_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session || session.type !== "customer") return null;
  return prisma.customer.findUnique({ where: { id: session.id } });
}
