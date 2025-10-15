import { PrismaClient } from "../lib/generated/prisma/index.js";
import { hash } from "@node-rs/argon2";

const prisma = new PrismaClient();

// Realistic names for fake users
const FIRST_NAMES = [
  "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn",
  "Sage", "Rowan", "River", "Phoenix", "Dakota", "Skylar", "Reese", "Cameron",
  "Blake", "Drew", "Finley", "Harper", "Emerson", "Kendall", "Peyton", "Charlie",
  "Sam", "Jamie", "Logan", "Parker", "Hayden", "Elliot"
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Walker", "Hall",
  "Allen", "Young", "King", "Wright", "Scott", "Green", "Baker"
];

const AVATAR_STYLES = [
  "adventurer",
  "avataaars",
  "big-smile",
  "bottts",
  "croodles",
  "fun-emoji",
  "pixel-art",
  "micah",
  "miniavs",
  "notionists",
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomUser() {
  const firstName = getRandomElement(FIRST_NAMES);
  const lastName = getRandomElement(LAST_NAMES);
  const name = `${firstName} ${lastName}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 999)}@example.com`;
  const avatarStyle = getRandomElement(AVATAR_STYLES);
  const image = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${email}`;
  
  return { name, email, image };
}

async function seedLeaderboards() {
  console.log("🏆 Seeding leaderboard data with fake users...");

  try {
    // Get existing users
    const existingUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    console.log(`Found ${existingUsers.length} existing users`);

    // Generate fake users to reach at least 50 total users
    const TARGET_USER_COUNT = 50;
    const usersToCreate = Math.max(0, TARGET_USER_COUNT - existingUsers.length);
    
    console.log(`Creating ${usersToCreate} fake users...`);

    const hashedPassword = await hash("password123", {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    const createdUsers = [];
    for (let i = 0; i < usersToCreate; i++) {
      const userData = generateRandomUser();
      
      try {
        const user = await prisma.user.create({
          data: {
            id: `fake_user_${Date.now()}_${i}`,
            name: userData.name,
            email: userData.email,
            emailVerified: true,
            image: userData.image,
            createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date within last year
            updatedAt: new Date(),
            accounts: {
              create: {
                id: `fake_account_${Date.now()}_${i}`,
                accountId: userData.email,
                providerId: "credential",
                password: hashedPassword,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        });
        
        createdUsers.push(user);
        
        if ((i + 1) % 10 === 0) {
          console.log(`  ✓ Created ${i + 1}/${usersToCreate} users`);
        }
      } catch (error) {
        console.error(`  ✗ Failed to create user ${userData.email}:`, error.message);
      }
    }

    console.log(`✓ Successfully created ${createdUsers.length} fake users`);

    // Combine all users
    const allUsers = [...existingUsers, ...createdUsers];
    console.log(`Total users for leaderboard: ${allUsers.length}`);

    // Create game profiles with varied realistic data
    console.log("\n📊 Creating game profiles and activity...");
    
    for (let i = 0; i < allUsers.length; i++) {
      const user = allUsers[i];
      const isTopPerformer = i < 5; // Make first 5 users top performers
      const isActive = Math.random() > 0.2; // 80% of users are active
      
      // Generate realistic-looking data with variation
      let totalLessons, totalCourses, totalQuizzes, currentStreak, longestStreak;
      
      if (isTopPerformer) {
        // Top performers: high stats
        totalLessons = Math.floor(Math.random() * 100) + 100; // 100-200 lessons
        totalCourses = Math.floor(totalLessons / 8); // ~12-25 courses
        totalQuizzes = Math.floor(totalLessons * 0.9); // 90% quiz completion
        currentStreak = Math.floor(Math.random() * 50) + 20; // 20-70 day streak
        longestStreak = currentStreak + Math.floor(Math.random() * 30);
      } else if (isActive) {
        // Active users: moderate stats
        totalLessons = Math.floor(Math.random() * 80) + 20; // 20-100 lessons
        totalCourses = Math.floor(totalLessons / 10); // ~2-10 courses
        totalQuizzes = Math.floor(totalLessons * 0.75); // 75% quiz completion
        currentStreak = Math.floor(Math.random() * 30); // 0-30 day streak
        longestStreak = Math.max(currentStreak, Math.floor(Math.random() * 50));
      } else {
        // Inactive users: low stats
        totalLessons = Math.floor(Math.random() * 20) + 5; // 5-25 lessons
        totalCourses = Math.floor(totalLessons / 15); // 0-2 courses
        totalQuizzes = Math.floor(totalLessons * 0.6); // 60% quiz completion
        currentStreak = Math.floor(Math.random() * 5); // 0-5 day streak
        longestStreak = Math.max(currentStreak, Math.floor(Math.random() * 10));
      }
      
      // Calculate XP based on activities
      const baseXP = (totalLessons * 10) + (totalCourses * 50) + (totalQuizzes * 5);
      const streakBonus = Math.floor(currentStreak / 7) * 15; // Bonus for week streaks
      const randomBonus = Math.floor(Math.random() * 300);
      const totalXP = baseXP + streakBonus + randomBonus;
      
      // Calculate level from XP
      const level = Math.floor(Math.sqrt(totalXP / 100)) + 1;
      const xpForCurrentLevel = Math.floor(100 * Math.pow(1.5, level - 1));
      const xpForNextLevel = Math.floor(100 * Math.pow(1.5, level));
      const currentLevelXP = totalXP - xpForCurrentLevel;
      const xpToNextLevel = xpForNextLevel - totalXP;

      // Determine last activity date
      let lastActivityDate;
      if (currentStreak > 0) {
        // Active today or recently
        const daysAgo = Math.random() > 0.5 ? 0 : 1;
        lastActivityDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      } else {
        // Inactive: random date in past
        lastActivityDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      }

      // Create or update game profile
      await prisma.userGameProfile.upsert({
        where: {
          userId: user.id,
        },
        update: {
          totalXP,
          currentLevel: level,
          xpToNextLevel,
          currentStreak,
          longestStreak,
          totalCoursesCompleted: totalCourses,
          totalLessonsCompleted: totalLessons,
          totalQuizzesPassed: totalQuizzes,
          lastActivityDate,
        },
        create: {
          userId: user.id,
          totalXP,
          currentLevel: level,
          xpToNextLevel,
          currentStreak,
          longestStreak,
          totalCoursesCompleted: totalCourses,
          totalLessonsCompleted: totalLessons,
          totalQuizzesPassed: totalQuizzes,
          lastActivityDate,
        },
      });

      // Create XP transactions
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Weekly XP transactions (more for active users)
      const weeklyTransactionCount = isActive ? Math.floor(Math.random() * 20) + 10 : Math.floor(Math.random() * 5);
      for (let j = 0; j < weeklyTransactionCount; j++) {
        const transactionDate = new Date(
          weekAgo.getTime() + Math.random() * (now.getTime() - weekAgo.getTime())
        );

        const reasons = [
          { reason: "LESSON_COMPLETED", amount: 10, description: "Completed a lesson" },
          { reason: "QUIZ_PASSED", amount: 5, description: "Passed a quiz" },
          { reason: "QUIZ_PERFECT_SCORE", amount: 10, description: "Perfect quiz score!" },
          { reason: "STREAK_MILESTONE", amount: 15, description: "Streak milestone!" },
        ];
        
        const selectedReason = getRandomElement(reasons);

        await prisma.xPTransaction.create({
          data: {
            userId: user.id,
            amount: selectedReason.amount,
            reason: selectedReason.reason,
            description: selectedReason.description,
            createdAt: transactionDate,
          },
        });
      }

      // Monthly XP transactions (older activity)
      const monthlyTransactionCount = isActive ? Math.floor(Math.random() * 40) + 20 : Math.floor(Math.random() * 10);
      for (let j = 0; j < monthlyTransactionCount; j++) {
        const transactionDate = new Date(
          monthAgo.getTime() + Math.random() * (weekAgo.getTime() - monthAgo.getTime())
        );

        const reasons = [
          { reason: "LESSON_COMPLETED", amount: 10, description: "Completed a lesson" },
          { reason: "QUIZ_PASSED", amount: 5, description: "Passed a quiz" },
          { reason: "COURSE_COMPLETED", amount: 50, description: "Completed a course" },
        ];
        
        const selectedReason = getRandomElement(reasons);

        await prisma.xPTransaction.create({
          data: {
            userId: user.id,
            amount: selectedReason.amount,
            reason: selectedReason.reason,
            description: selectedReason.description,
            createdAt: transactionDate,
          },
        });
      }

      if ((i + 1) % 10 === 0 || i === allUsers.length - 1) {
        console.log(`  ✓ Processed ${i + 1}/${allUsers.length} users`);
      }
    }

    console.log("\n🔄 Updating leaderboards...");

    // Ensure leaderboards exist
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

    // Update All-Time XP Leaderboard
    console.log("  📊 All-Time XP leaderboard...");
    const allTimeUsers = await prisma.userGameProfile.findMany({
      where: { totalXP: { gt: 0 } },
      orderBy: { totalXP: "desc" },
      take: 100,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    await prisma.leaderboardEntry.deleteMany({
      where: { leaderboardId: "all-time-xp" },
    });

    if (allTimeUsers.length > 0) {
      await prisma.leaderboardEntry.createMany({
        data: allTimeUsers.map((profile, index) => ({
          leaderboardId: "all-time-xp",
          userId: profile.userId,
          score: profile.totalXP,
          rank: index + 1,
          userName: profile.user.name || profile.user.email.split("@")[0],
          userImage: profile.user.image,
        })),
      });
      console.log(`    ✓ ${allTimeUsers.length} entries`);
    }

    // Update Weekly XP Leaderboard
    console.log("  📊 Weekly XP leaderboard...");
    const startOfWeek = new Date();
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyXP = await prisma.xPTransaction.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: startOfWeek } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 100,
    });

    const weeklyUserIds = weeklyXP.map((w) => w.userId);
    const weeklyUsers = await prisma.user.findMany({
      where: { id: { in: weeklyUserIds } },
      select: { id: true, name: true, email: true, image: true },
    });

    const weeklyUserMap = new Map(weeklyUsers.map((u) => [u.id, u]));

    await prisma.leaderboardEntry.deleteMany({
      where: { leaderboardId: "weekly-xp" },
    });

    const weeklyEntries = weeklyXP
      .filter((w) => w._sum.amount && w._sum.amount > 0)
      .map((w, index) => {
        const user = weeklyUserMap.get(w.userId);
        return {
          leaderboardId: "weekly-xp",
          userId: w.userId,
          score: w._sum.amount || 0,
          rank: index + 1,
          userName: user?.name || user?.email.split("@")[0] || "Unknown",
          userImage: user?.image,
        };
      });

    if (weeklyEntries.length > 0) {
      await prisma.leaderboardEntry.createMany({ data: weeklyEntries });
      console.log(`    ✓ ${weeklyEntries.length} entries`);
    }

    // Update Monthly XP Leaderboard
    console.log("  📊 Monthly XP leaderboard...");
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyXP = await prisma.xPTransaction.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 100,
    });

    const monthlyUserIds = monthlyXP.map((m) => m.userId);
    const monthlyUsers = await prisma.user.findMany({
      where: { id: { in: monthlyUserIds } },
      select: { id: true, name: true, email: true, image: true },
    });

    const monthlyUserMap = new Map(monthlyUsers.map((u) => [u.id, u]));

    await prisma.leaderboardEntry.deleteMany({
      where: { leaderboardId: "monthly-xp" },
    });

    const monthlyEntries = monthlyXP
      .filter((m) => m._sum.amount && m._sum.amount > 0)
      .map((m, index) => {
        const user = monthlyUserMap.get(m.userId);
        return {
          leaderboardId: "monthly-xp",
          userId: m.userId,
          score: m._sum.amount || 0,
          rank: index + 1,
          userName: user?.name || user?.email.split("@")[0] || "Unknown",
          userImage: user?.image,
        };
      });

    if (monthlyEntries.length > 0) {
      await prisma.leaderboardEntry.createMany({ data: monthlyEntries });
      console.log(`    ✓ ${monthlyEntries.length} entries`);
    }

    // Update Streak Leaderboard
    console.log("  📊 Streak leaderboard...");
    const streakUsers = await prisma.userGameProfile.findMany({
      where: { currentStreak: { gt: 0 } },
      orderBy: { currentStreak: "desc" },
      take: 100,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    await prisma.leaderboardEntry.deleteMany({
      where: { leaderboardId: "streak-length" },
    });

    if (streakUsers.length > 0) {
      await prisma.leaderboardEntry.createMany({
        data: streakUsers.map((profile, index) => ({
          leaderboardId: "streak-length",
          userId: profile.userId,
          score: profile.currentStreak,
          rank: index + 1,
          userName: profile.user.name || profile.user.email.split("@")[0],
          userImage: profile.user.image,
        })),
      });
      console.log(`    ✓ ${streakUsers.length} entries`);
    }

    // Update Courses Completed Leaderboard
    console.log("  📊 Courses leaderboard...");
    const courseUsers = await prisma.userGameProfile.findMany({
      where: { totalCoursesCompleted: { gt: 0 } },
      orderBy: { totalCoursesCompleted: "desc" },
      take: 100,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    await prisma.leaderboardEntry.deleteMany({
      where: { leaderboardId: "courses-completed" },
    });

    if (courseUsers.length > 0) {
      await prisma.leaderboardEntry.createMany({
        data: courseUsers.map((profile, index) => ({
          leaderboardId: "courses-completed",
          userId: profile.userId,
          score: profile.totalCoursesCompleted,
          rank: index + 1,
          userName: profile.user.name || profile.user.email.split("@")[0],
          userImage: profile.user.image,
        })),
      });
      console.log(`    ✓ ${courseUsers.length} entries`);
    }

    console.log("\n✅ Leaderboard seeding completed successfully!");
    console.log(`   Total users: ${allUsers.length}`);
    console.log(`   New fake users created: ${createdUsers.length}`);
  } catch (error) {
    console.error("❌ Error seeding leaderboards:", error);
    throw error;
  }
}

seedLeaderboards()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });