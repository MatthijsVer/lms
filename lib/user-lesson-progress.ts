import "server-only";
import { prisma } from "@/lib/db";
import { ContentBlockType } from "@/lib/content-blocks";

interface ContentBlockData {
  id: string;
  type: ContentBlockType;
  content: any;
}

/**
 * Get user's earned points from quiz attempts and content block progress
 */
export async function getUserLessonPoints(lessonId: string, userId: string) {
  // Get all content blocks for this lesson
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      contentBlocks: {
        select: {
          id: true,
          type: true,
          content: true,
        },
      },
    },
  });

  if (!lesson) {
    return { totalEarned: 0, blockScores: [] };
  }

  const earnedPoints = [];
  let totalEarned = 0;

  // Get quiz attempts for content blocks in this lesson
  for (const block of lesson.contentBlocks) {
    if (block.type === "QUIZ") {
      const bestAttempt = await prisma.quizAttempt.findFirst({
        where: {
          contentBlockId: block.id,
          userId: userId,
        },
        orderBy: {
          score: "desc", // Get the best score
        },
        select: {
          score: true,
          isCorrect: true,
        },
      });

      const points = bestAttempt?.score || 0;
      earnedPoints.push({
        blockId: block.id,
        type: block.type,
        earned: points,
        maxPoints: (block.content as any)?.points || 1,
      });
      totalEarned += points;
    } else if (block.type === "FILL_IN_BLANK") {
      // For fill-in-blank, check ContentBlockProgress metadata
      const progress = await prisma.contentBlockProgress.findUnique({
        where: {
          userId_contentBlockId: {
            userId: userId,
            contentBlockId: block.id,
          },
        },
        select: {
          metadata: true,
          completed: true,
        },
      });

      const metadata = progress?.metadata as any;
      const points = metadata?.bestScore || 0;
      earnedPoints.push({
        blockId: block.id,
        type: block.type,
        earned: points,
        maxPoints: (block.content as any)?.points || 1,
      });
      totalEarned += points;
    }
  }

  return {
    totalEarned,
    blockScores: earnedPoints,
  };
}

