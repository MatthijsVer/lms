"use client";

import { QuizContent } from "@/lib/content-blocks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  Trophy,
  Lightbulb,
} from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  useLessonProgress,
  useBlockPersistentState,
} from "../LessonProgressContext";

interface QuizBlockRendererProps {
  content: QuizContent;
  blockId: string;
  lessonId: string;
}

export function QuizBlockRenderer({
  content,
  blockId,
  lessonId: _lessonId,
}: QuizBlockRendererProps) {
  void _lessonId;
  const [blockState, setBlockState] = useBlockPersistentState(blockId, {
    selectedAnswers: [] as number[],
    submitted: false,
    showExplanation: false,
  });

  const selectedAnswers = useMemo(
    () => blockState.selectedAnswers ?? [],
    [blockState.selectedAnswers]
  );
  const submitted = blockState.submitted ?? false;
  const showExplanation = blockState.showExplanation ?? false;

  const { updateBlockProgress, isBlockCompleted } = useLessonProgress();
  const isCompleted = isBlockCompleted(blockId);

  const handleAnswerSelect = (optionIndex: number) => {
    if (submitted) return;

    const allowMultiple = content.options.filter((o) => o.isCorrect).length > 1;

    if (allowMultiple) {
      setBlockState((prev) => {
        const current = prev.selectedAnswers ?? [];
        const next = current.includes(optionIndex)
          ? current.filter((i) => i !== optionIndex)
          : [...current, optionIndex];
        return {
          ...prev,
          selectedAnswers: next,
        };
      });
    } else {
      setBlockState((prev) => ({
        ...prev,
        selectedAnswers: [optionIndex],
      }));
    }
  };

  const handleSubmit = () => {
    setBlockState((prev) => ({
      ...prev,
      submitted: true,
      showExplanation: true,
    }));

    const correct = isCorrect();
    const maxScore = content.points || 10;
    const score = correct ? maxScore : 0;

    // Update progress in context
    updateBlockProgress(
      blockId,
      {
        completed: correct,
        score,
        maxScore,
      },
      { incrementAttempt: true }
    );
  };

  const handleRetry = () => {
    setBlockState({
      selectedAnswers: [],
      submitted: false,
      showExplanation: false,
    });
  };

  const getCorrectAnswers = () => {
    return content.options
      .map((option, index) => ({ ...option, index }))
      .filter((option) => option.isCorrect)
      .map((option) => option.index);
  };

  const isCorrect = () => {
    const correctAnswers = getCorrectAnswers();
    return (
      selectedAnswers.length === correctAnswers.length &&
      selectedAnswers.every((answer) => correctAnswers.includes(answer))
    );
  };

  const getOptionStatus = (optionIndex: number) => {
    if (!submitted) return "default";

    const isSelected = selectedAnswers.includes(optionIndex);
    const isCorrectOption = content.options[optionIndex].isCorrect;

    if (isSelected && isCorrectOption) return "correct";
    if (isSelected && !isCorrectOption) return "incorrect";
    if (!isSelected && isCorrectOption && content.showCorrectAnswer)
      return "missed";
    return "default";
  };

  const getOptionIcon = (optionIndex: number) => {
    const status = getOptionStatus(optionIndex);
    switch (status) {
      case "correct":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "incorrect":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "missed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };

  const canSubmit = selectedAnswers.length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Quiz Question
            {isCompleted && (
              <Badge variant="secondary" className="ml-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Trophy className="h-3 w-3" />
              {content.points || 10}{" "}
              {(content.points || 10) === 1 ? "point" : "points"}
            </Badge>
          </div>
        </div>
        <p className="text-base text-foreground font-normal">
          {content.question}
        </p>
        {content.options.filter((o) => o.isCorrect).length > 1 && (
          <p className="text-sm text-muted-foreground">
            Select all correct answers
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {content.options.map((option, index) => {
            const status = getOptionStatus(index);
            const isSelected = selectedAnswers.includes(index);

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={submitted}
                className={cn(
                  "w-full p-4 text-left border rounded-lg transition-all",
                  "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary",
                  {
                    "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800":
                      isSelected && !submitted,
                    "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800":
                      status === "correct",
                    "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800":
                      status === "incorrect",
                    "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800":
                      status === "missed",
                    "cursor-not-allowed": submitted,
                  }
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        {
                          "border-blue-500 bg-blue-500":
                            isSelected && !submitted,
                          "border-green-500 bg-green-500": status === "correct",
                          "border-red-500 bg-red-500": status === "incorrect",
                          "border-yellow-500 bg-yellow-500":
                            status === "missed",
                          "border-muted-foreground": !isSelected && !submitted,
                        }
                      )}
                    >
                      {isSelected && !submitted && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-sm">{option.text}</span>
                  </div>
                  {getOptionIcon(index)}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 pt-2">
          {!submitted ? (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="ml-auto"
            >
              Submit Answer
            </Button>
          ) : (
            <div className="flex items-center gap-2 ml-auto">
              {content.allowMultipleAttempts && !isCompleted && (
                <Button variant="outline" onClick={handleRetry}>
                  Try Again
                </Button>
              )}
              <Badge
                variant={isCorrect() ? "default" : "destructive"}
                className="gap-1"
              >
                {isCorrect() ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {isCorrect() ? "Correct!" : "Incorrect"}
              </Badge>
            </div>
          )}
        </div>

        {showExplanation && content.explanation && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-medium mb-1">Explanation</h4>
                <p className="text-sm text-muted-foreground">
                  {content.explanation}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
