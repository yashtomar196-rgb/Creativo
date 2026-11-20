import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/requireAdmin";

export async function GET() {
  const { error, status } = await requireAdmin("reviews");
  if (error) return NextResponse.json({ error }, { status });

  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ leads: leads.map((l) => ({ ...l, interests: JSON.parse(l.interests || "[]") })) });
}

export async function POST(request) {
  const body = await request.json();
  const { name, email, phone, eventType, qty } = body;

  if (!name || !email || !phone || !eventType || !qty) {
    return NextResponse.json({ error: "Name, email, phone, event type and quantity are required." }, { status: 400 });
  }

  const lead = await prisma.lead.create({
    data: {
      name,
      company: body.company || null,
      email,
      phone,
      eventType,
      interests: JSON.stringify(body.interests || []),
      qty,
      message: body.message || null,
      status: "New",
    },
  });

  return NextResponse.json({ lead }, { status: 201 });
}
