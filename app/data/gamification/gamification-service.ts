import { prisma } from "@/lib/db";
import type { XPReason, BadgeRequirement } from "@/lib/generated/prisma";

export class GamificationService {
  // XP Configuration
  private static readonly XP_CONFIG = {
    LESSON_COMPLETED: 10,
    QUIZ_PASSED: 5,
    QUIZ_PERFECT_SCORE: 10,
    COURSE_COMPLETED: 50,
    STREAK_MILESTONE: 15,
    BADGE_EARNED: 20,
    DAILY_LOGIN: 2,
    FIRST_LESSON_OF_DAY: 5,
  };

  // Level calculation
  private static readonly BASE_XP_PER_LEVEL = 100;
  private static readonly XP_MULTIPLIER = 1.5;

  /**
   * Calculate XP required for a given level
   */
  static calculateXPForLevel(level: number): number {
    return Math.floor(
      this.BASE_XP_PER_LEVEL * Math.pow(this.XP_MULTIPLIER, level - 1)
    );
  }

  /**
   * Calculate level from total XP
   */
  static calculateLevelFromXP(totalXP: number): {
    level: number;
    xpToNextLevel: number;
    currentLevelXP: number;
  } {
    let level = 1;
    let xpForCurrentLevel = 0;
    let xpForNextLevel = this.calculateXPForLevel(1);

    while (totalXP >= xpForNextLevel) {
      level++;
      xpForCurrentLevel = xpForNextLevel;
      xpForNextLevel += this.calculateXPForLevel(level);
    }

    return {
      level,
      xpToNextLevel: xpForNextLevel - totalXP,
      currentLevelXP: totalXP - xpForCurrentLevel,
    };
  }

  /**
   * Award XP to a user and update their profile
   */
  static async awardXP({
    userId,
    amount,
    reason,
    description,
    referenceId,
    referenceType,
  }: {
    userId: string;
    amount: number;
    reason: XPReason;
    description?: string;
    referenceId?: string;
    referenceType?: string;
  }) {
    // Get or create user profile
    let profile = await prisma.userGameProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await prisma.userGameProfile.create({
        data: {
          userId,
          totalXP: 0,
          currentLevel: 1,
          xpToNextLevel: this.calculateXPForLevel(1),
        },
      });
    }

    // Create XP transaction - note the capital letters in the model name
    const transaction = await prisma.xPTransaction.create({
      data: {
        userId,
        amount,
        reason,
        description,
        referenceId,
        referenceType,
      },
    });

    // Update profile with new XP
    const newTotalXP = profile.totalXP + amount;
    const levelInfo = this.calculateLevelFromXP(newTotalXP);
    const oldLevel = profile.currentLevel;

    const updatedProfile = await prisma.userGameProfile.update({
      where: { userId },
      data: {
        totalXP: newTotalXP,
        currentLevel: levelInfo.level,
        xpToNextLevel: levelInfo.xpToNextLevel,
      },
    });

    return {
      transaction,
      profile: updatedProfile,
      leveledUp: levelInfo.level > oldLevel,
      newLevel: levelInfo.level,
    };
  }

  /**
   * Update user's daily streak
   */
  static async updateStreak(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    isNewRecord: boolean;
  }> {
    const profile = await prisma.userGameProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error("User profile not found");
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastActivity = profile.lastActivityDate
      ? new Date(
          profile.lastActivityDate.getFullYear(),
          profile.lastActivityDate.getMonth(),
          profile.lastActivityDate.getDate()
        )
      : null;

    let newStreak = profile.currentStreak;
    let isNewRecord = false;

    if (!lastActivity) {
      // First activity ever
      newStreak = 1;
    } else {
      const daysSinceLastActivity = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastActivity === 0) {
        // Same day - no change
        return {
          currentStreak: profile.currentStreak,
          longestStreak: profile.longestStreak,
          isNewRecord: false,
        };
      } else if (daysSinceLastActivity === 1) {
        // Consecutive day - increment streak
        newStreak = profile.currentStreak + 1;
      } else {
        // Streak broken - reset to 1
        newStreak = 1;
      }
    }

    const newLongestStreak = Math.max(newStreak, profile.longestStreak);
    isNewRecord = newLongestStreak > profile.longestStreak;

    await prisma.userGameProfile.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastActivityDate: now,
      },
    });

    // Award streak milestone XP
    if (newStreak % 7 === 0 && newStreak > 0) {
      await this.awardXP({
        userId,
        amount: this.XP_CONFIG.STREAK_MILESTONE,
        reason: "STREAK_MILESTONE",
        description: `${newStreak}-day streak milestone!`,
      });
    }

    return {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      isNewRecord,
    };
  }

  /**
   * Handle lesson completion
   */
  static async onLessonCompleted(userId: string, lessonId: string) {
    // Update streak
    await this.updateStreak(userId);

    // Award lesson completion XP
    const result = await this.awardXP({
      userId,
      amount: this.XP_CONFIG.LESSON_COMPLETED,
      reason: "LESSON_COMPLETED",
      description: "Completed a lesson",
      referenceId: lessonId,
      referenceType: "lesson",
    });

    // Update stats
    await prisma.userGameProfile.update({
      where: { userId },
      data: {
        totalLessonsCompleted: {
          increment: 1,
        },
      },
    });

    return result;
  }

  /**
   * Handle course completion
   */
  static async onCourseCompleted(userId: string, courseId: string) {
    // Award course completion XP
    const result = await this.awardXP({
      userId,
      amount: this.XP_CONFIG.COURSE_COMPLETED,
      reason: "COURSE_COMPLETED",
      description: "Completed a course",
      referenceId: courseId,
      referenceType: "course",
    });

    // Update stats
    await prisma.userGameProfile.update({
      where: { userId },
      data: {
        totalCoursesCompleted: {
          increment: 1,
        },
      },
    });

    return result;
  }

  /**
   * Handle quiz passed
   */
  static async onQuizPassed(
    userId: string,
    quizId: string,
    isPerfectScore: boolean = false
  ) {
    const xpAmount = isPerfectScore
      ? this.XP_CONFIG.QUIZ_PERFECT_SCORE
      : this.XP_CONFIG.QUIZ_PASSED;

    const result = await this.awardXP({
      userId,
      amount: xpAmount,
      reason: isPerfectScore ? "QUIZ_PERFECT_SCORE" : "QUIZ_PASSED",
      description: isPerfectScore ? "Perfect quiz score!" : "Passed a quiz",
      referenceId: quizId,
      referenceType: "quiz",
    });

    // Update stats
    await prisma.userGameProfile.update({
      where: { userId },
      data: {
        totalQuizzesPassed: {
          increment: 1,
        },
      },
    });

    return result;
  }

  /**
   * Check and award badges based on user progress
   */
  static async checkAndAwardBadges(userId: string): Promise<any[]> {
    const profile = await prisma.userGameProfile.findUnique({
      where: { userId },
      include: {
        userBadges: {
          include: {
            badge: true,
          },
        },
      },
    });

    if (!profile) {
      return [];
    }

    // Get all active badges that user hasn't earned yet
    const earnedBadgeIds = profile.userBadges.map((ub) => ub.badgeId);
    const availableBadges = await prisma.badge.findMany({
      where: {
        isActive: true,
        id: {
          notIn: earnedBadgeIds,
        },
      },
    });

    const newlyEarnedBadges: any[] = [];

    for (const badge of availableBadges) {
      const earned = await this.checkBadgeRequirement(
        userId,
        badge.requirement,
        badge.targetValue,
        profile
      );

      if (earned) {
        // Award the badge
        const userBadge = await prisma.userBadge.create({
          data: {
            userId,
            badgeId: badge.id,
            progress: badge.targetValue,
          },
        });

        // Award XP for earning badge
        if (badge.xpReward > 0) {
          await this.awardXP({
            userId,
            amount: badge.xpReward,
            reason: "BADGE_EARNED",
            description: `Earned badge: ${badge.name}`,
            referenceId: badge.id,
            referenceType: "badge",
          });
        }

        newlyEarnedBadges.push({
          ...badge,
          earnedAt: userBadge.earnedAt,
        });
      }
    }

    return newlyEarnedBadges;
  }

  /**
   * Check if user meets badge requirement
   */
  private static async checkBadgeRequirement(
    userId: string,
    requirement: BadgeRequirement,
    targetValue: number,
    profile: any
  ): Promise<boolean> {
    switch (requirement) {
      case "COMPLETE_COURSES":
        return profile.totalCoursesCompleted >= targetValue;

      case "COMPLETE_LESSONS":
        return profile.totalLessonsCompleted >= targetValue;

      case "MAINTAIN_STREAK":
        return profile.currentStreak >= targetValue;

      case "PASS_QUIZZES":
        return profile.totalQuizzesPassed >= targetValue;

      case "REACH_XP":
        return profile.totalXP >= targetValue;

      case "REACH_LEVEL":
        return profile.currentLevel >= targetValue;

      case "PERFECT_QUIZ_SCORE":
        // Would need to query quiz attempts for perfect scores
        const perfectQuizzes = await prisma.quizAttempt.count({
          where: {
            userId,
            isCorrect: true,
            score: 100, // Assuming 100 is perfect
          },
        });
        return perfectQuizzes >= targetValue;

      default:
        return false;
    }
  }

  /**
   * Get user's gamification profile with stats
   */
  static async getUserProfile(userId: string) {
    let profile = await prisma.userGameProfile.findUnique({
      where: { userId },
      include: {
        userBadges: {
          include: {
            badge: true,
          },
          orderBy: {
            earnedAt: "desc",
          },
        },
      },
    });

    // Create profile if it doesn't exist
    if (!profile) {
      profile = await prisma.userGameProfile.create({
        data: {
          userId,
          totalXP: 0,
          currentLevel: 1,
          xpToNextLevel: this.calculateXPForLevel(1),
        },
        include: {
          userBadges: {
            include: {
              badge: true,
            },
          },
        },
      });
    }

    return profile;
  }

  /**
   * Get user's recent XP transactions
   */
  static async getRecentTransactions(userId: string, limit: number = 10) {
    return prisma.xPTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}