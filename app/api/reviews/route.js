import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/requireAdmin";
import { getCustomer } from "../../../lib/requireAdmin";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const wantsAll = searchParams.get("all") === "1";

  if (wantsAll) {
    const { error, status } = await requireAdmin("reviews");
    if (error) return NextResponse.json({ error }, { status });
    const reviews = await prisma.review.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ reviews });
  }

  const reviews = await prisma.review.findMany({ where: { status: "approved" }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ reviews });
}

export async function POST(request) {
  const body = await request.json();
  const { name, rating, text, productId, productName, photoUrl } = body;

  if (!name || !rating || !text) {
    return NextResponse.json({ error: "Name, rating and review text are required." }, { status: 400 });
  }

  const customer = await getCustomer();

  const review = await prisma.review.create({
    data: {
      customerId: customer?.id || null,
      name,
      rating: Number(rating),
      text,
      photoUrl: photoUrl || null,
      productId: productId || null,
      productName: productName || null,
      status: "pending",
    },
  });

  return NextResponse.json({ review }, { status: 201 });
}
