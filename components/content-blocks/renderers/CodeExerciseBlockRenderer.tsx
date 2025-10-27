"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CodeExerciseContent } from "@/lib/content-blocks";
import {
  CheckCircle2,
  RefreshCw,
  XCircle,
  Eye,
  EyeOff,
  Play,
  Trophy,
} from "lucide-react";
import { useLessonProgress } from "../LessonProgressContext";

interface CodeExerciseBlockRendererProps {
  content: CodeExerciseContent;
  blockId: string;
}

type TestOutcome = {
  description: string;
  status: "pass" | "fail";
  message?: string;
};

type RunnerLog = {
  id: number;
  type: "log" | "warn" | "error";
  message: string;
};

export function CodeExerciseBlockRenderer({
  content,
  blockId,
}: CodeExerciseBlockRendererProps) {
  const [userCode, setUserCode] = useState(content.starterCode || "");
  const [runnerOutput, setRunnerOutput] = useState<RunnerLog[]>([]);
  const [testResults, setTestResults] = useState<TestOutcome[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [runToken, setRunToken] = useState(0);
  const runTokenRef = useRef(runToken);
  const runnerContainerRef = useRef<HTMLDivElement | null>(null);

  const lessonProgress = useLessonProgress();
  const {
    updateBlockProgress,
    isBlockCompleted,
    resetSignal = 0,
  } = lessonProgress;
  const getBlockProgress = lessonProgress.getBlockProgress ?? (() => undefined);

  const blockProgress = useMemo(
    () => getBlockProgress(blockId),
    [getBlockProgress, blockId]
  );
  const storedState = useMemo(() => {
    const metadata = blockProgress?.metadata;
    if (metadata && typeof metadata === "object" && metadata !== null) {
      const state = (metadata as Record<string, unknown>).state;
      if (state && typeof state === "object") {
        return state as {
          userCode?: string;
          runnerOutput?: RunnerLog[];
          testResults?: TestOutcome[];
          showSolution?: boolean;
        };
      }
    }
    return undefined;
  }, [blockProgress]);
  const hydratedRef = useRef(false);
  const persistedCompleted = blockProgress?.completed ?? false;
  const isCompleted = isBlockCompleted(blockId) || persistedCompleted;

  useEffect(() => {
    if (hydratedRef.current) return;

    if (storedState) {
      if (typeof storedState.userCode === "string") {
        setUserCode(storedState.userCode);
      }
      if (Array.isArray(storedState.testResults)) {
        setTestResults(storedState.testResults);
      }
      if (Array.isArray(storedState.runnerOutput)) {
        setRunnerOutput(storedState.runnerOutput);
      }
      if (typeof storedState.showSolution === "boolean") {
        setShowSolution(storedState.showSolution);
      }
    }

    hydratedRef.current = true;
  }, [storedState]);

  useEffect(() => {
    if (!hydratedRef.current) return;

    const metaState = {
      userCode,
      runnerOutput,
      testResults,
      showSolution,
    };

    const timeout = setTimeout(() => {
      updateBlockProgress(blockId, {
        metadata: {
          state: metaState,
        },
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [userCode, runnerOutput, testResults, showSolution, blockId, updateBlockProgress]);

  useEffect(() => {
    if (resetSignal === 0) return;
    setUserCode(content.starterCode || "");
    setRunnerOutput([]);
    setTestResults([]);
    setShowSolution(false);
    setRunToken(0);
  }, [resetSignal, content.starterCode]);

  useEffect(() => {
    runTokenRef.current = runToken;
  }, [runToken]);

  useEffect(() => {
    if (runnerOutput.length > 0 || testResults.length > 0) {
      runnerContainerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [runnerOutput, testResults]);

  // Update progress when tests complete
  useEffect(() => {
    if (testResults.length > 0 && !isRunning) {
      const passedCount = testResults.filter(
        (test) => test.status === "pass"
      ).length;
      const totalTests = tests.length;
      const allPassed = passedCount === totalTests;

      const maxScore = 20; // Code exercises are worth more points
      const score = Math.floor((passedCount / totalTests) * maxScore);

      updateBlockProgress(
        blockId,
        {
          completed: allPassed,
          score,
          maxScore,
        },
        { incrementAttempt: true }
      );
    }
  }, [testResults, isRunning, blockId, updateBlockProgress]);

  const tests = useMemo(
    () =>
      (content.tests || []).map((test) => ({
        description: test.description,
        code: test.code,
      })),
    [content.tests]
  );
  const hasTests = tests.length > 0;
  const heading = content.title?.trim() || "Code exercise";
  const prompt =
    content.prompt?.trim() ||
    "Review the instructions and complete the starter code.";

  const runnerHtml = useMemo(() => {
    if (!hasTests) return "";
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <script>
      const runId = ${JSON.stringify(runToken)};
      const send = (type, payload) => {
        parent.postMessage({ source: "marshal-code-exercise", runId, type, payload }, "*");
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
        send("tests", []);
        send("done", "");
      };
      window.addEventListener("unhandledrejection", (event) => {
        const reason = event.reason;
        const formatted = reason && reason.stack ? reason.stack : String(reason);
        send("error", formatted);
        send("tests", []);
        send("done", "");
      });

      const tests = ${JSON.stringify(tests)};
      const userSource = ${JSON.stringify(userCode ?? "")};

      (async () => {
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const results = [];
        for (let i = 0; i < tests.length; i += 1) {
          const test = tests[i];
          try {
            const combined = \`\${userSource}\\nreturn (async function(assert){\\n\${test.code}\\n})(assert);\`;
            const runner = new AsyncFunction("assert", combined);
            const assert = (condition, message) => {
              if (!condition) {
                throw new Error(message || "Assertion failed");
              }
            };
            await runner(assert);
            results.push({ description: test.description || "Test " + (i + 1), status: "pass" });
          } catch (error) {
            const message = error && error.stack ? error.stack : String(error);
            results.push({ description: test.description || "Test " + (i + 1), status: "fail", message });
          }
        }
        send("tests", results);
        send("done", "");
      })();
    </script>
  </body>
</html>`;
  }, [tests, userCode, runToken, hasTests]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.source !== "marshal-code-exercise") return;
      if (data.runId !== runTokenRef.current) return;

      if (data.type === "done") {
        setIsRunning(false);
        return;
      }

      if (data.type === "tests") {
        setTestResults(Array.isArray(data.payload) ? data.payload : []);
        return;
      }

      if (
        data.type === "log" ||
        data.type === "warn" ||
        data.type === "error"
      ) {
        setRunnerOutput((previous) => [
          ...previous,
          {
            id: previous.length,
            type: data.type,
            message:
              typeof data.payload === "string"
                ? data.payload
                : typeof data.payload === "object"
                  ? JSON.stringify(data.payload)
                  : String(data.payload),
          },
        ]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleRunTests = useCallback(() => {
    if (!hasTests) {
      setRunnerOutput([
        {
          id: 0,
          type: "warn",
          message: "No automated tests were configured for this exercise.",
        },
      ]);
      setTestResults([]);
      return;
    }

    setRunnerOutput([
      {
        id: 0,
        type: "log",
        message: "Running tests...",
      },
    ]);
    setTestResults([]);
    setIsRunning(true);
    setRunToken((previous) => {
      const next = previous + 1;
      runTokenRef.current = next;
      return next;
    });
  }, [hasTests]);

  const handleReset = () => {
    setUserCode(content.starterCode || "");
    setRunnerOutput([]);
    setTestResults([]);
  };

  const passedCount = testResults.filter(
    (test) => test.status === "pass"
  ).length;
  const failedCount = testResults.filter(
    (test) => test.status === "fail"
  ).length;

  return (
    <div className="space-y-6 rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b bg-muted/40 px-4 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold">{heading}</p>
            {isCompleted && (
              <Badge variant="secondary">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {prompt}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Trophy className="h-3 w-3" />
            20 points
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
          {content.solution && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSolution((prev) => !prev)}
              className="gap-2"
            >
              {showSolution ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide solution
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Show solution
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="px-4">
        <Textarea
          value={userCode}
          onChange={(event) => setUserCode(event.target.value)}
          className="font-mono text-sm leading-6 min-h-[240px]"
          placeholder="// Write your solution here"
        />
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {hasTests
              ? `${tests.length} test${tests.length === 1 ? "" : "s"} available`
              : "No automated tests"}
          </span>
          <Button
            variant="default"
            size="sm"
            onClick={handleRunTests}
            disabled={isRunning}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            {isRunning ? "Running…" : "Run tests"}
          </Button>
        </div>
      </div>

      {content.solution && showSolution && (
        <div className="mx-4 rounded-md border bg-muted/40 px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Reference solution
          </p>
          <pre className="overflow-auto whitespace-pre-wrap font-mono text-xs leading-5">
            {content.solution}
          </pre>
        </div>
      )}

      <div
        ref={runnerContainerRef}
        className="space-y-6 border-t px-4 py-4 text-xs font-mono"
      >
        <div className="space-y-2">
          <p className="text-muted-foreground">
            Console output (scroll if the log is long):
          </p>
          {runnerOutput.length === 0 ? (
            <div className="rounded border border-dashed px-3 py-2 text-muted-foreground">
              {isRunning
                ? "Running tests…"
                : "Console logs will appear here when you run the tests."}
            </div>
          ) : (
            <div className="space-y-2">
              {runnerOutput.map((entry) => (
                <div
                  key={`${blockId}-output-${entry.id}`}
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
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>Test results</span>
            {hasTests && testResults.length > 0 && (
              <Badge variant={failedCount > 0 ? "destructive" : "default"}>
                {passedCount}/{tests.length} passed
              </Badge>
            )}
          </div>
          {testResults.length === 0 ? (
            <p className="text-muted-foreground">
              {hasTests
                ? "Run the tests to see which checks pass."
                : "This exercise does not include automated tests."}
            </p>
          ) : (
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={`${blockId}-test-${index}`}
                  className={cn(
                    "flex flex-col gap-2 rounded border px-3 py-2",
                    result.status === "pass"
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-destructive/50 bg-destructive/10"
                  )}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {result.status === "pass" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive-foreground" />
                    )}
                    <span>{result.description}</span>
                  </div>
                  {result.message && (
                    <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
                      {result.message}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {hasTests && runToken > 0 && (
          <iframe
            key={`code-exercise-runner-${runToken}`}
            title={`Code exercise runner ${blockId}`}
            sandbox="allow-scripts allow-same-origin"
            srcDoc={runnerHtml}
            className="hidden"
          />
        )}
      </div>
    </div>
  );
}
