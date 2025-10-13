"use client";

import { useMemo } from "react";
import { FileText, Download } from "lucide-react";
import { PdfContent } from "@/lib/content-blocks";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PdfBlockRendererProps {
  content: PdfContent;
  blockId: string;
}

export function PdfBlockRenderer({ content, blockId }: PdfBlockRendererProps) {
  const pdfUrl = useMemo(
    () => (content.pdfKey ? useConstructUrl(content.pdfKey) : ""),
    [content.pdfKey]
  );

  if (!content.pdfKey) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 p-6 text-center">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          PDF document unavailable
        </p>
        <p className="mt-1 text-xs text-muted-foreground/80">
          This content block requires a PDF upload.
        </p>
      </div>
    );
  }

  const heading = content.title?.trim() || "PDF document";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-medium">{heading}</p>
          {content.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {content.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${heading}`}
            >
              Open
            </a>
          </Button>
          {content.downloadable !== false && (
            <Button asChild size="sm">
              <a
                href={pdfUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Download ${heading}`}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button>
          )}
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-lg border bg-background shadow-sm",
          "aspect-[3/4] min-h-[400px] md:min-h-[480px]"
        )}
        id={`pdf-block-${blockId}`}
      >
        <iframe
          src={`${pdfUrl}#toolbar=1`}
          title={heading}
          className="h-full w-full"
          loading="lazy"
        />
      </div>
    </div>
  );
}
