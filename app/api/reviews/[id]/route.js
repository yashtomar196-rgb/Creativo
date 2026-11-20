import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/requireAdmin";

export async function PATCH(request, { params }) {
  const { error, status } = await requireAdmin("reviews");
  if (error) return NextResponse.json({ error }, { status });

  const { status: newStatus } = await request.json();
  if (!["approved", "rejected", "pending"].includes(newStatus)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const review = await prisma.review.update({ where: { id: params.id }, data: { status: newStatus } });
  return NextResponse.json({ review });
}
