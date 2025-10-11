"use client";

import { ImageContent } from "@/lib/content-blocks";
import { useConstructUrl } from "@/hooks/use-construct-url";
import Image from "next/image";

interface ImageBlockRendererProps {
  content: ImageContent;
  blockId: string;
}

export function ImageBlockRenderer({ content, blockId }: ImageBlockRendererProps) {
  const imageUrl = useConstructUrl(content.imageKey || "");

  if (!content.imageKey) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
        <p className="text-muted-foreground">
          Image not available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative rounded-lg overflow-hidden">
        <Image
          src={imageUrl}
          alt={content.alt || "Course image"}
          width={800}
          height={600}
          className="w-full h-auto object-cover"
        />
      </div>
      {content.caption && (
        <p className="text-sm text-muted-foreground text-center italic">
          {content.caption}
        </p>
      )}
    </div>
  );
}