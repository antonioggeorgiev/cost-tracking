"use client";

import Image from "next/image";
import { Download, FileText, Image as ImageIcon, Paperclip, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize, isImageContentType } from "@/lib/file-utils";

type Props = {
  attachment: {
    id: string;
    fileName: string;
    fileSize: number;
    contentType: string;
    url: string;
    imageWidth: number | null;
    imageHeight: number | null;
  } | null;
  canManage: boolean;
  isPending: boolean;
  isUploadingFile: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  replaceFileInputRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (file: File) => void;
  onReplace: (attachmentId: string, file: File) => void;
  onDelete: (attachmentId: string) => void;
};

export function ExpenseAttachmentSection({
  attachment,
  canManage,
  isPending,
  isUploadingFile,
  fileInputRef,
  replaceFileInputRef,
  onUpload,
  onReplace,
  onDelete,
}: Props) {
  return (
    <section className="rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="font-heading text-base font-semibold text-heading">Attachment</h2>
        {canManage ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUpload(file);
                event.target.value = "";
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending || isUploadingFile || !!attachment}
              title={attachment ? "Limited to 1 file per expense" : undefined}
            >
              <Paperclip size={14} data-icon="inline-start" />
              {isUploadingFile ? "Uploading..." : "Attach file"}
            </Button>
          </>
        ) : null}
      </div>

      <div className="border-t border-border px-6 py-4">
        {attachment ? (
          <div className="overflow-hidden rounded-lg border border-border">
            {isImageContentType(attachment.contentType) && attachment.imageWidth && attachment.imageHeight ? (
              <div className="border-b border-border bg-muted/40 p-4">
                <Image
                  src={`/api/download?url=${encodeURIComponent(attachment.url)}`}
                  alt={attachment.fileName}
                  width={attachment.imageWidth}
                  height={attachment.imageHeight}
                  className="mx-auto max-h-96 w-auto rounded object-contain"
                  unoptimized
                />
              </div>
            ) : null}

            <div className="flex items-center justify-between bg-surface-secondary/50 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                {isImageContentType(attachment.contentType) ? (
                  <ImageIcon size={20} className="shrink-0 text-primary" />
                ) : (
                  <FileText size={20} className="shrink-0 text-primary" />
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium text-heading">{attachment.fileName}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={`/api/download?url=${encodeURIComponent(attachment.url)}`}
                  download={attachment.fileName}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  title="Download file"
                >
                  <Download size={14} />
                </a>
                {canManage ? (
                  <>
                    <input
                      ref={replaceFileInputRef}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) onReplace(attachment.id, file);
                        event.target.value = "";
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => replaceFileInputRef.current?.click()}
                      disabled={isPending || isUploadingFile}
                      title="Replace file"
                    >
                      <RefreshCw size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDelete(attachment.id)}
                      disabled={isPending || isUploadingFile}
                      title="Delete file"
                    >
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">No file attached to this expense.</p>
        )}
      </div>
    </section>
  );
}
