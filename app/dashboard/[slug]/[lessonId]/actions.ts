"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { GamificationService } from "@/app/data/gamification/gamification-service";

type BlockProgress = {
  blockId: string;
  completed: boolean;
  score: number;
  maxScore: number;
  attempts: number;
};

type GamificationResult = {
  xpEarned: number;
  leveledUp: boolean;
  newLevel: number;
  newBadges?: any[];
};

type MarkLessonCompleteResponse = ApiResponse & {
  gamification?: GamificationResult;
};

export async function markLessonComplete({
  lessonId,
  slug,
  blockProgress = [],
  totalScore = 0,
  maxScore = 0,
}: {
  lessonId: string;
  slug: string;
  blockProgress?: BlockProgress[];
  totalScore?: number;
  maxScore?: number;
}): Promise<MarkLessonCompleteResponse> {
  const session = await requireUser();

  try {
    // Check if already completed
    const existingProgress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: session.id,
          lessonId: lessonId,
        },
      },
    });

    const isAlreadyCompleted = existingProgress?.completed === true;

    // Get the lesson with its content blocks to validate
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        contentBlocks: {
          select: {
            id: true,
            type: true,
          },
        },
        Chapter: {
          include: {
            Course: {
              select: {
                id: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      return {
        status: "error",
        message: "Lesson not found",
      };
    }

    // Identify interactive blocks that require completion
    const interactiveTypes = [
      "QUIZ",
      "FILL_IN_BLANK",
      "MATCHING",
      "ORDERING",
      "DRAG_DROP",
      "TIMELINE",
      "CODE_EXERCISE",
    ];

    const interactiveBlocks = lesson.contentBlocks.filter((block) =>
      interactiveTypes.includes(block.type)
    );

    // Validate that all interactive blocks are completed
    if (interactiveBlocks.length > 0 && blockProgress.length > 0) {
      const completedBlockIds = new Set(
        blockProgress.filter((bp) => bp.completed).map((bp) => bp.blockId)
      );

      const allInteractiveCompleted = interactiveBlocks.every((block) =>
        completedBlockIds.has(block.id)
      );

      if (!allInteractiveCompleted && !isAlreadyCompleted) {
        return {
          status: "error",
          message: "Please complete all exercises before marking this lesson as complete",
        };
      }
    }

    // Save block progress to database
    if (blockProgress.length > 0) {
      await Promise.all(
        blockProgress.map(async (bp) => {
          // Find the content block to get its type
          const block = lesson.contentBlocks.find((b) => b.id === bp.blockId);
          if (!block) return;

          await prisma.contentBlockProgress.upsert({
            where: {
              userId_contentBlockId: {
                userId: session.id,
                contentBlockId: bp.blockId,
              },
            },
            create: {
              userId: session.id,
              contentBlockId: bp.blockId,
              type: block.type,
              completed: bp.completed,
              metadata: {
                score: bp.score,
                maxScore: bp.maxScore,
                attempts: bp.attempts,
                lastAttempt: new Date().toISOString(),
              },
            },
            update: {
              completed: bp.completed,
              metadata: {
                score: bp.score,
                maxScore: bp.maxScore,
                attempts: bp.attempts,
                lastAttempt: new Date().toISOString(),
              },
            },
          });
        })
      );
    }

    // Mark lesson as complete
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.id,
          lessonId: lessonId,
        },
      },
      update: {
        completed: true,
      },
      create: {
        lessonId: lessonId,
        userId: session.id,
        completed: true,
      },
    });

    // 🎮 GAMIFICATION: Award XP only if not already completed
    let gamificationResult: {
      transaction: { amount: number };
      leveledUp: boolean;
      newLevel: number;
      profile: any;
    } | null = null;

    let newBadges: any[] = [];

    if (!isAlreadyCompleted) {
      // Calculate bonus XP based on performance
      let bonusXP = 0;
      if (blockProgress.length > 0 && maxScore > 0) {
        const performancePercentage = (totalScore / maxScore) * 100;
        
        // Award bonus XP for high performance
        if (performancePercentage === 100) {
          bonusXP = 5; // Perfect score bonus
        } else if (performancePercentage >= 90) {
          bonusXP = 3; // Excellent performance
        } else if (performancePercentage >= 80) {
          bonusXP = 2; // Good performance
        }
      }

      // Award base lesson completion XP
      gamificationResult = await GamificationService.onLessonCompleted(
        session.id,
        lessonId
      );

      // Award bonus XP if earned
      if (bonusXP > 0) {
        await GamificationService.awardXP({
          userId: session.id,
          amount: bonusXP,
          reason: "SPEED_BONUS",
          description: `Performance bonus: ${bonusXP} XP`,
          referenceId: lessonId,
          referenceType: "lesson",
        });

        // Add bonus to total XP earned
        gamificationResult.transaction.amount += bonusXP;
      }

      // Check for newly earned badges
      newBadges = await GamificationService.checkAndAwardBadges(session.id);

      // Check if course is now complete
      await checkCourseCompletion(session.id, lesson.Chapter.Course.id);
    }

    revalidatePath(`/dashboard/${slug}`);

    return {
      status: "success",
      message: isAlreadyCompleted
        ? "Lesson already completed"
        : "Lesson completed! 🎉",
      gamification: gamificationResult
        ? {
            xpEarned: gamificationResult.transaction.amount,
            leveledUp: gamificationResult.leveledUp,
            newLevel: gamificationResult.newLevel ?? 1,
            newBadges: newBadges.length > 0 ? newBadges : undefined,
          }
        : undefined,
    };
  } catch (error) {
    console.error("Failed to mark lesson as complete:", error);
    return {
      status: "error",
      message: "Failed to mark lesson as complete",
    };
  }
}

export async function saveBlockProgress({
  lessonId,
  blockId,
  completed,
  score,
  maxScore,
  attempts,
  metadata,
}: {
  lessonId: string;
  blockId: string;
  completed?: boolean;
  score?: number;
  maxScore?: number;
  attempts?: number;
  metadata?: Record<string, any>;
}) {
  const session = await requireUser();

  const block = await prisma.contentBlock.findUnique({
    where: { id: blockId },
    select: { id: true, type: true, lessonId: true },
  });

  if (!block || block.lessonId !== lessonId) {
    throw new Error("Content block not found for this lesson");
  }

  const existingProgress = await prisma.contentBlockProgress.findUnique({
    where: {
      userId_contentBlockId: {
        userId: session.id,
        contentBlockId: blockId,
      },
    },
  });

  const previousMetadata = (existingProgress?.metadata ?? {}) as
    | Record<string, any>
    | null;

  const mergedMetadata: Record<string, any> = {
    ...(previousMetadata ?? {}),
    ...(metadata ?? {}),
  };

  if (score !== undefined) {
    mergedMetadata.score = score;
  } else if (previousMetadata?.score !== undefined) {
    mergedMetadata.score = previousMetadata.score;
  }

  if (maxScore !== undefined) {
    mergedMetadata.maxScore = maxScore;
  } else if (previousMetadata?.maxScore !== undefined) {
    mergedMetadata.maxScore = previousMetadata.maxScore;
  }

  if (attempts !== undefined) {
    mergedMetadata.attempts = attempts;
  } else if (previousMetadata?.attempts !== undefined) {
    mergedMetadata.attempts = previousMetadata.attempts;
  }

  mergedMetadata.lastUpdated = new Date().toISOString();

  await prisma.contentBlockProgress.upsert({
    where: {
      userId_contentBlockId: {
        userId: session.id,
        contentBlockId: blockId,
      },
    },
    create: {
      userId: session.id,
      contentBlockId: blockId,
      type: block.type,
      completed: completed ?? false,
      metadata: mergedMetadata,
    },
    update: {
      completed: completed ?? existingProgress?.completed ?? false,
      metadata: mergedMetadata,
    },
  });

  return { success: true };
}

export async function resetLessonProgress({
  lessonId,
  slug,
}: {
  lessonId: string;
  slug: string;
}) {
  const session = await requireUser();

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        contentBlocks: {
          select: { id: true },
        },
      },
    });

    if (!lesson) {
      return {
        status: "error",
        message: "Lesson not found",
      };
    }

    const blockIds = lesson.contentBlocks.map((block) => block.id);

    await prisma.$transaction([
      prisma.contentBlockProgress.deleteMany({
        where: {
          userId: session.id,
          contentBlockId: {
            in: blockIds,
          },
        },
      }),
      prisma.lessonProgress.deleteMany({
        where: {
          userId: session.id,
          lessonId,
        },
      }),
    ]);

    revalidatePath(`/dashboard/${slug}`);
    revalidatePath(`/dashboard/${slug}/${lessonId}`);

    return {
      status: "success",
      message: "Lesson progress reset",
    };
  } catch (error) {
    console.error("Failed to reset lesson progress", error);
    return {
      status: "error",
      message: "Failed to reset lesson progress",
    };
  }
}

// Helper function to check if course is complete
async function checkCourseCompletion(userId: string, courseId: string) {
  try {
    // Get all lessons in the course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        chapter: {
          include: {
            lessons: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!course) return;

    // Get all lesson IDs
    const allLessonIds = course.chapter.flatMap((chapter) =>
      chapter.lessons.map((lesson) => lesson.id)
    );

    // Check if all lessons are completed
    const completedLessons = await prisma.lessonProgress.count({
      where: {
        userId,
        lessonId: {
          in: allLessonIds,
        },
        completed: true,
      },
    });

    const isCourseCompleted = completedLessons === allLessonIds.length;

    if (isCourseCompleted) {
      // Check if we've already awarded course completion
      const existingCompletion = await prisma.xPTransaction.findFirst({
        where: {
          userId,
          referenceId: courseId,
          referenceType: "course",
          reason: "COURSE_COMPLETED",
        },
      });

      if (!existingCompletion) {
        // 🎮 Award course completion XP and check for new badges
        await GamificationService.onCourseCompleted(userId, courseId);
      }
    }
  } catch (error) {
    console.error("Failed to check course completion:", error);
  }
}
