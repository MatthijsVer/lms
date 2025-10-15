import "server-only";
import { prisma } from "@/lib/db";

export class LeaderboardService {
  /**
   * Get or create global leaderboards
   */
  static async ensureLeaderboardsExist() {
    // All-time XP leaderboard
    await prisma.leaderboard.upsert({
      where: { id: "all-time-xp" },
      update: {},
      create: {
        id: "all-time-xp",
        name: "All-Time Top Learners",
        description: "The ultimate learners with the most XP earned",
        type: "XP_TOTAL",
        timeframe: "ALL_TIME",
        isActive: true,
      },
    });

    // Weekly XP leaderboard
    await prisma.leaderboard.upsert({
      where: { id: "weekly-xp" },
      update: {},
      create: {
        id: "weekly-xp",
        name: "This Week's Champions",
        description: "Top XP earners this week",
        type: "XP_WEEKLY",
        timeframe: "WEEKLY",
        isActive: true,
      },
    });

    // Monthly XP leaderboard
    await prisma.leaderboard.upsert({
      where: { id: "monthly-xp" },
      update: {},
      create: {
        id: "monthly-xp",
        name: "Monthly Masters",
        description: "Top XP earners this month",
        type: "XP_MONTHLY",
        timeframe: "MONTHLY",
        isActive: true,
      },
    });

    // Longest streak leaderboard
    await prisma.leaderboard.upsert({
      where: { id: "streak-length" },
      update: {},
      create: {
        id: "streak-length",
        name: "Streak Legends",
        description: "Users with the longest learning streaks",
        type: "STREAK_LENGTH",
        timeframe: "ALL_TIME",
        isActive: true,
      },
    });

    // Most courses completed
    await prisma.leaderboard.upsert({
      where: { id: "courses-completed" },
      update: {},
      create: {
        id: "courses-completed",
        name: "Course Completionists",
        description: "Users who have completed the most courses",
        type: "COURSES_COMPLETED",
        timeframe: "ALL_TIME",
        isActive: true,
      },
    });
  }

  /**
   * Calculate and update all-time XP leaderboard
   */
  static async updateAllTimeXPLeaderboard() {
    const leaderboardId = "all-time-xp";

    // Get top 100 users by total XP
    const topUsers = await prisma.userGameProfile.findMany({
      where: {
        totalXP: {
          gt: 0,
        },
      },
      orderBy: {
        totalXP: "desc",
      },
      take: 100,
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

    // Delete old entries
    await prisma.leaderboardEntry.deleteMany({
      where: { leaderboardId },
    });

    // Create new entries
    const entries = topUsers.map((profile, index) => ({
      leaderboardId,
      userId: profile.userId,
      score: profile.totalXP,
      rank: index + 1,
      userName: profile.user.name || profile.user.email.split("@")[0],
      userImage: profile.user.image,
    }));

    if (entries.length > 0) {
      await prisma.leaderboardEntry.createMany({
        data: entries,
      });
    }

    return entries.length;
  }

  /**
   * Calculate and update weekly XP leaderboard
   */
  static async updateWeeklyXPLeaderboard() {
    const leaderboardId = "weekly-xp";

    // Get start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // adjust when day is Sunday
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Get XP earned this week grouped by user
    const weeklyXP = await prisma.xPTransaction.groupBy({
      by: ["userId"],
      where: {
        createdAt: {
          gte: startOfWeek,
        },
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: "desc",
        },
      },
      take: 100,
    });

    // Get user details
    const userIds = weeklyXP.map((w) => w.userId);
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Delete old entries
    await prisma.leaderboardEntry.deleteMany({
      where: { leaderboardId },
    });

    // Create new entries
    const entries = weeklyXP
      .filter((w) => w._sum.amount && w._sum.amount > 0)
      .map((w, index) => {
        const user = userMap.get(w.userId);
        return {
          leaderboardId,
          userId: w.userId,
          score: w._sum.amount || 0,
          rank: index + 1,
          userName: user?.name || user?.email.split("@")[0] || "Unknown",
          userImage: user?.image,
        };
      });

    if (entries.length > 0) {
      await prisma.leaderboardEntry.createMany({
        data: entries,
      });
    }

    return entries.length;
  }

  /**
   * Calculate and update monthly XP leaderboard
   */
  static async updateMonthlyXPLeaderboard() {
    const leaderboardId = "monthly-xp";

    // Get start of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get XP earned this month grouped by user
    const monthlyXP = await prisma.xPTransaction.groupBy({
      by: ["userId"],
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: "desc",
        },
      },
      take: 100,
    });

    // Get user details
    const userIds = monthlyXP.map((m) => m.userId);
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Delete old entries
    await prisma.leaderboardEntry.deleteMany({
      where: { leaderboardId },
    });

    // Create new entries
    const entries = monthlyXP
      .filter((m) => m._sum.amount && m._sum.amount > 0)
      .map((m, index) => {
        const user = userMap.get(m.userId);
        return {
          leaderboardId,
          userId: m.userId,
          score: m._sum.amount || 0,
          rank: index + 1,
          userName: user?.name || user?.email.split("@")[0] || "Unknown",
          userImage: user?.image,
        };
      });

    if (entries.length > 0) {
      await prisma.leaderboardEntry.createMany({
        data: entries,
      });
    }

    return entries.length;
  }

  /**
   * Calculate and update streak leaderboard
   */
  static async updateStreakLeaderboard() {
    const leaderboardId = "streak-length";

    // Get top users by current streak
    const topUsers = await prisma.userGameProfile.findMany({
      where: {
        currentStreak: {
          gt: 0,
        },
      },
      orderBy: {
        currentStreak: "desc",
      },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Delete old entries
    await prisma.leaderboardEntry.deleteMany({
      where: { leaderboardId },
    });

    // Create new entries
    const entries = topUsers.map((profile, index) => ({
      leaderboardId,
      userId: profile.userId,
      score: profile.currentStreak,
      rank: index + 1,
      userName: profile.user.name || profile.user.email.split("@")[0],
      userImage: profile.user.image,
    }));

    if (entries.length > 0) {
      await prisma.leaderboardEntry.createMany({
        data: entries,
      });
    }

    return entries.length;
  }

  /**
   * Calculate and update courses completed leaderboard
   */
  static async updateCoursesCompletedLeaderboard() {
    const leaderboardId = "courses-completed";

    // Get top users by courses completed
    const topUsers = await prisma.userGameProfile.findMany({
      where: {
        totalCoursesCompleted: {
          gt: 0,
        },
      },
      orderBy: {
        totalCoursesCompleted: "desc",
      },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Delete old entries
    await prisma.leaderboardEntry.deleteMany({
      where: { leaderboardId },
    });

    // Create new entries
    const entries = topUsers.map((profile, index) => ({
      leaderboardId,
      userId: profile.userId,
      score: profile.totalCoursesCompleted,
      rank: index + 1,
      userName: profile.user.name || profile.user.email.split("@")[0],
      userImage: profile.user.image,
    }));

    if (entries.length > 0) {
      await prisma.leaderboardEntry.createMany({
        data: entries,
      });
    }

    return entries.length;
  }

  /**
   * Update all leaderboards
   */
  static async updateAllLeaderboards() {
    await this.ensureLeaderboardsExist();

    const results = await Promise.all([
      this.updateAllTimeXPLeaderboard(),
      this.updateWeeklyXPLeaderboard(),
      this.updateMonthlyXPLeaderboard(),
      this.updateStreakLeaderboard(),
      this.updateCoursesCompletedLeaderboard(),
    ]);

    return {
      allTime: results[0],
      weekly: results[1],
      monthly: results[2],
      streak: results[3],
      courses: results[4],
    };
  }

  /**
   * Get leaderboard with entries and user's rank
   */
  static async getLeaderboard(leaderboardId: string, userId: string) {
    const leaderboard = await prisma.leaderboard.findUnique({
      where: { id: leaderboardId, isActive: true },
      include: {
        entries: {
          orderBy: {
            rank: "asc",
          },
          take: 50, // Top 50
        },
      },
    });

    if (!leaderboard) {
      return null;
    }

    // Get user's rank if not in top 50
    const userEntry = await prisma.leaderboardEntry.findUnique({
      where: {
        leaderboardId_userId: {
          leaderboardId,
          userId,
        },
      },
    });

    return {
      ...leaderboard,
      userEntry,
    };
  }

  /**
   * Get user's rank across all leaderboards
   */
  static async getUserRanks(userId: string) {
    const entries = await prisma.leaderboardEntry.findMany({
      where: { userId },
      include: {
        leaderboard: true,
      },
    });

    return entries.map((entry) => ({
      leaderboardId: entry.leaderboardId,
      leaderboardName: entry.leaderboard.name,
      rank: entry.rank,
      score: entry.score,
    }));
  }
}