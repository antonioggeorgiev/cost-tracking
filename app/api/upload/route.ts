import { put } from "@vercel/blob";
import sharp from "sharp";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const blob = await put(file.name, file, {
    access: "private",
    addRandomSuffix: true,
  });

  let imageWidth: number | null = null;
  let imageHeight: number | null = null;

  if (file.type.startsWith("image/")) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const metadata = await sharp(buffer).metadata();
      imageWidth = metadata.width ?? null;
      imageHeight = metadata.height ?? null;
    } catch {
      // Non-critical — dimensions will be null
    }
  }

  return NextResponse.json({
    url: blob.url,
    fileName: file.name,
    fileSize: file.size,
    contentType: file.type,
    imageWidth,
    imageHeight,
  });
}
