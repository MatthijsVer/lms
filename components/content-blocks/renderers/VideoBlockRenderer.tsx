"use client";

import { VideoContent } from "@/lib/content-blocks";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { BookIcon } from "lucide-react";

interface VideoBlockRendererProps {
  content: VideoContent;
}

// Helper function to detect video type from URL
function getVideoType(url: string): "youtube" | "vimeo" | "direct" | null {
  if (!url) return null;

  // YouTube detection
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return "youtube";
  }

  // Vimeo detection
  if (url.includes("vimeo.com")) {
    return "vimeo";
  }

  // Direct video link
  if (
    url.match(/\.(mp4|webm|ogg)$/i) ||
    url.startsWith("blob:") ||
    url.startsWith("http")
  ) {
    return "direct";
  }

  return null;
}

// Extract YouTube video ID
function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Extract Vimeo video ID
function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

export function VideoBlockRenderer({ content }: VideoBlockRendererProps) {
  const videoUrl = useConstructUrl(content.videoKey || "");
  const thumbnailUrl = useConstructUrl(content.thumbnailKey || "");

  // Determine video source (uploaded file or URL)
  const sourceUrl = content.videoUrl || videoUrl;
  const videoType = getVideoType(sourceUrl);

  if (!content.videoKey && !content.videoUrl) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
        <BookIcon className="size-16 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">This video is not available yet</p>
      </div>
    );
  }

  // Render YouTube embed
  if (videoType === "youtube") {
    const videoId = getYouTubeId(sourceUrl);
    if (!videoId) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
          <BookIcon className="size-16 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Invalid YouTube URL</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {content.title && (
          <h3 className="text-lg font-semibold">{content.title}</h3>
        )}
        <div className="aspect-video bg-black rounded-lg relative overflow-hidden">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}`}
            title={content.title || "YouTube video player"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        {content.description && (
          <p className="text-muted-foreground">{content.description}</p>
        )}
      </div>
    );
  }

  // Render Vimeo embed
  if (videoType === "vimeo") {
    const videoId = getVimeoId(sourceUrl);
    if (!videoId) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
          <BookIcon className="size-16 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Invalid Vimeo URL</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {content.title && (
          <h3 className="text-lg font-semibold">{content.title}</h3>
        )}
        <div className="aspect-video bg-black rounded-lg relative overflow-hidden">
          <iframe
            className="w-full h-full"
            src={`https://player.vimeo.com/video/${videoId}`}
            title={content.title || "Vimeo video player"}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
        {content.description && (
          <p className="text-muted-foreground">{content.description}</p>
        )}
      </div>
    );
  }

  // Render direct video (uploaded file or direct link)
  return (
    <div className="space-y-4">
      {content.title && (
        <h3 className="text-lg font-semibold">{content.title}</h3>
      )}
      <div className="aspect-video bg-black rounded-lg relative overflow-hidden">
        <video
          className="w-full h-full object-cover"
          controls
          poster={thumbnailUrl || undefined}
        >
          <source src={sourceUrl} type="video/mp4" />
          <source src={sourceUrl} type="video/webm" />
          <source src={sourceUrl} type="video/ogg" />
          Your browser does not support the video tag.
        </video>
      </div>
      {content.description && (
        <p className="text-muted-foreground">{content.description}</p>
      )}
    </div>
  );
}
