"use client";

import { LessonContentType } from "@/app/data/course/get-lesson-content";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { Button } from "@/components/ui/button";
import { tryCatch } from "@/hooks/try-catch";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { BookIcon, CheckCircle } from "lucide-react";
import { useTransition } from "react";
import { markLessonComplete } from "../actions";
import { toast } from "sonner";
import { useConfetti } from "@/hooks/use-confetti";
import { ContentBlockRenderer } from "@/components/content-blocks/ContentBlockRenderer";
import { LessonPointsDisplay } from "@/components/lesson/LessonPointsDisplay";

interface iAppProps {
  data: LessonContentType;
}

export function CourseContent({ data }: iAppProps) {
  const [pending, startTransition] = useTransition();
  const { triggerConfetti } = useConfetti();

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
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        markLessonComplete(data.id, data.Chapter.Course.slug)
      );

      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        triggerConfetti();
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
        {data.lessonProgress.length > 0 ? (
          <Button
            variant="outline"
            className="bg-green-500/10 text-green-500 hover:text-green-600"
          >
            <CheckCircle className="size-4 text-green-500" />
            Completed
          </Button>
        ) : (
          <Button variant="outline" onClick={onSubmit} disabled={pending}>
            <CheckCircle className="size-4 text-green-500" />
            Mark as Complete
          </Button>
        )}
      </div>
    </div>
  );
}
