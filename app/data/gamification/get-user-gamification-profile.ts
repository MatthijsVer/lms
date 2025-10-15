import "server-only";
import { requireUser } from "../user/require-user";
import { prisma } from "@/lib/db";
import { GamificationService } from "./gamification-service";

export async function getUserGamificationProfile() {
  const session = await requireUser();

  // Get user profile with badges
  const profile = await prisma.userGameProfile.findUnique({
    where: { userId: session.id },
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
    const newProfile = await prisma.userGameProfile.create({
      data: {
        userId: session.id,
        totalXP: 0,
        currentLevel: 1,
        xpToNextLevel: GamificationService.calculateXPForLevel(1),
      },
      include: {
        userBadges: {
          include: {
            badge: true,
          },
        },
      },
    });

    const allBadges = await prisma.badge.findMany({
      where: { isActive: true },
      orderBy: [{ rarity: "desc" }, { order: "asc" }],
    });

    return {
      ...newProfile,
      currentLevelXP: 0,
      earnedBadges: [],
      allBadges,
      recentTransactions: [],
    };
  }

  // Get all available badges
  const allBadges = await prisma.badge.findMany({
    where: { isActive: true },
    orderBy: [{ rarity: "desc" }, { order: "asc" }],
  });

  // Get recent XP transactions
  const recentTransactions = await prisma.xPTransaction.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Calculate current level XP
  const levelInfo = GamificationService.calculateLevelFromXP(profile.totalXP);

  return {
    ...profile,
    currentLevelXP: levelInfo.currentLevelXP,
    earnedBadges: profile.userBadges.map((ub) => ({
      ...ub.badge,
      earnedAt: ub.earnedAt,
    })),
    allBadges,
    recentTransactions,
  };
}

// Fixed type export - on a single line
export type UserGamificationProfile = Awaited<ReturnType<typeof getUserGamificationProfile>>;