import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/requireAdmin";

function serialize(p) {
  return {
    ...p,
    badges: JSON.parse(p.badges || "[]"),
    variants: JSON.parse(p.variants || "[]"),
    specs: JSON.parse(p.specs || "[]"),
  };
}

export async function GET(request, { params }) {
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ product: serialize(product) });
}

export async function PATCH(request, { params }) {
  const { error, status } = await requireAdmin("products");
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const data = {};
  for (const field of ["name", "category", "description", "img", "img2"]) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  for (const field of ["price", "mrp", "stock"]) {
    if (body[field] !== undefined) data[field] = Number(body[field]);
  }
  if (body.customizable !== undefined) data.customizable = !!body.customizable;
  for (const field of ["badges", "variants", "specs"]) {
    if (body[field] !== undefined) data[field] = JSON.stringify(body[field]);
  }

  const product = await prisma.product.update({ where: { id: params.id }, data });
  return NextResponse.json({ product: serialize(product) });
}

export async function DELETE(request, { params }) {
  const { error, status } = await requireAdmin("products");
  if (error) return NextResponse.json({ error }, { status });

  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
