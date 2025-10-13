"use client";

import { useMemo, useState } from "react";
import { ExerciseContent } from "@/lib/content-blocks";
import { Lightbulb, ChevronDown, ChevronUp, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseBlockRendererProps {
  content: ExerciseContent;
  blockId: string;
}

function sanitizeLines(value?: string | null) {
  if (!value) return "";
  return value.trim();
}

export function ExerciseBlockRenderer({
  content,
  blockId,
}: ExerciseBlockRendererProps) {
  const [showHints, setShowHints] = useState(false);
  const instructions = sanitizeLines(content.instructions) || "Instructions coming soon.";
  const expectedOutput = sanitizeLines(content.expectedOutput);
  const hints = useMemo(
    () => (content.hints ?? []).map((hint) => hint.trim()).filter(Boolean),
    [content.hints]
  );
  const hasHints = hints.length > 0;
  const headingId = `exercise-block-${blockId}-title`;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-base font-medium" id={headingId}>
          {content.title?.trim() || "Practice exercise"}
        </p>
      </div>

      <div className="rounded-lg border bg-card/70 p-5 text-sm leading-6 whitespace-pre-wrap">
        {instructions}
      </div>

      {expectedOutput && (
        <div className="rounded-lg border border-dashed bg-muted/40 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ClipboardCheck className="h-4 w-4" />
            Expected output
          </div>
          <div className="whitespace-pre-wrap text-sm text-muted-foreground">
            {expectedOutput}
          </div>
        </div>
      )}

      {hasHints && (
        <div className="rounded-lg border bg-muted/30">
          <button
            type="button"
            onClick={() => setShowHints((prev) => !prev)}
            className={cn(
              "flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
            aria-expanded={showHints}
          >
            <span className="inline-flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Hints
            </span>
            {showHints ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {showHints && (
            <div className="space-y-3 border-t px-4 py-3">
              {hints.map((hint, index) => (
                <div key={`${blockId}-hint-${index}`} className="rounded-md bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                  {hint}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
