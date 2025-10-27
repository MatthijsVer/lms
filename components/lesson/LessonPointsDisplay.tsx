"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Target, CheckCircle, Circle } from "lucide-react";
import {
  getLessonPointsSummary,
  calculatePointsProgress,
  getContentBlockTypeName,
} from "@/lib/lesson-points";
import { ContentBlockType } from "@/lib/content-blocks";
import { cn } from "@/lib/utils";

interface ContentBlockData {
  id: string;
  type: ContentBlockType;
  content: any;
}

interface UserProgress {
  totalEarned: number;
  blockScores: Array<{
    blockId: string;
    type: string;
    earned: number;
    maxPoints: number;
  }>;
}

interface LessonPointsDisplayProps {
  contentBlocks: ContentBlockData[];
  userProgress?: UserProgress;
  className?: string;
}

export function LessonPointsDisplay({
  contentBlocks,
  userProgress,
  className,
}: LessonPointsDisplayProps) {
  const summary = getLessonPointsSummary(contentBlocks);
  const earnedPoints = userProgress?.totalEarned || 0;
  const progressPercentage = calculatePointsProgress(
    earnedPoints,
    summary.totalPoints
  );

  if (summary.totalPoints === 0) {
    return null;
  }

  const isComplete = earnedPoints === summary.totalPoints;
  const hasStarted = earnedPoints > 0;

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-lg transition-colors",
                isComplete
                  ? "bg-green-100 dark:bg-green-900/20"
                  : hasStarted
                    ? "bg-blue-100 dark:bg-blue-900/20"
                    : "bg-yellow-100 dark:bg-yellow-900/20"
              )}
            >
              {isComplete ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm">Lesson Points</h3>
              <p className="text-xs text-muted-foreground">
                {isComplete
                  ? "All exercises completed! 🎉"
                  : hasStarted
                    ? "Keep going! Complete all exercises"
                    : "Complete exercises to earn points"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={isComplete ? "default" : "secondary"}
              className="gap-1"
            >
              <Star className="h-3 w-3" />
              {earnedPoints}/{summary.totalPoints} pts
            </Badge>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {summary.breakdown.length > 0 && (
          <div className="mt-3 pt-3 border-t space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>
                Exercises (
                {summary.breakdown.filter((item) => {
                  const userBlockScore = userProgress?.blockScores.find(
                    (score) => score.blockId === item.id
                  );
                  const earned = userBlockScore?.earned || 0;
                  return earned === item.points;
                }).length}
                /{summary.breakdown.length} completed):
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {summary.breakdown.map((item) => {
                const userBlockScore = userProgress?.blockScores.find(
                  (score) => score.blockId === item.id
                );
                const earnedForBlock = userBlockScore?.earned || 0;
                const isBlockComplete = earnedForBlock === item.points;
                const isBlockStarted = earnedForBlock > 0 && !isBlockComplete;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center justify-between text-xs p-2 rounded-md transition-colors",
                      isBlockComplete && "bg-green-50 dark:bg-green-950/20",
                      isBlockStarted && "bg-blue-50 dark:bg-blue-950/20",
                      !isBlockStarted && !isBlockComplete && "bg-muted/30"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isBlockComplete ? (
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                      ) : isBlockStarted ? (
                        <Circle className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 fill-blue-600" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
                      )}
                      <span
                        className={cn(
                          "text-muted-foreground",
                          isBlockComplete &&
                            "text-green-700 dark:text-green-300 font-medium"
                        )}
                      >
                        {getContentBlockTypeName(item.type)}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "font-medium tabular-nums",
                        isBlockComplete && "text-green-700 dark:text-green-300",
                        isBlockStarted && "text-blue-700 dark:text-blue-300"
                      )}
                    >
                      {earnedForBlock}/{item.points} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
