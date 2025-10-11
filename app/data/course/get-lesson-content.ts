import "server-only";
import { requireUser } from "../user/require-user";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { getUserLessonPoints } from "@/lib/user-lesson-progress";

export async function getLessonContent(lessonId: string) {
  const session = await requireUser();

  const lesson = await prisma.lesson.findUnique({
    where: {
      id: lessonId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailKey: true,
      videoKey: true,
      position: true,
      contentBlocks: {
        orderBy: {
          position: "asc",
        },
        select: {
          id: true,
          type: true,
          position: true,
          content: true,
        },
      },
      lessonProgress: {
        where: {
          userId: session.id,
        },
        select: {
          completed: true,
          lessonId: true,
        },
      },
      Chapter: {
        select: {
          courseId: true,
          Course: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!lesson) {
    return notFound();
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.id,
        courseId: lesson.Chapter.courseId,
      },
    },
    select: {
      status: true,
    },
  });

  if (!enrollment || enrollment.status !== "Active") {
    return notFound();
  }

  // Get user's earned points for this lesson
  const userProgress = await getUserLessonPoints(lessonId, session.id);

  return {
    ...lesson,
    userProgress,
  };
}

export type LessonContentType = Awaited<ReturnType<typeof getLessonContent>>;
