"use client";

import { MatchingContent } from "@/lib/content-blocks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Link2,
  Trophy,
  HelpCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Timer,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  useLessonProgress,
  useBlockPersistentState,
} from "../LessonProgressContext";

interface MatchingBlockRendererProps {
  content: MatchingContent;
  blockId: string;
  lessonId: string;
}

interface Connection {
  leftIndex: number;
  rightIndex: number;
}

interface Point {
  x: number;
  y: number;
}

export function MatchingBlockRenderer({
  content,
  blockId,
  lessonId: _lessonId,
}: MatchingBlockRendererProps) {
  void _lessonId;
  const pairs = content.pairs || [];
  const initialRightOrder = useMemo(() => {
    if (content.shuffleItems) {
      const indices = Array.from({ length: pairs.length }, (_, i) => i);
      return indices.sort(() => Math.random() - 0.5);
    }
    return Array.from({ length: pairs.length }, (_, i) => i);
  }, [content.shuffleItems, pairs.length]);

  const [blockState, setBlockState] = useBlockPersistentState(blockId, {
    connections: [] as Connection[],
    submitted: false,
    showHints: {} as Record<string, boolean>,
    rightOrderMap: initialRightOrder,
  });

  const connections = useMemo(
    () => blockState.connections ?? [],
    [blockState.connections]
  );
  const submitted = blockState.submitted ?? false;
  const showHints = useMemo(
    () => blockState.showHints ?? {},
    [blockState.showHints]
  );
  const rightOrderMap = useMemo(() => {
    const stored = blockState.rightOrderMap ?? [];
    return stored.length === pairs.length ? stored : initialRightOrder;
  }, [blockState.rightOrderMap, initialRightOrder, pairs.length]);

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [hoveredRight, setHoveredRight] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    content.timeLimit || null
  );
  const [timerActive, setTimerActive] = useState(false);

  const { updateBlockProgress, isBlockCompleted } = useLessonProgress();
  const isCompleted = isBlockCompleted(blockId);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if ((blockState.rightOrderMap ?? []).length === 0 && pairs.length > 0) {
      setBlockState((prev) => ({
        ...prev,
        rightOrderMap: initialRightOrder,
      }));
    }
  }, [
    blockState.rightOrderMap,
    initialRightOrder,
    pairs.length,
    setBlockState,
  ]);

  const startTimer = () => {
    if (content.timeLimit && !timerActive) {
      setTimerActive(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleLeftClick = (index: number) => {
    if (submitted) return;
    startTimer();

    if (selectedLeft === index) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(index);
    }
  };

  const handleRightClick = (rightIndex: number) => {
    if (submitted || selectedLeft === null) return;

    const existingConnectionIndex = connections.findIndex(
      (conn) =>
        conn.leftIndex === selectedLeft || conn.rightIndex === rightIndex
    );

    let updatedConnections = connections;

    if (existingConnectionIndex !== -1) {
      updatedConnections = connections.filter(
        (_, i) => i !== existingConnectionIndex
      );
    }

    const newConnections = [
      ...updatedConnections,
      { leftIndex: selectedLeft, rightIndex },
    ];
    setBlockState((prev) => ({
      ...prev,
      connections: newConnections,
    }));
    setSelectedLeft(null);
  };

  const checkConnection = useCallback(
    (conn: Connection): boolean => {
      const actualRightIndex = rightOrderMap[conn.rightIndex];
      return conn.leftIndex === actualRightIndex;
    },
    [rightOrderMap]
  );

  const getScore = useCallback(() => {
    let correct = 0;
    connections.forEach((conn) => {
      if (checkConnection(conn)) {
        correct++;
      }
    });
    return { correct, total: pairs.length };
  }, [checkConnection, connections, pairs.length]);

  const handleSubmit = useCallback(() => {
    setBlockState((prev) => ({
      ...prev,
      submitted: true,
    }));
    setTimerActive(false);
    setSelectedLeft(null);

    const score = getScore();
    const maxScore = content.points || 10;
    const earnedScore =
      content.allowPartialCredit !== false
        ? Math.floor((score.correct / score.total) * maxScore)
        : score.correct === score.total
          ? maxScore
          : 0;

    updateBlockProgress(
      blockId,
      {
        completed: score.correct === score.total,
        score: earnedScore,
        maxScore,
      },
      { incrementAttempt: true }
    );
  }, [
    blockId,
    content.allowPartialCredit,
    content.points,
    getScore,
    updateBlockProgress,
    setBlockState,
  ]);

  const handleRetry = () => {
    const resetOrder = content.shuffleItems
      ? Array.from({ length: pairs.length }, (_, i) => i).sort(
          () => Math.random() - 0.5
        )
      : initialRightOrder;

    setBlockState({
      connections: [],
      submitted: false,
      showHints: {},
      rightOrderMap: resetOrder,
    });
    setSelectedLeft(null);
    setTimeLeft(content.timeLimit || null);
    setTimerActive(false);
  };

  useEffect(() => {
    if (!timerActive || !timeLeft || timeLeft <= 0 || submitted) return;

    const timer = setTimeout(() => {
      setTimeLeft((prev) => {
        if (!prev) {
          return prev;
        }
        const next = prev - 1;
        if (next <= 0) {
          handleSubmit();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [timerActive, timeLeft, submitted, handleSubmit]);

  const toggleHint = (pairId: string) => {
    setBlockState((prev) => ({
      ...prev,
      showHints: {
        ...(prev.showHints ?? {}),
        [pairId]: !(prev.showHints ?? {})[pairId],
      },
    }));
  };

  const getConnectionPoints = (
    leftIndex: number,
    rightIndex: number
  ): [Point, Point] | null => {
    const leftEl = leftRefs.current[leftIndex];
    const rightEl = rightRefs.current[rightIndex];
    const svg = svgRef.current;
    const container = containerRef.current;

    if (!leftEl || !rightEl || !svg || !container) return null;

    const containerRect = container.getBoundingClientRect();
    const leftRect = leftEl.getBoundingClientRect();
    const rightRect = rightEl.getBoundingClientRect();

    const leftPoint: Point = {
      x: leftRect.right - containerRect.left,
      y: leftRect.top + leftRect.height / 2 - containerRect.top,
    };

    const rightPoint: Point = {
      x: rightRect.left - containerRect.left,
      y: rightRect.top + rightRect.height / 2 - containerRect.top,
    };

    return [leftPoint, rightPoint];
  };

  const renderConnection = (conn: Connection, index: number) => {
    const points = getConnectionPoints(conn.leftIndex, conn.rightIndex);
    if (!points) return null;

    const [start, end] = points;
    const isCorrect = submitted && checkConnection(conn);
    const color = submitted
      ? isCorrect
        ? "rgb(34 197 94)"
        : "rgb(239 68 68)"
      : "rgb(99 102 241)";

    const midX = (start.x + end.x) / 2;
    const path = `M ${start.x} ${start.y} Q ${midX} ${start.y} ${midX} ${
      (start.y + end.y) / 2
    } T ${end.x} ${end.y}`;

    return (
      <g key={index}>
        <path
          d={path}
          stroke={color}
          strokeWidth="3"
          fill="none"
          className="transition-all duration-300"
          style={{
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
          }}
        />
        <circle cx={start.x} cy={start.y} r="6" fill={color} />
        <circle cx={end.x} cy={end.y} r="6" fill={color} />
      </g>
    );
  };

  const renderTemporaryLine = () => {
    if (selectedLeft === null || hoveredRight === null || submitted)
      return null;

    const points = getConnectionPoints(selectedLeft, hoveredRight);
    if (!points) return null;

    const [start, end] = points;
    const midX = (start.x + end.x) / 2;
    const path = `M ${start.x} ${start.y} Q ${midX} ${start.y} ${midX} ${
      (start.y + end.y) / 2
    } T ${end.x} ${end.y}`;

    return (
      <path
        d={path}
        stroke="rgb(156 163 175)"
        strokeWidth="2"
        fill="none"
        strokeDasharray="5 5"
        className="transition-all duration-150"
      />
    );
  };

  const canSubmit = connections.length > 0;
  const score = submitted ? getScore() : null;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              {content.title || "Match the Items"}
              {isCompleted && (
                <Badge variant="secondary" className="ml-2">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </CardTitle>
            {content.instructions && (
              <p className="text-sm text-muted-foreground mt-1">
                {content.instructions}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {timeLeft !== null && (
              <Badge
                variant={timeLeft < 30 ? "destructive" : "secondary"}
                className="gap-1"
              >
                <Timer className="h-3 w-3" />
                {formatTime(timeLeft)}
              </Badge>
            )}
            <Badge variant="secondary" className="gap-1">
              <Trophy className="h-3 w-3" />
              {content.points || 10}{" "}
              {(content.points || 10) === 1 ? "point" : "points"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          ref={containerRef}
          className="relative bg-muted/30 rounded-lg border p-6"
        >
          <svg
            ref={svgRef}
            className="absolute inset-0 pointer-events-none z-10"
            style={{ width: "100%", height: "100%" }}
          >
            {connections.map((conn, index) => renderConnection(conn, index))}
            {renderTemporaryLine()}
          </svg>

          <div className="grid grid-cols-2 gap-8 relative z-20">
            {/* Left side */}
            <div className="space-y-3">
              {pairs.map((pair, index) => {
                const hasConnection = connections.some(
                  (conn) => conn.leftIndex === index
                );
                const isCorrect =
                  submitted &&
                  hasConnection &&
                  checkConnection(
                    connections.find((conn) => conn.leftIndex === index)!
                  );

                return (
                  <div
                    key={pair.id}
                    ref={(el) => (leftRefs.current[index] = el)}
                    onClick={() => handleLeftClick(index)}
                    className={cn(
                      "p-3 rounded-md border cursor-pointer transition-all relative",
                      {
                        "bg-background hover:bg-muted/50": !submitted,
                        "ring-2 ring-primary": selectedLeft === index,
                        "bg-green-50 border-green-500 dark:bg-green-950/30":
                          submitted && hasConnection && isCorrect,
                        "bg-red-50 border-red-500 dark:bg-red-950/30":
                          submitted && hasConnection && !isCorrect,
                        "bg-yellow-50 border-yellow-500 dark:bg-yellow-950/30":
                          submitted && !hasConnection,
                      }
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium pr-2">
                        {pair.leftItem}
                      </span>
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border-2 transition-colors",
                          {
                            "border-primary bg-primary": hasConnection,
                            "border-muted-foreground": !hasConnection,
                          }
                        )}
                      />
                    </div>
                    {submitted && (
                      <div className="absolute -right-6 top-1/2 -translate-y-1/2">
                        {hasConnection ? (
                          isCorrect ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )
                        ) : (
                          <XCircle className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right side */}
            <div className="space-y-3">
              {rightOrderMap.map((originalIndex, displayIndex) => {
                const pair = pairs[originalIndex];
                const hasConnection = connections.some(
                  (conn) => conn.rightIndex === displayIndex
                );
                const connectedLeftIndex = connections.find(
                  (conn) => conn.rightIndex === displayIndex
                )?.leftIndex;

                return (
                  <div
                    key={pair.id}
                    ref={(el) => (rightRefs.current[displayIndex] = el)}
                    onClick={() => handleRightClick(displayIndex)}
                    onMouseEnter={() => setHoveredRight(displayIndex)}
                    onMouseLeave={() => setHoveredRight(null)}
                    className={cn(
                      "p-3 rounded-md border cursor-pointer transition-all relative",
                      {
                        "bg-background hover:bg-muted/50":
                          !submitted && selectedLeft !== null,
                        "cursor-not-allowed opacity-50":
                          !submitted && selectedLeft === null,
                        "ring-2 ring-primary":
                          hoveredRight === displayIndex &&
                          selectedLeft !== null,
                        "bg-green-50 border-green-500 dark:bg-green-950/30":
                          submitted &&
                          hasConnection &&
                          connectedLeftIndex === originalIndex,
                        "bg-red-50 border-red-500 dark:bg-red-950/30":
                          submitted &&
                          hasConnection &&
                          connectedLeftIndex !== originalIndex,
                      }
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border-2 transition-colors",
                          {
                            "border-primary bg-primary": hasConnection,
                            "border-muted-foreground": !hasConnection,
                          }
                        )}
                      />
                      <span className="text-sm font-medium pl-2">
                        {pair.rightItem}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {submitted && score && (
              <Badge
                variant={
                  score.correct === score.total ? "default" : "destructive"
                }
                className="gap-1"
              >
                {score.correct === score.total ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {score.correct}/{score.total} correct
              </Badge>
            )}
            {!submitted && connections.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConnections([])}
              >
                Clear all
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!submitted ? (
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                Submit Matches
              </Button>
            ) : (
              <>
                {!isCompleted && (
                  <Button variant="outline" onClick={handleRetry}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {submitted && (
          <div className="mt-4 space-y-3">
            {pairs.map((pair, index) => {
              const connection = connections.find(
                (conn) => conn.leftIndex === index
              );
              const isMatched = !!connection;
              const isCorrect = isMatched && checkConnection(connection);

              return (
                <div
                  key={pair.id}
                  className={cn("p-3 rounded-lg border", {
                    "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900":
                      isMatched && isCorrect,
                    "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900":
                      isMatched && !isCorrect,
                    "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-900":
                      !isMatched,
                  })}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{pair.leftItem}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">{pair.rightItem}</span>
                      </div>
                      {pair.explanation && (
                        <div className="flex items-start gap-2">
                          {content.allowHints && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleHint(pair.id)}
                              className="h-6 px-2 text-xs"
                            >
                              <HelpCircle className="h-3 w-3 mr-1" />
                              {showHints[pair.id] ? "Hide" : "Show"} explanation
                            </Button>
                          )}
                          {(showHints[pair.id] || !content.allowHints) && (
                            <p className="text-xs text-muted-foreground pt-1">
                              {pair.explanation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      {isMatched ? (
                        isCorrect ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Not matched
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
