import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];

export async function POST(request) {
  const maxMb = Number(process.env.MAX_UPLOAD_MB || 10);
  const maxBytes = maxMb * 1024 * 1024;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only PNG, JPG or PDF files are allowed." }, { status: 400 });
  }
  if (file.size > maxBytes) {
    return NextResponse.json({ error: `File is too large — max ${maxMb}MB.` }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || (file.type === "application/pdf" ? ".pdf" : ".jpg");
  const safeName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, safeName), bytes);

  return NextResponse.json({
    url: `/uploads/${safeName}`,
    fileName: file.name,
    size: file.size,
  });
}
