"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Target, CheckCircle } from "lucide-react";
import { calculateLessonTotalPoints, getLessonPointsSummary, calculatePointsProgress } from "@/lib/lesson-points";
import { ContentBlockType } from "@/lib/content-blocks";

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

export function LessonPointsDisplay({ contentBlocks, userProgress, className }: LessonPointsDisplayProps) {
  const summary = getLessonPointsSummary(contentBlocks);
  const earnedPoints = userProgress?.totalEarned || 0;
  const progressPercentage = calculatePointsProgress(earnedPoints, summary.totalPoints);

  if (summary.totalPoints === 0) {
    return null;
  }

  const isComplete = earnedPoints === summary.totalPoints;

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isComplete ? 'bg-green-100 dark:bg-green-900/20' : 'bg-yellow-100 dark:bg-yellow-900/20'}`}>
              {isComplete ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm">Lesson Points</h3>
              <p className="text-xs text-muted-foreground">
                {isComplete ? "All exercises completed!" : "Complete exercises to earn points"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={isComplete ? "default" : "secondary"} className="gap-1">
              <Star className="h-3 w-3" />
              {earnedPoints}/{summary.totalPoints} {summary.totalPoints === 1 ? "point" : "points"}
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
              <span>Point breakdown:</span>
            </div>
            <div className="grid grid-cols-1 gap-1">
              {summary.breakdown.map((item, index) => {
                const userBlockScore = userProgress?.blockScores.find(score => score.blockId === item.id);
                const earnedForBlock = userBlockScore?.earned || 0;
                const isBlockComplete = earnedForBlock === item.points;

                return (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {isBlockComplete && (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      )}
                      <span className="text-muted-foreground">
                        {item.type === ContentBlockType.QUIZ ? "Quiz" : 
                         item.type === ContentBlockType.FILL_IN_BLANK ? "Fill-in-the-blank" : 
                         item.type} {index + 1}
                      </span>
                    </div>
                    <span className="font-medium">
                      {earnedForBlock}/{item.points} {item.points === 1 ? "pt" : "pts"}
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