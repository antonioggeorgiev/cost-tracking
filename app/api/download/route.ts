import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userService } from "@/server/services/user-service";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Authenticate user
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await userService.syncFromClerk(clerkUser);

  // Find the attachment and verify the user has access to its workspace
  const attachment = await db.expenseAttachment.findFirst({
    where: { url, deletedAt: null },
    include: {
      expense: {
        select: {
          workspace: {
            select: {
              memberships: {
                where: { userId: user.id },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  if (!attachment || attachment.expense.workspace.memberships.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // Fetch private blob using the read-write token
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("Content-Type") || attachment.contentType || "application/octet-stream";

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(arrayBuffer.byteLength),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
