import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/requireAdmin";
import { getCustomer } from "../../../lib/requireAdmin";

export async function GET() {
  const { error, status } = await requireAdmin("orders");
  if (error) return NextResponse.json({ error }, { status });

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  return NextResponse.json({ orders });
}

export async function POST(request) {
  const body = await request.json();
  const { customerName, email, phone, address, items, payment } = body;

  if (!customerName || !email || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Customer details and at least one item are required." }, { status: 400 });
  }

  const customer = await getCustomer();

  const subtotal = items.reduce((sum, it) => sum + Number(it.price) * Number(it.qty), 0);
  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 79;
  const total = subtotal + shipping;
  const id = `CRV-${Date.now().toString().slice(-6)}`;

  const order = await prisma.order.create({
    data: {
      id,
      customerId: customer?.id || null,
      customerName,
      email,
      phone: phone || null,
      address: address || null,
      subtotal,
      shipping,
      total,
      // Cash on Delivery only — payment is collected on delivery, so it
      // starts "Pending" and an admin marks it "Paid" once collected.
      payment: "Pending",
      status: "Pending",
      items: {
        create: items.map((it) => ({
          productId: it.productId || null,
          name: it.name,
          variant: it.variant || null,
          qty: Number(it.qty),
          price: Number(it.price),
          customText: it.customText || null,
          customMsg: it.customMsg || null,
          fileUrl: it.fileUrl || null,
          fileName: it.fileName || null,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json({ order }, { status: 201 });
}
