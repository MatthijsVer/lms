import "server-only";
import { prisma } from "@/lib/db";
import {
  XP_REWARDS,
  calculateLevelFromXP,
  calculateXPForLevel,
} from "@/lib/gamification/xp-config";
import { XPReason, BadgeRequirement } from "@/lib/types";

export class GamificationService {
  /**
   * Initialize game profile for a new user
   */
  static async initializeUserProfile(userId: string) {
    const existingProfile = await prisma.userGameProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      return existingProfile;
    }

    return await prisma.userGameProfile.create({
      data: {
        userId,
        totalXP: 0,
        currentLevel: 1,
        xpToNextLevel: calculateXPForLevel(1),
        currentStreak: 0,
        longestStreak: 0,
      },
    });
  }

  /**
   * Award XP to a user and handle level ups
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
    // Ensure user has a game profile
    await this.initializeUserProfile(userId);

    // Create XP transaction
    const transaction = await prisma.xpTransaction.create({
      data: {
        userId,
        amount,
        reason,
        description,
        referenceId,
        referenceType,
      },
    });

    // Update user profile
    const profile = await prisma.userGameProfile.update({
      where: { userId },
      data: {
        totalXP: {
          increment: amount,
        },
      },
    });

    // Check for level up
    const levelInfo = calculateLevelFromXP(profile.totalXP);
    let leveledUp = false;

    if (levelInfo.level > profile.currentLevel) {
      leveledUp = true;
      await prisma.userGameProfile.update({
        where: { userId },
        data: {
          currentLevel: levelInfo.level,
          xpToNextLevel: levelInfo.xpToNextLevel,
        },
      });

      // Check for level-based badges
      await this.checkAndAwardBadges(userId);
    } else {
      await prisma.userGameProfile.update({
        where: { userId },
        data: {
          xpToNextLevel: levelInfo.xpToNextLevel,
        },
      });
    }

    return {
      transaction,
      profile: await prisma.userGameProfile.findUnique({ where: { userId } }),
      leveledUp,
      newLevel: levelInfo.level,
    };
  }

  /**
   * Update user streak
   */
  static async updateStreak(userId: string) {
    const profile = await prisma.userGameProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      await this.initializeUserProfile(userId);
      return await this.updateStreak(userId);
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
    let awardedXP = 0;

    if (!lastActivity) {
      // First activity ever
      newStreak = 1;
    } else {
      const daysDiff = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 0) {
        // Same day, no change
        return profile;
      } else if (daysDiff === 1) {
        // Consecutive day
        newStreak = profile.currentStreak + 1;
        
        // Award milestone XP
        if (newStreak === 3) awardedXP = XP_REWARDS.STREAK_MILESTONE_3;
        else if (newStreak === 7) awardedXP = XP_REWARDS.STREAK_MILESTONE_7;
        else if (newStreak === 30) awardedXP = XP_REWARDS.STREAK_MILESTONE_30;
        else if (newStreak === 100) awardedXP = XP_REWARDS.STREAK_MILESTONE_100;
      } else {
        // Streak broken
        newStreak = 1;
      }
    }

    const updatedProfile = await prisma.userGameProfile.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, profile.longestStreak),
        lastActivityDate: now,
      },
    });

    // Award streak milestone XP
    if (awardedXP > 0) {
      await this.awardXP({
        userId,
        amount: awardedXP,
        reason: XPReason.STREAK_MILESTONE,
        description: `${newStreak} day streak milestone!`,
      });
    }

    // Check for streak-based badges
    await this.checkAndAwardBadges(userId);

    return updatedProfile;
  }

  /**
   * Handle lesson completion
   */
  static async onLessonCompleted(userId: string, lessonId: string) {
    await this.updateStreak(userId);

    const result = await this.awardXP({
      userId,
      amount: XP_REWARDS.LESSON_COMPLETED,
      reason: XPReason.LESSON_COMPLETED,
      description: "Completed a lesson",
      referenceId: lessonId,
      referenceType: "lesson",
    });

    // Update statistics
    await prisma.userGameProfile.update({
      where: { userId },
      data: {
        totalLessonsCompleted: {
          increment: 1,
        },
      },
    });

    await this.checkAndAwardBadges(userId);

    return result;
  }

  /**
   * Handle quiz completion
   */
  static async onQuizCompleted({
    userId,
    quizId,
    score,
    isPerfect,
  }: {
    userId: string;
    quizId: string;
    score: number;
    isPerfect: boolean;
  }) {
    const xpAmount = isPerfect
      ? XP_REWARDS.QUIZ_PERFECT_SCORE
      : XP_REWARDS.QUIZ_PASSED;

    const result = await this.awardXP({
      userId,
      amount: xpAmount,
      reason: isPerfect ? XPReason.QUIZ_PERFECT_SCORE : XPReason.QUIZ_PASSED,
      description: isPerfect ? "Perfect quiz score!" : "Passed a quiz",
      referenceId: quizId,
      referenceType: "quiz",
    });

    // Update statistics
    await prisma.userGameProfile.update({
      where: { userId },
      data: {
        totalQuizzesPassed: {
          increment: 1,
        },
      },
    });

    await this.checkAndAwardBadges(userId);

    return result;
  }

  /**
   * Handle course completion
   */
  static async onCourseCompleted(userId: string, courseId: string) {
    const result = await this.awardXP({
      userId,
      amount: XP_REWARDS.COURSE_COMPLETED,
      reason: XPReason.COURSE_COMPLETED,
      description: "Completed a course",
      referenceId: courseId,
      referenceType: "course",
    });

    // Update statistics
    await prisma.userGameProfile.update({
      where: { userId },
      data: {
        totalCoursesCompleted: {
          increment: 1,
        },
      },
    });

    await this.checkAndAwardBadges(userId);

    return result;
  }

  /**
   * Check and award badges based on user progress
   */
  static async checkAndAwardBadges(userId: string) {
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

    if (!profile) return;

    // Get all active badges user doesn't have yet
    const earnedBadgeIds = profile.userBadges.map((ub) => ub.badgeId);
    const availableBadges = await prisma.badge.findMany({
      where: {
        isActive: true,
        id: {
          notIn: earnedBadgeIds,
        },
      },
    });

    const newlyEarnedBadges = [];

    for (const badge of availableBadges) {
      let earned = false;

      switch (badge.requirement) {
        case BadgeRequirement.COMPLETE_COURSES:
          earned = profile.totalCoursesCompleted >= badge.targetValue;
          break;
        case BadgeRequirement.COMPLETE_LESSONS:
          earned = profile.totalLessonsCompleted >= badge.targetValue;
          break;
        case BadgeRequirement.MAINTAIN_STREAK:
          earned = profile.currentStreak >= badge.targetValue;
          break;
        case BadgeRequirement.PASS_QUIZZES:
          earned = profile.totalQuizzesPassed >= badge.targetValue;
          break;
        case BadgeRequirement.REACH_XP:
          earned = profile.totalXP >= badge.targetValue;
          break;
        case BadgeRequirement.REACH_LEVEL:
          earned = profile.currentLevel >= badge.targetValue;
          break;
      }

      if (earned) {
        await prisma.userBadge.create({
          data: {
            userId,
            badgeId: badge.id,
          },
        });

        // Award badge XP
        if (badge.xpReward > 0) {
          await this.awardXP({
            userId,
            amount: badge.xpReward,
            reason: XPReason.BADGE_EARNED,
            description: `Earned badge: ${badge.name}`,
            referenceId: badge.id,
            referenceType: "badge",
          });
        }

        newlyEarnedBadges.push(badge);
      }
    }

    return newlyEarnedBadges;
  }

  /**
   * Get user's complete gamification profile
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
        xpTransactions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
        },
      },
    });

    if (!profile) {
      profile = await this.initializeUserProfile(userId);
    }

    return profile;
  }

  /**
   * Get leaderboard
   */
  static async getLeaderboard({
    type = "XP_TOTAL",
    limit = 100,
  }: {
    type?: string;
    limit?: number;
  }) {
    const profiles = await prisma.userGameProfile.findMany({
      take: limit,
      orderBy: {
        totalXP: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return profiles.map((profile, index) => ({
      rank: index + 1,
      userId: profile.userId,
      userName: profile.user.name,
      userImage: profile.user.image,
      score: profile.totalXP,
      level: profile.currentLevel,
      totalCoursesCompleted: profile.totalCoursesCompleted,
      currentStreak: profile.currentStreak,
    }));
  }
}