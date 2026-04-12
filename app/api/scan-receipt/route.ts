import { NextResponse } from "next/server";
import { receiptExtractionService } from "@/server/services/receipt-extraction-service";
import { getServerCaller } from "@/server/trpc-caller";

export async function POST(request: Request): Promise<NextResponse> {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const workspaceSlug = formData.get("workspaceSlug") as string | null;

  if (!file || !workspaceSlug) {
    return NextResponse.json({ error: "Missing file or workspaceSlug" }, { status: 400 });
  }

  const supportedTypes = [
    "image/",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
    "text/plain",
  ];

  const isSupported = supportedTypes.some((t) =>
    t.endsWith("/") ? file.type.startsWith(t) : file.type === t,
  );

  if (!isSupported) {
    return NextResponse.json(
      { error: "Unsupported file type. Please upload an image, PDF, or document." },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const caller = await getServerCaller();
    const categories = await caller.categories.list({ workspaceSlug });

    const categoryTree = categories.map((c) => ({
      id: c.id,
      name: c.name,
      children: c.children.map((child) => ({ id: child.id, name: child.name })),
    }));

    const result = await receiptExtractionService.extractFromFile(base64, file.type, categoryTree);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to scan receipt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
