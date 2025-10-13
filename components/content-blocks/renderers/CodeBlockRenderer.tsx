"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const runnableLanguages = new Set<string>(["javascript"]);

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
  const [runnerOutput, setRunnerOutput] = useState<
    { id: number; type: "log" | "warn" | "error"; message: string }[]
  >([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runToken, setRunToken] = useState(0);
  const runTokenRef = useRef(runToken);
  const runnerContainerRef = useRef<HTMLDivElement | null>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout>();
  const { resolvedTheme } = useTheme();
  const theme =
    resolvedTheme === "dark" ? SHIKI_THEMES.dark : SHIKI_THEMES.light;

  useEffect(() => {
    runTokenRef.current = runToken;
  }, [runToken]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (runnerOutput.length > 0) {
      runnerContainerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [runnerOutput]);

  const rawLanguage = content.language?.trim();
  const resolvedLanguage = useMemo(
    () => resolveLanguage(rawLanguage),
    [rawLanguage]
  );
  const languageLabel = formatLanguageLabel(rawLanguage ?? resolvedLanguage);
  const isRunnable = Boolean(content.runnable);
  const canRun = isRunnable && runnableLanguages.has(resolvedLanguage);

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

  const runnerHtml = useMemo(() => {
    if (!canRun) return "";
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <script>
      const runId = ${JSON.stringify(runToken)};
      const send = (type, message) => {
        parent.postMessage({ source: "marshal-code-runner", runId, type, message }, "*");
      };

      const stringify = (value) => {
        try {
          if (typeof value === "string") return value;
          if (typeof value === "object") return JSON.stringify(value, null, 2);
          return String(value);
        } catch (error) {
          return String(value);
        }
      };

      ["log", "info"].forEach((method) => {
        const original = console[method];
        console[method] = (...args) => {
          send("log", args.map(stringify).join(" "));
          original.apply(console, args);
        };
      });
      ["warn"].forEach((method) => {
        const original = console[method];
        console[method] = (...args) => {
          send("warn", args.map(stringify).join(" "));
          original.apply(console, args);
        };
      });
      ["error"].forEach((method) => {
        const original = console[method];
        console[method] = (...args) => {
          send("error", args.map(stringify).join(" "));
          original.apply(console, args);
        };
      });

      window.onerror = (message, source, lineno, colno, error) => {
        const formatted = error && error.stack ? error.stack : message + " (" + lineno + ":" + colno + ")";
        send("error", formatted);
        send("done", "");
      };
      window.addEventListener("unhandledrejection", (event) => {
        const reason = event.reason;
        const formatted = reason && reason.stack ? reason.stack : String(reason);
        send("error", formatted);
        send("done", "");
      });

      const originalAppendChild = document.body.appendChild.bind(document.body);
      document.body.appendChild = (node) => {
        try {
          const text = (node && (node.textContent || node.innerText)) || "";
          if (text.trim().length) {
            send("log", text);
          }
        } catch (error) {
          send("warn", "Unable to read appended node: " + String(error));
        }
        return originalAppendChild(node);
      };

      (async () => {
        const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
        try {
          const userCode = ${JSON.stringify(content.code ?? "")};
          const runner = new AsyncFunction(userCode);
          const result = await runner();
          if (typeof result !== "undefined") {
            send("log", stringify(result));
          }
          send("done", "");
        } catch (error) {
          send("error", error && error.stack ? error.stack : String(error));
          send("done", "");
        }
      })();
    </script>
  </body>
</html>`;
  }, [canRun, runToken, content.code]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.source !== "marshal-code-runner") return;
      if (data.runId !== runTokenRef.current) return;

      if (data.type === "done") {
        setIsRunning(false);
        setRunnerOutput((previous) => {
          if (
            previous.length === 0 ||
            (previous.length === 1 && previous[0]?.message === "Running...")
          ) {
            return [
              {
                id: 0,
                type: "log",
                message: "Execution finished with no console output.",
              },
            ];
          }
          return previous;
        });
        return;
      }

      if (
        data.type === "log" ||
        data.type === "warn" ||
        data.type === "error"
      ) {
        setRunnerOutput((previous) => {
          const base =
            previous.length === 1 && previous[0]?.message === "Running..."
              ? []
              : previous;
          return [
            ...base,
            {
              id: base.length,
              type: data.type,
              message:
                typeof data.message === "string"
                  ? data.message
                  : String(data.message),
            },
          ];
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

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

  const handleRun = useCallback(() => {
    if (!isRunnable) {
      return;
    }

    if (!canRun) {
      setRunnerOutput([
        {
          id: 0,
          type: "error",
          message: "This language is not supported by the in-browser runner.",
        },
      ]);
      return;
    }

    setRunnerOutput([
      {
        id: 0,
        type: "log",
        message: "Running...",
      },
    ]);
    setIsRunning(true);
    setRunToken((previous) => {
      const next = previous + 1;
      runTokenRef.current = next;
      return next;
    });
  }, [isRunnable, canRun]);

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
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="gap-2 text-xs"
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
          {content.runnable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRun}
              disabled={isRunning}
              className="gap-2 text-xs"
              aria-label="Run code snippet"
            >
              {isRunning ? (
                <>
                  <span className="h-2 w-2 animate-ping rounded-full bg-primary" />
                  Running…
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-primary/80" />
                  Run
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        {highlightHtml ? (
          <div
            className={cn(
              "code-block-highlight overflow-auto whitespace-pre text-sm leading-6",
              "bg-muted text-slate-100",
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
              "bg-muted text-slate-100",
              "px-4 py-4 font-mono",
              expanded ? "max-h-full" : "max-h-[90vh]",
              highlightError ? "" : "opacity-60"
            )}
            id={`code-block-${blockId}`}
            data-language={resolvedLanguage}
          >
            <code className="block text-muted-foreground">{content.code}</code>
          </pre>
        )}
      </div>

      {content.runnable && !canRun && (
        <div className="border-t bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          Runnable snippets currently support JavaScript only.
        </div>
      )}

      {content.runnable && (
        <div
          ref={runnerContainerRef}
          className="border-t px-4 py-4 text-xs font-mono"
        >
          {runnerOutput.length === 0 ? (
            <p className="text-muted-foreground">
              {isRunning
                ? "Running…"
                : "Click Run to execute this snippet in a sandboxed environment."}
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Output below (scroll if the log is long):
              </p>
              {runnerOutput.map((entry) => (
                <div
                  key={`${blockId}-run-${entry.id}`}
                  className={cn(
                    "rounded border px-3 py-2 whitespace-pre-wrap",
                    entry.type === "error"
                      ? "border-destructive/50 bg-destructive/10 text-destructive-foreground"
                      : entry.type === "warn"
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-700"
                        : "border-muted bg-muted/40 text-foreground"
                  )}
                >
                  {entry.message}
                </div>
              ))}
            </div>
          )}
          {canRun && runToken > 0 && (
            <iframe
              key={`runner-${runToken}`}
              title={`Code runner ${blockId}`}
              sandbox="allow-scripts allow-same-origin"
              srcDoc={runnerHtml}
              className="hidden"
            />
          )}
        </div>
      )}
    </div>
  );
}
