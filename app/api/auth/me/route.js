import { NextResponse } from "next/server";
import { getCustomer } from "../../../../lib/requireAdmin";

export async function GET() {
  const customer = await getCustomer();
  if (!customer) return NextResponse.json({ customer: null });
  return NextResponse.json({ customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } });
}
