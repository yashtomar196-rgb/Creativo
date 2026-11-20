import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/requireAdmin";

function serialize(p) {
  return {
    ...p,
    badges: JSON.parse(p.badges || "[]"),
    variants: JSON.parse(p.variants || "[]"),
    specs: JSON.parse(p.specs || "[]"),
  };
}

export async function GET() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ products: products.map(serialize) });
}

export async function POST(request) {
  const { error, status } = await requireAdmin("products");
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  if (!body.name || !body.category || body.price == null || body.mrp == null) {
    return NextResponse.json({ error: "Name, category, price and MRP are required." }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name: body.name,
      category: body.category,
      price: Number(body.price),
      mrp: Number(body.mrp),
      stock: Number(body.stock ?? 100),
      badges: JSON.stringify(body.badges || ["New"]),
      img: body.img || "seed/newproduct/600/750",
      img2: body.img2 || body.img || "seed/newproduct2/600/750",
      description: body.description || "Freshly added product.",
      variants: JSON.stringify(body.variants || ["Default"]),
      customizable: !!body.customizable,
      specs: JSON.stringify(body.specs || ["Premium print stock"]),
    },
  });

  return NextResponse.json({ product: serialize(product) }, { status: 201 });
}
