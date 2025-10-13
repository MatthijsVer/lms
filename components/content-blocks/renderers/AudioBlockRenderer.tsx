"use client";

import { useState } from "react";
import { AudioContent } from "@/lib/content-blocks";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { ChevronDown, ChevronUp, Music } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioBlockRendererProps {
  content: AudioContent;
  blockId: string;
}

export function AudioBlockRenderer({ content, blockId }: AudioBlockRendererProps) {
  const [showTranscript, setShowTranscript] = useState(
    content.shouldShowTranscript !== false
  );
  const audioUrl = content.audioKey ? useConstructUrl(content.audioKey) : "";

  if (!content.audioKey) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 p-6 text-center">
        <Music className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          Audio file unavailable
        </p>
        <p className="mt-1 text-xs text-muted-foreground/80">
          This content block requires an audio upload.
        </p>
      </div>
    );
  }

  const heading = content.title?.trim() || "Audio lesson";
  const headingId = `audio-block-${blockId}-title`;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-base font-medium" id={headingId}>
          {heading}
        </p>
        {content.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {content.description}
          </p>
        )}
      </div>

      <div className="rounded-lg border bg-card/70 p-4 shadow-sm">
        <audio
          controls
          preload="none"
          src={audioUrl}
          className="w-full"
          aria-labelledby={headingId}
        >
          Your browser does not support the audio element.
        </audio>
      </div>

      {content.transcript && (
        <div className="rounded-lg border bg-muted/30">
          <button
            type="button"
            onClick={() => setShowTranscript((prev) => !prev)}
            className={cn(
              "flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
            aria-expanded={showTranscript}
          >
            <span>Transcript</span>
            {showTranscript ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {showTranscript && (
            <div className="border-t px-4 py-3 text-sm leading-6 text-muted-foreground whitespace-pre-wrap">
              {content.transcript}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
