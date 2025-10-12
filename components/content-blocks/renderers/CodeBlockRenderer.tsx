"use client";

import { useEffect, useRef, useState } from "react";
import { CodeContent } from "@/lib/content-blocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Copy, Maximize, Minimize } from "lucide-react";

interface CodeBlockRendererProps {
  content: CodeContent;
  blockId: string;
}

function formatLanguageLabel(language?: string) {
  if (!language) return "Plain text";
  return language
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function CodeBlockRenderer({
  content,
  blockId,
}: CodeBlockRendererProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  if (!content.code) {
    return null;
  }

  const language = content.language || "plaintext";
  const languageLabel = formatLanguageLabel(language);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content.code);
        setCopied(true);
        copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("Failed to copy code snippet", error);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-sm">
            {content.title?.trim() || "Code snippet"}
          </p>
          <Badge variant="outline" className="uppercase tracking-wide text-xs">
            {languageLabel}
          </Badge>
          {content.runnable && (
            <Badge variant="secondary" className="text-xs">
              Runnable
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="gap-2 ml-auto text-xs"
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((current) => !current)}
          className="gap-2 text-xs"
          aria-label="Copy code to clipboard"
        >
          {expanded ? (
            <>
              <Minimize className="h-4 w-4" />
              Shrink
            </>
          ) : (
            <>
              <Maximize className="h-4 w-4" />
              Expand
            </>
          )}
        </Button>
      </div>

      <div className="relative">
        <pre
          className={cn(
            "overflow-x-auto whitespace-pre text-sm leading-6",
            "bg-slate-950 text-slate-100 dark:bg-slate-900/90",
            "px-4 py-4 font-mono",
            expanded ? " max-h-full" : "max-h-[90vh]"
          )}
          id={`code-block-${blockId}`}
          data-language={language}
        >
          <code className={cn("block", `language-${language}`)}>
            {content.code}
          </code>
        </pre>
      </div>
    </div>
  );
}
