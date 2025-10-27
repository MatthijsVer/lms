"use client";

import { OrderingContent } from "@/lib/content-blocks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useLessonProgress,
  useBlockPersistentState,
} from "../LessonProgressContext";
import {
  ArrowUpDown,
  Trophy,
  HelpCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Timer,
  GripVertical,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface OrderingBlockRendererProps {
  content: OrderingContent;
  blockId: string;
  lessonId: string;
}

type OrderingPersistedState = {
  items?: OrderingContent["items"];
  submitted?: boolean;
  showHints?: Record<string, boolean>;
};

interface SortableItemProps {
  id: string;
  item: OrderingContent["items"][0];
  index: number;
  submitted: boolean;
  isCorrect: boolean;
  showNumbers: boolean;
  showHints: boolean;
  onToggleHint: (itemId: string) => void;
  hint: boolean;
}

function SortableItem({
  id,
  item,
  index,
  submitted,
  isCorrect,
  showNumbers,
  showHints,
  onToggleHint,
  hint,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-md border transition-all",
        {
          "cursor-grab": !submitted,
          "cursor-grabbing": isDragging,
          "bg-background hover:bg-muted/50": !submitted,
          "bg-green-50 border-green-500 dark:bg-green-950/30":
            submitted && isCorrect,
          "bg-red-50 border-red-500 dark:bg-red-950/30":
            submitted && !isCorrect,
          "opacity-50": isDragging,
          "shadow-md": isDragging,
        }
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical
        className={cn("h-4 w-4 text-muted-foreground", {
          invisible: submitted,
        })}
      />

      {showNumbers && (
        <div
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
            {
              "bg-primary/10": !submitted,
              "bg-green-600 text-white": submitted && isCorrect,
              "bg-red-600 text-white": submitted && !isCorrect,
            }
          )}
        >
          {index + 1}
        </div>
      )}

      <span className="text-sm flex-1">{item.text}</span>

      {submitted && (
        <div className="flex items-center gap-2">
          {item.hint && showHints && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleHint(item.id)}
              className="h-6 px-2 text-xs"
            >
              <HelpCircle className="h-3 w-3 mr-1" />
              Hint
            </Button>
          )}
          {isCorrect ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
        </div>
      )}

      {hint && item.hint && (
        <div className="absolute left-0 right-0 top-full mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 dark:bg-yellow-950/30 dark:border-yellow-900 dark:text-yellow-200 z-10">
          {item.hint}
        </div>
      )}
    </div>
  );
}

export function OrderingBlockRenderer({
  content,
  blockId,
  lessonId: _lessonId,
}: OrderingBlockRendererProps) {
  void _lessonId;
  const initialItems = useMemo(() => {
    if (!content.items || content.items.length === 0) {
      return [] as OrderingContent["items"];
    }
    return content.shuffleItems
      ? [...content.items].sort(() => Math.random() - 0.5)
      : [...content.items];
  }, [content.items, content.shuffleItems]);

  const [blockState, setBlockState] = useBlockPersistentState(blockId, {
    items: initialItems,
    submitted: false,
    showHints: {} as Record<string, boolean>,
  });

  const { updateBlockProgress, isBlockCompleted, getBlockProgress } =
    useLessonProgress();
  const storedProgress = useMemo(
    () => getBlockProgress(blockId),
    [getBlockProgress, blockId]
  );
  const persistedCompleted = storedProgress?.completed ?? false;
  const persistedState = (
    storedProgress?.metadata as {
      state?: OrderingPersistedState;
    } | null
  )?.state;

  const items = useMemo(() => blockState.items ?? [], [blockState.items]);
  const submitted = blockState.submitted ?? persistedCompleted;
  const showHints = useMemo(
    () => blockState.showHints ?? {},
    [blockState.showHints]
  );
  const [timeLeft, setTimeLeft] = useState<number | null>(
    content.timeLimit || null
  );
  const [timerActive, setTimerActive] = useState(false);
  const isCompleted = isBlockCompleted(blockId) || submitted;

  const checkItemPosition = useCallback(
    (item: OrderingContent["items"][0], currentIndex: number): boolean => {
      return item.correctPosition === currentIndex;
    },
    []
  );

  const getScore = useCallback(() => {
    let correct = 0;
    items.forEach((item, index) => {
      if (checkItemPosition(item, index)) {
        correct++;
      }
    });

    if (content.allowPartialCredit) {
      return {
        correct,
        total: items.length,
        percentage: (correct / items.length) * 100,
      };
    } else {
      const allCorrect = correct === items.length;
      return {
        correct: allCorrect ? items.length : 0,
        total: items.length,
        percentage: allCorrect ? 100 : 0,
      };
    }
  }, [checkItemPosition, content.allowPartialCredit, items]);

  useEffect(() => {
    if (!persistedState) return;
    setBlockState((prev) => {
      const nextItems =
        prev.items && prev.items.length > 0
          ? prev.items
          : (persistedState.items ?? prev.items ?? initialItems);
      const nextSubmitted =
        prev.submitted ?? persistedState.submitted ?? persistedCompleted;
      const nextShowHints =
        prev.showHints && Object.keys(prev.showHints).length > 0
          ? prev.showHints
          : (persistedState.showHints ?? prev.showHints ?? {});

      if (
        prev.items === nextItems &&
        (prev.submitted ?? false) === nextSubmitted &&
        prev.showHints === nextShowHints
      ) {
        return prev;
      }

      return {
        items: nextItems,
        submitted: nextSubmitted,
        showHints: nextShowHints,
      };
    });
  }, [persistedState, setBlockState, initialItems, persistedCompleted]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if ((blockState.items ?? []).length === 0 && initialItems.length > 0) {
      setBlockState((prev) => ({
        ...prev,
        items: initialItems,
      }));
    }
  }, [blockState.items, initialItems, setBlockState]);

  const handleSubmit = useCallback(() => {
    setBlockState((prev) => ({
      ...prev,
      submitted: true,
    }));
    setTimerActive(false);

    const score = getScore();
    const maxScore = content.points || 10;
    const earnedScore =
      content.allowPartialCredit !== false
        ? Math.floor((score.percentage / 100) * maxScore)
        : score.percentage === 100
          ? maxScore
          : 0;

    updateBlockProgress(
      blockId,
      {
        completed: score.percentage === 100,
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

  // Timer effect
  useEffect(() => {
    if (!timerActive || !timeLeft || timeLeft <= 0 || submitted) return;

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
      if (timeLeft - 1 <= 0) {
        handleSubmit();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [timerActive, timeLeft, submitted, handleSubmit]);

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    startTimer();

    setBlockState((prev) => {
      const currentItems = prev.items ?? [];
      const oldIndex = currentItems.findIndex((item) => item.id === active.id);
      const newIndex = currentItems.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }

      return {
        ...prev,
        items: arrayMove(currentItems, oldIndex, newIndex),
      };
    });
  };

  const handleRetry = () => {
    const reshuffled = content.shuffleItems
      ? [...(content.items ?? [])].sort(() => Math.random() - 0.5)
      : [...(content.items ?? [])];

    setBlockState({
      items: reshuffled,
      submitted: false,
      showHints: {},
    });
    setTimeLeft(content.timeLimit || null);
    setTimerActive(false);
  };

  const toggleHint = (itemId: string) => {
    setBlockState((prev) => ({
      ...prev,
      showHints: {
        ...(prev.showHints ?? {}),
        [itemId]: !(prev.showHints ?? {})[itemId],
      },
    }));
  };

  const canSubmit = items.length > 0;
  const score = submitted ? getScore() : null;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              {content.title || "Put Items in Order"}
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
              {content.points || 1} {content.points === 1 ? "point" : "points"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/30 rounded-lg border p-4">
          {items.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.id} className="relative">
                      <SortableItem
                        id={item.id}
                        item={item}
                        index={index}
                        submitted={submitted}
                        isCorrect={submitted && checkItemPosition(item, index)}
                        showNumbers={content.showPositionNumbers !== false}
                        showHints={content.allowHints !== false}
                        onToggleHint={toggleHint}
                        hint={showHints[item.id] || false}
                      />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ArrowUpDown className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No items to order</p>
            </div>
          )}
        </div>

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
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                Submit Order
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

        {/* Feedback section */}
        {submitted && (
          <div className="mt-4 space-y-3">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Correct Order
              </h4>
              <div className="space-y-2">
                {[...content.items]
                  .sort((a, b) => a.correctPosition - b.correctPosition)
                  .map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-md border bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900"
                    >
                      {content.showPositionNumbers && (
                        <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.text}</p>
                        {item.explanation && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {score && score.percentage < 100 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-950/30 dark:border-blue-900">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Your Order:</strong> {score.correct} out of{" "}
                  {score.total} items were in the correct position.
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
