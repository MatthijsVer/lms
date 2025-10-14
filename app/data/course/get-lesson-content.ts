import "server-only";
import { requireUser } from "../user/require-user";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

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

  // Get user's earned points for each content block
  const blockProgress = await prisma.contentBlockProgress.findMany({
    where: {
      userId: session.id,
      contentBlockId: {
        in: lesson.contentBlocks.map(block => block.id),
      },
    },
    select: {
      contentBlockId: true,
      type: true,
      metadata: true,
      completed: true,
    },
  });

  // Calculate total earned points and build block scores
  let totalEarned = 0;
  const blockScores = blockProgress.map(progress => {
    const metadata = progress.metadata as any;
    const earned = metadata?.score || 0;
    const maxPoints = metadata?.maxScore || 0;
    
    totalEarned += earned;
    
    return {
      blockId: progress.contentBlockId,
      type: progress.type,
      earned,
      maxPoints,
    };
  });

  return {
    ...lesson,
    userProgress: {
      totalEarned,
      blockScores,
    },
  };
}

export type LessonContentType = Awaited<ReturnType<typeof getLessonContent>>;