import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/requireAdmin";

export async function GET(request, { params }) {
  const { error, status } = await requireAdmin("orders");
  if (error) return NextResponse.json({ error }, { status });

  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json({ order });
}

const STATUS_FLOW = ["Pending", "Printing", "Packed", "Dispatched", "Delivered"];

export async function PATCH(request, { params }) {
  const { error, status } = await requireAdmin("orders");
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const data = {};
  if (body.status && STATUS_FLOW.includes(body.status)) data.status = body.status;
  if (body.payment && ["Pending", "Paid"].includes(body.payment)) data.payment = body.payment;

  const order = await prisma.order.update({ where: { id: params.id }, data, include: { items: true } });
  return NextResponse.json({ order });
}
