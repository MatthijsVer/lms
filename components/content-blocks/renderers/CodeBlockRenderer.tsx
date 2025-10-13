"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { CodeContent } from "@/lib/content-blocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Copy, Maximize, Minimize } from "lucide-react";

interface CodeBlockRendererProps {
  content: CodeContent;
  blockId: string;
}

type BundledShiki = typeof import("shiki/bundle/web");
type Highlighter = Awaited<ReturnType<BundledShiki["getSingletonHighlighter"]>>;

const SHIKI_THEMES = {
  light: "github-light",
  dark: "github-dark",
} as const;

const languageAliases: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  tsx: "tsx",
  jsx: "jsx",
  sh: "bash",
  shell: "bash",
  "shell-session": "shell",
  shellsession: "shell",
  yml: "yaml",
  md: "markdown",
  py: "python",
  csharp: "csharp",
  "c#": "csharp",
  "c++": "cpp",
  cs: "csharp",
  html: "html",
  xml: "xml",
  rb: "ruby",
  rs: "rust",
  kt: "kotlin",
  ps1: "shell",
  powershell: "shell",
  plaintext: "plaintext",
  plain: "plaintext",
  text: "plaintext",
};

let highlighterPromise: Promise<Highlighter | null> | null = null;

function formatLanguageLabel(language?: string) {
  if (!language) return "Plain text";
  if (language.toLowerCase() === "plaintext") {
    return "Plain text";
  }
  return language
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function resolveLanguage(raw?: string | null) {
  if (!raw) return "plaintext";
  const normalized = raw.toLowerCase();
  return languageAliases[normalized] ?? normalized;
}

async function loadHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      try {
        const shiki = await import("shiki/bundle/web");
        await shiki.loadWasm();
        return shiki.getSingletonHighlighter({
          themes: [SHIKI_THEMES.light, SHIKI_THEMES.dark],
        });
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Failed to initialise code highlighter", error);
        }
        return null;
      }
    })();
  }

  return highlighterPromise;
}

export function CodeBlockRenderer({
  content,
  blockId,
}: CodeBlockRendererProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [highlightHtml, setHighlightHtml] = useState<string | null>(null);
  const [highlightError, setHighlightError] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout>();
  const { resolvedTheme } = useTheme();
  const theme =
    resolvedTheme === "dark" ? SHIKI_THEMES.dark : SHIKI_THEMES.light;

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const rawLanguage = content.language?.trim();
  const resolvedLanguage = useMemo(
    () => resolveLanguage(rawLanguage),
    [rawLanguage]
  );
  const languageLabel = formatLanguageLabel(rawLanguage ?? resolvedLanguage);

  useEffect(() => {
    if (!content.code) {
      return;
    }

    let cancelled = false;
    setHighlightHtml(null);
    setHighlightError(false);

    if (resolvedLanguage === "plaintext") {
      setHighlightError(true);
      return;
    }

    const highlight = async () => {
      const highlighter = await loadHighlighter();
      if (!highlighter) {
        if (!cancelled) {
          setHighlightError(true);
        }
        return;
      }

      try {
        if (
          resolvedLanguage !== "plaintext" &&
          !highlighter.getLoadedLanguages().includes(resolvedLanguage)
        ) {
          await highlighter.loadLanguage(resolvedLanguage);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `Missing syntax definition for ${resolvedLanguage}`,
            error
          );
        }
      }

      try {
        const html = highlighter.codeToHtml(content.code ?? "", {
          lang: resolvedLanguage,
          theme,
        });
        if (!cancelled) {
          setHighlightHtml(html);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Failed to render highlighted code", error);
        }
        if (!cancelled) {
          setHighlightError(true);
        }
      }
    };

    highlight();

    return () => {
      cancelled = true;
    };
  }, [content.code, resolvedLanguage, theme]);

  if (!content.code) {
    return null;
  }

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
          aria-label="Toggle code block size"
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
        {highlightHtml ? (
          <div
            className={cn(
              "code-block-highlight overflow-auto whitespace-pre text-sm leading-6",
              "bg-slate-950 text-slate-100 dark:bg-slate-900/90",
              "px-4 py-4 font-mono",
              expanded ? "max-h-full" : "max-h-[90vh]"
            )}
            id={`code-block-${blockId}`}
            data-language={resolvedLanguage}
            dangerouslySetInnerHTML={{ __html: highlightHtml }}
          />
        ) : (
          <pre
            className={cn(
              "overflow-auto whitespace-pre text-sm leading-6",
              "bg-muted text-slate-100 dark:bg-muted",
              "px-4 py-4 font-mono",
              expanded ? "max-h-full" : "max-h-[90vh]",
              highlightError ? "" : "opacity-60"
            )}
            id={`code-block-${blockId}`}
            data-language={resolvedLanguage}
          >
            <code className="block">{content.code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
