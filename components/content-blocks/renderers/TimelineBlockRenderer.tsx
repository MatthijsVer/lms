"use client";

import { TimelineContent } from "@/lib/content-blocks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Star,
  Trophy,
  AlertCircle,
  MapPin,
  RefreshCw,
  CheckCircle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import { useLessonProgress } from "../LessonProgressContext";

interface TimelineBlockRendererProps {
  content: TimelineContent;
  blockId: string;
  lessonId: string;
}

type TimelineEvent = TimelineContent["events"][0];

interface TimelineItem extends TimelineEvent {
  currentPosition: number;
  originalPosition: number;
}

const eventTypeIcons = {
  milestone: Star,
  event: Calendar,
  deadline: AlertCircle,
  achievement: Trophy,
};

interface SortableTimelineItemProps {
  item: TimelineItem;
  index: number;
  submitted: boolean;
  isCorrect: boolean;
  showHints: boolean;
  onToggleHint: (itemId: string) => void;
  hint: boolean;
  allowHints?: boolean;
}

const SortableTimelineItem = ({
  item,
  index,
  submitted,
  isCorrect,
  showHints,
  onToggleHint,
  hint,
  allowHints = true,
}: SortableTimelineItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: submitted,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = eventTypeIcons[item.type || "event"];

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(":");
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return timeString;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("transition-all", isDragging && "opacity-50")}
    >
      <Card
        className={cn(
          "relative py-0 transition-all duration-200 select-none",
          {
            "cursor-grab hover:shadow-md": !submitted,
            "cursor-grabbing": isDragging,
            "border-green-500 bg-green-50 dark:bg-green-950/30":
              submitted && isCorrect,
            "border-red-500 bg-red-50 dark:bg-red-950/30":
              submitted && !isCorrect,
            "shadow-lg scale-[1.02]": isDragging,
          }
          // !submitted && eventTypeColors[item.type || "event"]
        )}
        {...attributes}
        {...listeners}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Position Number */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted border-2 border-border flex items-center justify-center text-sm font-medium">
              {index + 1}
            </div>

            {/* Event Icon */}
            <div className="flex-shrink-0">
              <div
                className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
                style={{
                  backgroundColor: item.color || "#3b82f6",
                  borderColor: item.color || "#3b82f6",
                }}
              >
                <IconComponent className="h-5 w-5 text-white" />
              </div>
            </div>

            {/* Event Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-base leading-tight">
                    {item.title}
                  </h4>

                  {/* Date and Time */}
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(item.date)}
                    </div>
                    {item.time && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTime(item.time)}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Hint */}
                  {hint &&
                    item.description &&
                    showHints &&
                    allowHints !== false && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md dark:bg-yellow-950/30 dark:border-yellow-900">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>Hint:</strong> {item.description}
                        </p>
                      </div>
                    )}
                </div>

                {/* Result Icons and Actions */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {item.type || "event"}
                  </Badge>

                  {submitted && allowHints !== false && item.description && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleHint(item.id);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  )}

                  {submitted && (
                    <div className="flex-shrink-0">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export function TimelineBlockRenderer({
  content,
  blockId,
  lessonId: _lessonId,
}: TimelineBlockRendererProps) {
  void _lessonId;
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [showHints, setShowHints] = useState<{ [key: string]: boolean }>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const lessonProgress = useLessonProgress();
  const { updateBlockProgress, isBlockCompleted } = lessonProgress;
  const getBlockProgress = lessonProgress.getBlockProgress ?? (() => undefined);
  const isCompleted = isBlockCompleted(blockId);

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
          items?: TimelineItem[];
          submitted?: boolean;
          showHints?: Record<string, boolean>;
        };
      }
    }
    return undefined;
  }, [blockProgress]);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;

    if (storedState) {
      if (Array.isArray(storedState.items)) {
        setTimelineItems(storedState.items);
      }
      if (typeof storedState.submitted === "boolean") {
        setSubmitted(storedState.submitted);
      }
      if (storedState.showHints) {
        setShowHints(storedState.showHints);
      }
    }

    hydratedRef.current = true;
  }, [storedState]);

  useEffect(() => {
    if (!hydratedRef.current) return;

    const metaState = {
      items: timelineItems,
      submitted,
      showHints,
    };

    const timeout = setTimeout(() => {
      updateBlockProgress(blockId, {
        metadata: {
          state: metaState,
        },
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [timelineItems, submitted, showHints, blockId, updateBlockProgress]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
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

  // Initialize timeline items with shuffled order (when no stored state)
  useEffect(() => {
    if (!content.events || content.events.length === 0) return;

    if (
      hydratedRef.current &&
      storedState?.items &&
      storedState.items.length > 0
    ) {
      return;
    }

    const items: TimelineItem[] = content.events.map((event, index) => ({
      ...event,
      currentPosition: index,
      originalPosition: index,
    }));

    const sortedByDate = [...items].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });

    sortedByDate.forEach((item, index) => {
      item.originalPosition = index;
    });

    if (content.shuffleEvents !== false) {
      const shuffled = [...items].sort(() => Math.random() - 0.5);
      setTimelineItems(
        shuffled.map((item, index) => ({ ...item, currentPosition: index }))
      );
    } else {
      setTimelineItems(items);
    }
  }, [content.events, content.shuffleEvents, storedState]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setTimelineItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({
          ...item,
          currentPosition: index,
        }));
      });
    }
  }, []);

  const checkItemPosition = useCallback((item: TimelineItem): boolean => {
    return item.currentPosition === item.originalPosition;
  }, []);

  const getScore = useMemo(() => {
    if (!submitted) return null;

    const correctCount = timelineItems.filter(checkItemPosition).length;
    const total = timelineItems.length;

    if (content.allowPartialCredit !== false) {
      // Award partial credit based on correct positions
      const percentage = total > 0 ? (correctCount / total) * 100 : 0;
      return {
        correct: correctCount,
        total,
        percentage,
      };
    } else {
      // All-or-nothing scoring
      const allCorrect = correctCount === total;
      return {
        correct: allCorrect ? total : 0,
        total,
        percentage: allCorrect ? 100 : 0,
      };
    }
  }, [timelineItems, submitted, checkItemPosition, content.allowPartialCredit]);

  const handleSubmit = useCallback(() => {
    setSubmitted(true);

    const score = getScore;
    if (score) {
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
    }
  }, [
    blockId,
    content.allowPartialCredit,
    content.points,
    getScore,
    updateBlockProgress,
  ]);

  const handleRetry = useCallback(() => {
    // Re-shuffle the items
    const shuffled = [...timelineItems].sort(() => Math.random() - 0.5);
    setTimelineItems(
      shuffled.map((item, index) => ({ ...item, currentPosition: index }))
    );
    setSubmitted(false);
    setShowHints({});
  }, [timelineItems]);

  const toggleHint = useCallback((itemId: string) => {
    setShowHints((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  }, []);

  const canSubmit = timelineItems.length > 0;
  const activeItem = activeId
    ? timelineItems.find((item) => item.id === activeId)
    : null;

  if (!content.events || content.events.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No timeline events to display.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {content.title || "Timeline Ordering"}
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
            <Badge variant="secondary" className="gap-1">
              <Trophy className="h-3 w-3" />
              {content.points || 1} {content.points === 1 ? "point" : "points"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!submitted && (
          <div className="p-4 bg-primary/10 border border-primary rounded-lg dark:bg-primary/10 dark:border-primary">
            <p className="text-sm text-muted-foreground">
              <strong>Instructions:</strong> Drag and drop the events to arrange
              them in chronological order from earliest to latest.
            </p>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
        >
          <SortableContext
            items={timelineItems.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
            disabled={submitted}
          >
            <div className="space-y-3">
              {timelineItems.map((item, index) => (
                <SortableTimelineItem
                  key={item.id}
                  item={item}
                  index={index}
                  submitted={submitted}
                  isCorrect={checkItemPosition(item)}
                  showHints={submitted}
                  onToggleHint={toggleHint}
                  hint={showHints[item.id] || false}
                  allowHints={content.allowHints}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay modifiers={[restrictToWindowEdges]}>
            {activeItem ? (
              <Card className="shadow-xl opacity-90 border-primary">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
                      style={{
                        backgroundColor: activeItem.color || "#3b82f6",
                        borderColor: activeItem.color || "#3b82f6",
                      }}
                    >
                      {React.createElement(
                        eventTypeIcons[activeItem.type || "event"],
                        {
                          className: "h-4 w-4 text-white",
                        }
                      )}
                    </div>
                    <span className="font-semibold">{activeItem.title}</span>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            {submitted && getScore && (
              <Badge
                variant={
                  getScore.percentage === 100
                    ? "default"
                    : getScore.percentage >= 70
                      ? "secondary"
                      : "destructive"
                }
                className="gap-1"
              >
                {getScore.percentage === 100 ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {getScore.correct}/{getScore.total} correct (
                {getScore.percentage.toFixed(0)}%)
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
                Check Order
              </Button>
            ) : (
              <>
                {!isCompleted && (
                  <Button
                    variant="outline"
                    onClick={handleRetry}
                    size="default"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Feedback section */}
        {submitted && getScore && getScore.percentage < 100 && (
          <div className="mt-4 space-y-3">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/30 dark:border-green-900">
              <h4 className="text-sm font-medium mb-3 text-green-900 dark:text-green-100 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Correct Chronological Order
              </h4>
              <div className="space-y-2">
                {timelineItems
                  .slice()
                  .sort((a, b) => a.originalPosition - b.originalPosition)
                  .map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{item.title}</span>
                      <span className="text-green-700 dark:text-green-300">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
