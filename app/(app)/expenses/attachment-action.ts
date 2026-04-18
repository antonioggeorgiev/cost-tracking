"use server";

import { db } from "@/lib/db";

export async function saveAttachmentsAction(
  expenseId: string,
  attachments: Array<{ fileName: string; fileSize: number; contentType: string; url: string; imageWidth?: number | null; imageHeight?: number | null }>,
) {
  for (const attachment of attachments) {
    await db.expenseAttachment.create({
      data: {
        expenseId,
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
        contentType: attachment.contentType,
        url: attachment.url,
        imageWidth: attachment.imageWidth ?? null,
        imageHeight: attachment.imageHeight ?? null,
      },
    });
  }
}
