"use client";

import { LessonContentType } from "@/app/data/course/get-lesson-content";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { Button } from "@/components/ui/button";
import { tryCatch } from "@/hooks/try-catch";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { BookIcon, CheckCircle, Sparkles, AlertCircle } from "lucide-react";
import { useTransition, useMemo } from "react";
import { markLessonComplete } from "../actions";
import { toast } from "sonner";
import { useConfetti } from "@/hooks/use-confetti";
import { ContentBlockRenderer } from "@/components/content-blocks/ContentBlockRenderer";
import { LessonPointsDisplay } from "@/components/lesson/LessonPointsDisplay";
import {
  LessonProgressProvider,
  useLessonProgress,
} from "@/components/content-blocks/LessonProgressContext";
import { Badge } from "@/components/ui/badge";

interface iAppProps {
  data: LessonContentType;
}

function CourseContentInner({ data }: iAppProps) {
  const [pending, startTransition] = useTransition();
  const { triggerConfetti } = useConfetti();
  const { areAllBlocksCompleted, getTotalScore, getAllProgress } =
    useLessonProgress();

  // Get all interactive block IDs (blocks that require completion)
  const interactiveBlockIds = useMemo(() => {
    if (!data.contentBlocks) return [];

    const interactiveTypes = [
      "QUIZ",
      "FILL_IN_BLANK",
      "MATCHING",
      "ORDERING",
      "DRAG_DROP",
      "TIMELINE",
      "CODE_EXERCISE",
    ];

    return data.contentBlocks
      .filter((block) => interactiveTypes.includes(block.type))
      .map((block) => block.id);
  }, [data.contentBlocks]);

  const allBlocksCompleted = areAllBlocksCompleted(interactiveBlockIds);
  const isAlreadyCompleted = data.lessonProgress.length > 0;
  const canComplete =
    allBlocksCompleted ||
    interactiveBlockIds.length === 0 ||
    isAlreadyCompleted;

  function VideoPlayer({
    thumbnailKey,
    videoKey,
  }: {
    thumbnailKey: string;
    videoKey: string;
  }) {
    const videoUrl = useConstructUrl(videoKey);
    const thumbnailUrl = useConstructUrl(thumbnailKey);

    if (!videoKey) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
          <BookIcon className="size-16 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            This lesson does not have a video yet
          </p>
        </div>
      );
    }

    return (
      <div className="aspect-video bg-black rounded-lg relative overflow-hidden">
        <video
          className="w-full h-full object-cover"
          controls
          poster={thumbnailUrl}
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
          <source src={videoUrl} type="video/ogg" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  function onSubmit() {
    if (!canComplete) {
      toast.error(
        "Please complete all exercises before marking this lesson as complete."
      );
      return;
    }

    startTransition(async () => {
      const allProgress = getAllProgress();
      const { earned, possible } = getTotalScore();

      const { data: result, error } = await tryCatch(
        markLessonComplete({
          lessonId: data.id,
          slug: data.Chapter.Course.slug,
          blockProgress: allProgress,
          totalScore: earned,
          maxScore: possible,
        })
      );

      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      if (result.status === "success") {
        // 🎮 Show gamification toast
        if (result.gamification) {
          const { xpEarned, leveledUp, newLevel, newBadges } =
            result.gamification;

          if (leveledUp) {
            triggerConfetti();
            toast.success(
              <div className="flex flex-col gap-1">
                <div className="font-bold">🎉 Level Up!</div>
                <div className="text-sm">
                  You reached Level {newLevel} and earned +{xpEarned} XP!
                </div>
              </div>,
              { duration: 5000 }
            );
          } else {
            toast.success(
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span>+{xpEarned} XP earned!</span>
              </div>,
              { duration: 3000 }
            );
          }

          // Show badge notifications if any were earned
          if (newBadges && newBadges.length > 0) {
            setTimeout(() => {
              newBadges.forEach((badge, index) => {
                setTimeout(() => {
                  toast.success(
                    <div className="flex flex-col gap-1">
                      <div className="font-bold">🏆 Badge Unlocked!</div>
                      <div className="text-sm">{badge.name}</div>
                    </div>,
                    { duration: 4000 }
                  );
                }, index * 500);
              });
            }, 1000);
          }
        } else {
          toast.success(result.message);
        }

        // Only trigger confetti if not already shown for level up
        if (!result.gamification?.leveledUp) {
          triggerConfetti();
        }
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col h-full bg-background pl-6 pt-6">
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {data.title}
          </h1>

          {data.description && (
            <RenderDescription json={JSON.parse(data.description)} />
          )}
        </div>

        {/* Show lesson points summary if content blocks have points */}
        {data.contentBlocks && data.contentBlocks.length > 0 && (
          <LessonPointsDisplay
            contentBlocks={data.contentBlocks}
            userProgress={data.userProgress}
            className="mb-4 py-0"
          />
        )}

        {/* Render content blocks if they exist */}
        {data.contentBlocks && data.contentBlocks.length > 0 ? (
          <ContentBlockRenderer
            blocks={data.contentBlocks}
            lessonId={data.id}
          />
        ) : (
          /* Fallback to legacy video/description layout */
          <VideoPlayer
            thumbnailKey={data.thumbnailKey ?? ""}
            videoKey={data.videoKey ?? ""}
          />
        )}
      </div>

      <div className="py-4 border-b mt-6">
        {isAlreadyCompleted ? (
          <Button
            variant="outline"
            className="bg-green-500/10 text-green-500 hover:text-green-600"
          >
            <CheckCircle className="size-4 text-green-500" />
            Completed
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onSubmit}
              disabled={pending || !canComplete}
            >
              <CheckCircle className="size-4 text-green-500" />
              Mark as Complete
            </Button>

            {!canComplete && interactiveBlockIds.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="size-3" />
                Complete all exercises to continue
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function CourseContent({ data }: iAppProps) {
  return (
    <LessonProgressProvider>
      <CourseContentInner data={data} />
    </LessonProgressProvider>
  );
}
