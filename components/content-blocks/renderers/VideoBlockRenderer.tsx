"use client";

import { VideoContent } from "@/lib/content-blocks";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { BookIcon } from "lucide-react";

interface VideoBlockRendererProps {
  content: VideoContent;
  blockId: string;
}

export function VideoBlockRenderer({ content, blockId }: VideoBlockRendererProps) {
  const videoUrl = useConstructUrl(content.videoKey || "");
  const thumbnailUrl = useConstructUrl(content.thumbnailKey || "");

  if (!content.videoKey) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
        <BookIcon className="size-16 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">
          This video is not available yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {content.title && (
        <h3 className="text-lg font-semibold">{content.title}</h3>
      )}
      <div className="aspect-video bg-black rounded-lg relative overflow-hidden">
        <video
          className="w-full h-full object-cover"
          controls
          poster={thumbnailUrl}
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
          <source src={videoUrl} type="video/ogg" />
          Your browser does not support the video tag.
        </video>
      </div>
      {content.description && (
        <p className="text-muted-foreground">{content.description}</p>
      )}
    </div>
  );
}