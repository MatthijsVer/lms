import "server-only";
import { requireUser } from "../user/require-user";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { calculateLessonTotalPoints } from "@/lib/lesson-points";
import { ContentBlockType } from "@/lib/content-blocks";

export async function getCourseRoadmapData(slug: string) {
  const session = await requireUser();

  const course = await prisma.course.findUnique({
    where: {
      slug: slug,
    },
    select: {
      id: true,
      title: true,
      fileKey: true,
      level: true,
      category: true,
      slug: true,
      chapter: {
        orderBy: {
          position: "asc",
        },
        select: {
          id: true,
          title: true,
          position: true,
          lessons: {
            orderBy: {
              position: "asc",
            },
            select: {
              id: true,
              title: true,
              position: true,
              contentBlocks: {
                orderBy: {
                  position: "asc",
                },
                select: {
                  id: true,
                  type: true,
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
                  createdAt: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!course) {
    return notFound();
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.id,
        courseId: course.id,
      },
    },
  });

  if (!enrollment || enrollment.status !== "Active") {
    return notFound();
  }

  // Get all quiz attempts for this user in this course
  const allContentBlockIds = course.chapter.flatMap((chapter) =>
    chapter.lessons.flatMap((lesson) =>
      lesson.contentBlocks.map((block) => block.id)
    )
  );

  const quizAttempts = await prisma.quizAttempt.findMany({
    where: {
      userId: session.id,
      contentBlockId: {
        in: allContentBlockIds,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const contentBlockProgress = await prisma.contentBlockProgress.findMany({
    where: {
      userId: session.id,
      contentBlockId: {
        in: allContentBlockIds,
      },
    },
  });

  // Calculate statistics
  let totalLessons = 0;
  let completedLessons = 0;
  let totalPoints = 0;
  let earnedPoints = 0;
  let totalQuizzes = 0;
  let completedQuizzes = 0;
  let totalTimeSpent = 0;

  const chaptersWithProgress = course.chapter.map((chapter) => {
    const lessonsWithProgress = chapter.lessons.map((lesson) => {
      totalLessons++;
      const isCompleted = lesson.lessonProgress.length > 0;
      if (isCompleted) completedLessons++;

      // Calculate lesson points
      const normalizedBlocks = lesson.contentBlocks.map((block) => ({
        id: block.id,
        type: block.type as ContentBlockType,
        content: block.content as unknown,
      }));
      const lessonTotalPoints = calculateLessonTotalPoints(normalizedBlocks);
      totalPoints += lessonTotalPoints;

      // Calculate earned points for this lesson
      let lessonEarnedPoints = 0;
      const blockScores: Array<{
        blockId: string;
        type: string;
        earned: number;
        maxPoints: number;
      }> = [];

      lesson.contentBlocks.forEach((block) => {
        const blockContent = block.content as any;
        const blockPoints = blockContent?.points || 0;

        if (blockPoints > 0) {
          // Check if this is a quiz
          if (block.type === ContentBlockType.QUIZ) {
            totalQuizzes++;
            const bestAttempt = quizAttempts
              .filter((attempt) => attempt.contentBlockId === block.id)
              .sort((a, b) => b.score - a.score)[0];

            if (bestAttempt) {
              lessonEarnedPoints += bestAttempt.score;
              blockScores.push({
                blockId: block.id,
                type: block.type,
                earned: bestAttempt.score,
                maxPoints: blockPoints,
              });
              if (bestAttempt.isCorrect) completedQuizzes++;
              if (bestAttempt.timeSpent) totalTimeSpent += bestAttempt.timeSpent;
            } else {
              blockScores.push({
                blockId: block.id,
                type: block.type,
                earned: 0,
                maxPoints: blockPoints,
              });
            }
          } else {
            // For other interactive content blocks
            const progress = contentBlockProgress.find(
              (p) => p.contentBlockId === block.id
            );
            
            if (progress && progress.metadata) {
              const metadata = progress.metadata as any;
              const score = metadata?.score || 0;
              lessonEarnedPoints += score;
              blockScores.push({
                blockId: block.id,
                type: block.type,
                earned: score,
                maxPoints: blockPoints,
              });
            } else {
              blockScores.push({
                blockId: block.id,
                type: block.type,
                earned: 0,
                maxPoints: blockPoints,
              });
            }
          }
        }
      });

      earnedPoints += lessonEarnedPoints;

      // Get quiz attempts for this lesson
      const lessonQuizAttempts = quizAttempts.filter((attempt) =>
        lesson.contentBlocks.some((block) => block.id === attempt.contentBlockId)
      );

      return {
        id: lesson.id,
        title: lesson.title,
        position: lesson.position,
        isCompleted,
        completedAt: lesson.lessonProgress[0]?.createdAt,
        totalPoints: lessonTotalPoints,
        earnedPoints: lessonEarnedPoints,
        blockScores,
        quizAttempts: lessonQuizAttempts.length,
        contentBlocks: lesson.contentBlocks,
      };
    });

    return {
      id: chapter.id,
      title: chapter.title,
      position: chapter.position,
      lessons: lessonsWithProgress,
    };
  });

  // Calculate achievements/badges
  const achievements = calculateAchievements({
    totalLessons,
    completedLessons,
    totalPoints,
    earnedPoints,
    totalQuizzes,
    completedQuizzes,
  });

  return {
    course: {
      id: course.id,
      title: course.title,
      fileKey: course.fileKey,
      level: course.level,
      category: course.category,
      slug: course.slug,
    },
    chapters: chaptersWithProgress,
    stats: {
      totalLessons,
      completedLessons,
      totalPoints,
      earnedPoints,
      totalQuizzes,
      completedQuizzes,
      totalTimeSpent,
      progressPercentage:
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      pointsPercentage:
        totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0,
    },
    achievements,
    enrolledAt: enrollment.createdAt,
  };
}

function calculateAchievements(data: {
  totalLessons: number;
  completedLessons: number;
  totalPoints: number;
  earnedPoints: number;
  totalQuizzes: number;
  completedQuizzes: number;
}) {
  const achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    earned: boolean;
    progress?: number;
    category: "completion" | "points" | "quiz" | "streak";
  }> = [];

  // Completion achievements
  achievements.push({
    id: "first-lesson",
    title: "First Steps",
    description: "Complete your first lesson",
    icon: "BookOpen",
    earned: data.completedLessons >= 1,
    category: "completion",
  });

  achievements.push({
    id: "quarter-complete",
    title: "Quarter Master",
    description: "Complete 25% of all lessons",
    icon: "Target",
    earned: data.completedLessons >= data.totalLessons * 0.25,
    progress: Math.min(
      100,
      Math.round((data.completedLessons / (data.totalLessons * 0.25)) * 100)
    ),
    category: "completion",
  });

  achievements.push({
    id: "half-complete",
    title: "Halfway Hero",
    description: "Complete 50% of all lessons",
    icon: "Award",
    earned: data.completedLessons >= data.totalLessons * 0.5,
    progress: Math.min(
      100,
      Math.round((data.completedLessons / (data.totalLessons * 0.5)) * 100)
    ),
    category: "completion",
  });

  achievements.push({
    id: "course-complete",
    title: "Course Champion",
    description: "Complete all lessons in the course",
    icon: "Trophy",
    earned: data.completedLessons === data.totalLessons && data.totalLessons > 0,
    progress: data.totalLessons > 0 
      ? Math.round((data.completedLessons / data.totalLessons) * 100)
      : 0,
    category: "completion",
  });

  // Points achievements
  if (data.totalPoints > 0) {
    achievements.push({
      id: "first-points",
      title: "Point Collector",
      description: "Earn your first points",
      icon: "Star",
      earned: data.earnedPoints > 0,
      category: "points",
    });

    achievements.push({
      id: "half-points",
      title: "Point Master",
      description: "Earn 50% of all available points",
      icon: "Sparkles",
      earned: data.earnedPoints >= data.totalPoints * 0.5,
      progress: Math.min(
        100,
        Math.round((data.earnedPoints / (data.totalPoints * 0.5)) * 100)
      ),
      category: "points",
    });

    achievements.push({
      id: "perfect-score",
      title: "Perfect Score",
      description: "Earn 100% of all available points",
      icon: "Crown",
      earned: data.earnedPoints === data.totalPoints,
      progress: Math.round((data.earnedPoints / data.totalPoints) * 100),
      category: "points",
    });
  }

  // Quiz achievements
  if (data.totalQuizzes > 0) {
    achievements.push({
      id: "quiz-master",
      title: "Quiz Master",
      description: "Complete all quizzes correctly",
      icon: "Brain",
      earned: data.completedQuizzes === data.totalQuizzes,
      progress: Math.round((data.completedQuizzes / data.totalQuizzes) * 100),
      category: "quiz",
    });
  }

  return achievements;
}

export type CourseRoadmapDataType = Awaited<ReturnType<typeof getCourseRoadmapData>>;
