"use client";

import { DragDropContent } from "@/lib/content-blocks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Move,
  Trophy,
  HelpCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Timer,
  Target,
  Tag,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
  useDroppable,
  MouseSensor,
  TouchSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";

interface DragDropBlockRendererProps {
  content: DragDropContent;
  blockId: string;
  lessonId: string;
}

interface TokenPlacement {
  tokenId: string;
  targetId: string | null; // null means in token bank
}

interface SortableTokenProps {
  id: string;
  token: DragDropContent["tokens"][0];
  placement: TokenPlacement;
  submitted: boolean;
  isCorrect: boolean;
  showHints: boolean;
  onToggleHint: (tokenId: string) => void;
  hint: boolean;
  isDragging?: boolean;
}

const SortableToken = ({
  id,
  token,
  placement,
  submitted,
  isCorrect,
  showHints,
  onToggleHint,
  hint,
  isDragging = false,
}: SortableTokenProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id,
    disabled: submitted,
    data: {
      type: "token",
      token,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none", // Prevent touch scrolling while dragging
  };

  const isBeingDragged = isSortableDragging || isDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative px-3 py-2 rounded-md text-sm h-fit transition-all select-none",
        {
          "cursor-grab hover:shadow-md": !submitted,
          "cursor-grabbing": isBeingDragged,
          "bg-primary/10 border border-primary/20 hover:bg-primary/20":
            !submitted && !isBeingDragged,
          "bg-green-50 border border-green-500 text-green-800 dark:bg-green-950/30 dark:text-green-200":
            submitted && isCorrect,
          "bg-red-50 border border-red-500 text-red-800 dark:bg-red-950/30 dark:text-red-200":
            submitted && !isCorrect,
          "opacity-0": isBeingDragged,
          "shadow-lg scale-105": isBeingDragged,
        }
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{token.text}</span>
        {submitted && (
          <div className="flex items-center gap-1">
            {token.hint && showHints && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleHint(token.id);
                }}
                className="h-6 px-2 text-xs"
              >
                <HelpCircle className="h-3 w-3" />
              </Button>
            )}
            {isCorrect ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
          </div>
        )}
      </div>

      {hint && token.hint && (
        <div className="absolute left-0 right-0 top-full mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 dark:bg-yellow-950/30 dark:border-yellow-900 dark:text-yellow-200 z-20 whitespace-normal">
          {token.hint}
        </div>
      )}
    </div>
  );
};

interface DroppableTargetProps {
  id: string;
  target: DragDropContent["targets"][0];
  tokens: DragDropContent["tokens"];
  placements: TokenPlacement[];
  submitted: boolean;
  showLabels: boolean;
  allowHints: boolean;
  onToggleHint: (tokenId: string) => void;
  showHints: { [key: string]: boolean };
  checkTokenPlacement: (tokenId: string, targetId: string) => boolean;
  isActivelyDragging: boolean;
}

const DroppableTarget = ({
  id,
  target,
  tokens,
  placements,
  submitted,
  showLabels,
  allowHints,
  onToggleHint,
  showHints,
  checkTokenPlacement,
  isActivelyDragging,
}: DroppableTargetProps) => {
  const { isOver, setNodeRef, active } = useDroppable({
    id,
    data: {
      type: "target",
      target,
    },
  });

  const tokensInTarget = placements
    .filter((p) => p.targetId === id)
    .map((p) => tokens.find((t) => t.id === p.tokenId))
    .filter(Boolean) as DragDropContent["tokens"];

  const canAcceptMore =
    !target.maxItems || tokensInTarget.length < target.maxItems;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "p-4 rounded-lg border bg-muted/30 border-dashed min-h-[120px] transition-all",
        {
          "border-border": !submitted && canAcceptMore && !isActivelyDragging,
          "border-primary/50 bg-primary/5":
            !submitted && canAcceptMore && isActivelyDragging,
          "border-primary bg-primary/10": isOver && canAcceptMore,
          "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30":
            !canAcceptMore && isOver,
          "border-muted-foreground/20 bg-muted/20": !canAcceptMore && !isOver,
        }
      )}
    >
      {showLabels && (
        <div className="mb-3">
          <h4 className="text-sm font-medium">{target.label}</h4>
          {target.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {target.description}
            </p>
          )}
          {target.maxItems && (
            <p className="text-xs text-muted-foreground mt-1">
              Max {target.maxItems} items ({tokensInTarget.length}/
              {target.maxItems})
            </p>
          )}
        </div>
      )}

      <SortableContext
        items={tokensInTarget.map((t) => t.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div className="flex flex-wrap gap-2 min-h-[60px]">
          {tokensInTarget.map((token) => {
            const placement = placements.find((p) => p.tokenId === token.id)!;
            const isCorrect = submitted && checkTokenPlacement(token.id, id);

            return (
              <SortableToken
                key={token.id}
                id={token.id}
                token={token}
                placement={placement}
                submitted={submitted}
                isCorrect={isCorrect}
                showHints={allowHints}
                onToggleHint={onToggleHint}
                hint={showHints[token.id] || false}
              />
            );
          })}
          {tokensInTarget.length === 0 && (
            <div className="flex items-center justify-center w-full h-16 text-xs text-muted-foreground">
              {isOver && canAcceptMore ? "Release to drop here" : "Drop zone"}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

const TokenBank = ({
  id,
  tokens,
  placements,
  submitted,
  showHints,
  onToggleHint,
  shuffleTokens,
  isActivelyDragging,
}: {
  id: string;
  tokens: DragDropContent["tokens"];
  placements: TokenPlacement[];
  submitted: boolean;
  showHints: { [key: string]: boolean };
  onToggleHint: (tokenId: string) => void;
  shuffleTokens?: boolean;
  isActivelyDragging: boolean;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "bank",
    },
  });

  const tokensInBank = placements
    .filter((p) => p.targetId === null)
    .map((p) => tokens.find((t) => t.id === p.tokenId))
    .filter(Boolean) as DragDropContent["tokens"];

  // Memoize shuffled tokens
  const [shuffledTokens, setShuffledTokens] = useState(tokensInBank);

  useEffect(() => {
    if (shuffleTokens && !submitted) {
      setShuffledTokens([...tokensInBank].sort(() => Math.random() - 0.5));
    } else {
      setShuffledTokens(tokensInBank);
    }
  }, [tokensInBank.length, submitted]);

  return (
    <div
      ref={setNodeRef}
      className={cn("p-4 border border-dashed rounded-lg transition-all", {
        "border-border bg-muted/30": !isActivelyDragging,
        "border-primary/30 bg-primary/5": isActivelyDragging && !isOver,
        "border-primary bg-primary/10": isOver,
      })}
    >
      <div className="flex items-center gap-2 mb-3">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">Token Bank</h4>
        <Badge variant="outline" className="text-xs">
          {tokensInBank.length} items
        </Badge>
      </div>

      <SortableContext
        items={shuffledTokens.map((t) => t.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div className="flex flex-wrap gap-2 min-h-[60px]">
          {shuffledTokens.map((token) => {
            const placement = placements.find((p) => p.tokenId === token.id)!;

            return (
              <SortableToken
                key={token.id}
                id={token.id}
                token={token}
                placement={placement}
                submitted={submitted}
                isCorrect={false}
                showHints={false}
                onToggleHint={onToggleHint}
                hint={showHints[token.id] || false}
              />
            );
          })}
          {tokensInBank.length === 0 && (
            <div className="flex items-center justify-center w-full h-16 text-xs text-muted-foreground">
              {isOver
                ? "Release to return here"
                : "All tokens have been placed"}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export function DragDropBlockRenderer({
  content,
  blockId,
  lessonId,
}: DragDropBlockRendererProps) {
  const [placements, setPlacements] = useState<TokenPlacement[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [showHints, setShowHints] = useState<{ [key: string]: boolean }>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(
    content.timeLimit || null
  );
  const [timerActive, setTimerActive] = useState(false);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  // Improved sensors with better touch and mouse handling
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before activation
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize token placements
  useEffect(() => {
    if (!content.tokens || content.tokens.length === 0) return;

    const initialPlacements: TokenPlacement[] = content.tokens.map((token) => ({
      tokenId: token.id,
      targetId: null,
    }));

    setPlacements(initialPlacements);
  }, [content.tokens]);

  // Timer effect with cleanup
  useEffect(() => {
    if (!timerActive || !timeLeft || timeLeft <= 0 || submitted) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return;
    }

    timerRef.current = setTimeout(() => {
      setTimeLeft((prev) => {
        if (prev && prev > 1) {
          return prev - 1;
        } else {
          handleSubmit();
          return 0;
        }
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timerActive, timeLeft, submitted]);

  const startTimer = useCallback(() => {
    if (content.timeLimit && !timerActive && !submitted) {
      setTimerActive(true);
    }
  }, [content.timeLimit, timerActive, submitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveId(event.active.id);
      startTimer();
    },
    [startTimer]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      if (!over) return;

      const activeTokenId = active.id as string;
      const overId = over.id as string;

      // Get the current placement of the active token
      const currentPlacement = placements.find(
        (p) => p.tokenId === activeTokenId
      );
      if (!currentPlacement) return;

      // Determine if we're over a target, bank, or another token
      const overTarget = content.targets.find((t) => t.id === overId);
      const isOverBank = overId === "token-bank";
      const overToken = content.tokens.find((t) => t.id === overId);

      // If dragging over another token, use its container
      let targetId: string | null = null;
      if (overToken) {
        const overTokenPlacement = placements.find((p) => p.tokenId === overId);
        targetId = overTokenPlacement?.targetId || null;
      } else if (overTarget) {
        targetId = overId;
      } else if (isOverBank) {
        targetId = null;
      }

      // Check if target has space (if applicable)
      if (targetId && targetId !== currentPlacement.targetId) {
        const target = content.targets.find((t) => t.id === targetId);
        if (target?.maxItems) {
          const tokensInTarget = placements.filter(
            (p) => p.targetId === targetId && p.tokenId !== activeTokenId
          ).length;
          if (tokensInTarget >= target.maxItems) {
            return; // Target is full
          }
        }
      }
    },
    [content.targets, content.tokens, placements]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const tokenId = active.id as string;
      const overId = over.id as string;

      // Determine the target destination
      let targetId: string | null = null;

      // Check if we're dropping on a target
      const isTarget = content.targets.some((t) => t.id === overId);
      const isBank = overId === "token-bank";

      // Check if we're dropping on another token
      const overToken = content.tokens.find((t) => t.id === overId);

      if (isTarget) {
        targetId = overId;
      } else if (isBank) {
        targetId = null;
      } else if (overToken) {
        // If dropping on another token, use its container
        const overTokenPlacement = placements.find((p) => p.tokenId === overId);
        targetId = overTokenPlacement?.targetId || null;
      }

      // Check if target accepts this token and has space
      if (targetId) {
        const target = content.targets.find((t) => t.id === targetId);
        if (target) {
          const currentTokensInTarget = placements.filter(
            (p) => p.targetId === targetId && p.tokenId !== tokenId
          );

          if (
            target.maxItems &&
            currentTokensInTarget.length >= target.maxItems
          ) {
            return; // Target is full
          }
        }
      }

      // Update placement
      setPlacements((prev) =>
        prev.map((p) => (p.tokenId === tokenId ? { ...p, targetId } : p))
      );

      // Show feedback if enabled
      if (content.showFeedback && targetId) {
        const isCorrect = checkTokenPlacement(tokenId, targetId);
        if (content.returnToBank && !isCorrect) {
          // Return to bank after a delay
          setTimeout(() => {
            setPlacements((prev) =>
              prev.map((p) =>
                p.tokenId === tokenId ? { ...p, targetId: null } : p
              )
            );
          }, 1000);
        }
      }
    },
    [
      content.targets,
      content.tokens,
      content.showFeedback,
      content.returnToBank,
      placements,
    ]
  );

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    setTimerActive(false);
  }, []);

  const handleRetry = useCallback(() => {
    setPlacements((prev) => prev.map((p) => ({ ...p, targetId: null })));
    setSubmitted(false);
    setShowHints({});
    setTimeLeft(content.timeLimit || null);
    setTimerActive(false);
  }, [content.timeLimit]);

  const toggleHint = useCallback((tokenId: string) => {
    setShowHints((prev) => ({ ...prev, [tokenId]: !prev[tokenId] }));
  }, []);

  const checkTokenPlacement = useCallback(
    (tokenId: string, targetId: string): boolean => {
      const token = content.tokens.find((t) => t.id === tokenId);
      return token ? token.correctTargets.includes(targetId) : false;
    },
    [content.tokens]
  );

  const getScore = useCallback(() => {
    let correct = 0;
    placements.forEach((placement) => {
      if (
        placement.targetId &&
        checkTokenPlacement(placement.tokenId, placement.targetId)
      ) {
        correct++;
      }
    });

    if (content.allowPartialCredit) {
      return {
        correct,
        total: content.tokens.length,
        percentage: (correct / content.tokens.length) * 100,
      };
    } else {
      const allCorrect = correct === content.tokens.length;
      return {
        correct: allCorrect ? content.tokens.length : 0,
        total: content.tokens.length,
        percentage: allCorrect ? 100 : 0,
      };
    }
  }, [
    placements,
    content.tokens.length,
    content.allowPartialCredit,
    checkTokenPlacement,
  ]);

  const canSubmit = placements.some((p) => p.targetId !== null);
  const score = submitted ? getScore() : null;

  const activeToken = activeId
    ? content.tokens.find((t) => t.id === activeId)
    : null;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Move className="h-5 w-5" />
              {content.title || "Drag & Drop"}
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
              {content.points || 1} {content.points === 1 ? "point" : "points"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
        >
          {/* Token Bank */}
          <TokenBank
            id="token-bank"
            tokens={content.tokens}
            placements={placements}
            submitted={submitted}
            showHints={showHints}
            onToggleHint={toggleHint}
            shuffleTokens={content.shuffleTokens}
            isActivelyDragging={!!activeId}
          />

          {/* Drop Targets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.targets.map((target) => (
              <DroppableTarget
                key={target.id}
                id={target.id}
                target={target}
                tokens={content.tokens}
                placements={placements}
                submitted={submitted}
                showLabels={content.showTargetLabels !== false}
                allowHints={content.allowHints !== false}
                onToggleHint={toggleHint}
                showHints={showHints}
                checkTokenPlacement={checkTokenPlacement}
                isActivelyDragging={!!activeId}
              />
            ))}
          </div>

          <DragOverlay modifiers={[restrictToWindowEdges]}>
            {activeToken ? (
              <div className="px-3 py-2 bg-primary/20 border-2 border-primary rounded-md text-sm font-medium shadow-xl cursor-grabbing">
                {activeToken.text}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {submitted && score && (
              <Badge
                variant={
                  score.percentage === 100
                    ? "default"
                    : score.percentage >= 70
                      ? "secondary"
                      : "destructive"
                }
                className="gap-1"
              >
                {score.percentage === 100 ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {score.correct}/{score.total} correct{" "}
                {content.allowPartialCredit &&
                  `(${score.percentage.toFixed(0)}%)`}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!submitted ? (
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                size="default"
              >
                Submit Placement
              </Button>
            ) : (
              <Button variant="outline" onClick={handleRetry} size="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        </div>

        {/* Feedback section */}
        {submitted && (
          <div className="mt-4 space-y-3">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-green-600" />
                Correct Placement
              </h4>
              <div className="space-y-3">
                {content.targets.map((target) => {
                  const correctTokens = content.tokens.filter((token) =>
                    token.correctTargets.includes(target.id)
                  );

                  if (correctTokens.length === 0) return null;

                  return (
                    <div
                      key={target.id}
                      className="p-3 rounded-md border bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900"
                    >
                      <h5 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                        {target.label}
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {correctTokens.map((token) => (
                          <div
                            key={token.id}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded"
                          >
                            {token.text}
                          </div>
                        ))}
                      </div>
                      {target.description && (
                        <p className="text-xs text-green-800 dark:text-green-200 mt-2">
                          {target.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {score && score.percentage < 100 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-950/30 dark:border-blue-900">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Your Result:</strong> {score.correct} out of{" "}
                  {score.total} tokens were placed correctly.
                  {content.allowPartialCredit &&
                    ` You earned ${score.percentage.toFixed(0)}% of the points.`}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
