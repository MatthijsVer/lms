"use client";

import { FillInBlankContent } from "@/lib/content-blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Square,
  Trophy,
  Lightbulb,
  HelpCircle,
} from "lucide-react";
import { useEffect, useMemo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  useLessonProgress,
  useBlockPersistentState,
} from "../LessonProgressContext";

type FillInBlankPersistedState = {
  answers?: Record<number, string>;
  submitted?: boolean;
  showHints?: Record<number, boolean>;
};

interface FillInBlankBlockRendererProps {
  content: FillInBlankContent;
  blockId: string;
  lessonId: string;
}

export function FillInBlankBlockRenderer({
  content,
  blockId,
  lessonId: _lessonId,
}: FillInBlankBlockRendererProps) {
  void _lessonId;
  const [blockState, setBlockState] = useBlockPersistentState(blockId, {
    answers: {} as Record<number, string>,
    submitted: false,
    showHints: {} as Record<number, boolean>,
  });

  const { updateBlockProgress, isBlockCompleted, getBlockProgress } =
    useLessonProgress();
  const storedProgress = useMemo(
    () => getBlockProgress(blockId),
    [getBlockProgress, blockId]
  );
  const persistedCompleted = storedProgress?.completed ?? false;
  const persistedState = (storedProgress?.metadata as {
    state?: FillInBlankPersistedState;
  } | null)?.state;

  const persistedAnswers = useMemo(
    () => persistedState?.answers ?? {},
    [persistedState]
  );
  const answers = useMemo(
    () => blockState.answers ?? persistedAnswers,
    [blockState.answers, persistedAnswers]
  );
  const showHints = useMemo(
    () => blockState.showHints ?? persistedState?.showHints ?? {},
    [blockState.showHints, persistedState]
  );

  const submitted =
    blockState.submitted ?? persistedState?.submitted ?? persistedCompleted;
  const isCompleted = isBlockCompleted(blockId) || submitted;

  const handleAnswerChange = (blankIndex: number, value: string) => {
    if (submitted) return;
    setBlockState((prev) => ({
      ...prev,
      answers: {
        ...(prev.answers ?? {}),
        [blankIndex]: value,
      },
    }));
  };

  const handleSubmit = () => {
    setBlockState((prev) => ({
      ...prev,
      submitted: true,
    }));

    const { correct, total } = getTotalScore();
    const maxScore = content.points || 10;
    const score = content.allowPartialCredit
      ? Math.floor((correct / total) * maxScore)
      : correct === total
        ? maxScore
        : 0;

    updateBlockProgress(
      blockId,
      {
        completed: correct === total,
        score,
        maxScore,
      },
      { incrementAttempt: true }
    );
  };

  const handleRetry = () => {
    setBlockState({
      answers: {},
      submitted: false,
      showHints: {},
    });
  };

  const toggleHint = (blankIndex: number) => {
    setBlockState((prev) => ({
      ...prev,
      showHints: {
        ...(prev.showHints ?? {}),
        [blankIndex]: !(prev.showHints ?? {})[blankIndex],
      },
    }));
  };

  const checkAnswer = (blankIndex: number): boolean => {
    const userAnswer = answers[blankIndex]?.trim() || "";
    const blank = content.blanks[blankIndex];

    if (!blank) return false;

    return blank.correctAnswers.some((correctAnswer) => {
      if (blank.caseSensitive) {
        return correctAnswer === userAnswer;
      }
      return correctAnswer.toLowerCase() === userAnswer.toLowerCase();
    });
  };

  const getBlankStatus = (blankIndex: number) => {
    if (!submitted) return "default";
    return checkAnswer(blankIndex) ? "correct" : "incorrect";
  };

  const renderTextWithBlanks = () => {
    if (!content.text) return null;

    const text = content.text;
    let blankIndex = 0;
    const parts: ReactNode[] = [];
    let lastIndex = 0;

    const regex = /\{\{(blank|answer)\}\}/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${parts.length}`}>
            {text.slice(lastIndex, match.index)}
          </span>
        );
      }

      const currentBlankIndex = blankIndex;
      const status = getBlankStatus(currentBlankIndex);
      const blank = content.blanks[currentBlankIndex];

      parts.push(
        <span
          key={`blank-${currentBlankIndex}`}
          className="inline-flex flex-col items-center gap-1 mx-1"
        >
          <div className="relative">
            <Input
              value={answers[currentBlankIndex] || ""}
              onChange={(e) =>
                handleAnswerChange(currentBlankIndex, e.target.value)
              }
              disabled={submitted}
              className={cn("min-w-[120px] text-center", {
                "border-green-500 bg-green-50 dark:bg-green-950/30":
                  status === "correct",
                "border-red-500 bg-red-50 dark:bg-red-950/30":
                  status === "incorrect",
              })}
              placeholder="___"
            />
            {submitted && (
              <div className="absolute -right-7 top-1/2 -translate-y-1/2">
                {status === "correct" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
            )}
          </div>
          {blank?.hint && content.showHints && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleHint(currentBlankIndex)}
              className="h-6 px-2 text-xs"
            >
              <HelpCircle className="h-3 w-3 mr-1" />
              Hint
            </Button>
          )}
          {showHints[currentBlankIndex] && blank?.hint && (
            <div className="absolute top-full mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 dark:bg-yellow-950/30 dark:border-yellow-900 dark:text-yellow-200 max-w-[200px] z-10">
              {blank.hint}
            </div>
          )}
        </span>
      );

      lastIndex = regex.lastIndex;
      blankIndex++;
    }

    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${parts.length}`}>{text.slice(lastIndex)}</span>
      );
    }

    return <div className="text-base leading-relaxed">{parts}</div>;
  };

  const getTotalScore = () => {
    let correct = 0;
    const total = content.blanks.length;

    content.blanks.forEach((_, index) => {
      if (checkAnswer(index)) {
        correct++;
      }
    });

    return { correct, total };
  };

  const canSubmit = Object.values(answers).some((value) => value?.trim());
  const score = submitted ? getTotalScore() : null;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Square className="h-5 w-5" />
            Fill in the Blanks
            {isCompleted && (
              <Badge variant="secondary" className="ml-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
          </CardTitle>
          <Badge variant="secondary" className="gap-1">
            <Trophy className="h-3 w-3" />
            {content.points || 10}{" "}
            {(content.points || 10) === 1 ? "point" : "points"}
          </Badge>
        </div>
        {content.instructions && (
          <p className="text-sm text-muted-foreground">
            {content.instructions}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted/30 rounded-lg border relative">
          {renderTextWithBlanks()}
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
          </div>

          <div className="flex items-center gap-2">
            {!submitted ? (
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                Submit Answers
              </Button>
            ) : (
              <>
                {content.allowPartialCredit !== false && !isCompleted && (
                  <Button variant="outline" onClick={handleRetry}>
                    Try Again
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {submitted && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-medium mb-2">Correct Answers</h4>
                <div className="space-y-2">
                  {content.blanks.map((blank, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">Blank {index + 1}:</span>{" "}
                      <span className="text-muted-foreground">
                        {blank.correctAnswers.join(", ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
