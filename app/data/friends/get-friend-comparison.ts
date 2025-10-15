import "server-only";
import { requireUser } from "../user/require-user";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { FriendService } from "./friend-service";

export async function getFriendComparison(friendUserId: string) {
  try {
    const session = await requireUser();

    console.log("Session ID:", session.id);
    console.log("Friend User ID:", friendUserId);

    if (!session.id) {
      throw new Error("User session is invalid");
    }

    if (!friendUserId) {
      throw new Error("Friend user ID is required");
    }

    // Verify they are friends
    const areFriends = await FriendService.areFriends(session.id, friendUserId);
    if (!areFriends) {
      console.log("Users are not friends");
      return notFound();
    }

    // Get both users' profiles
    const [currentUserProfile, friendProfile] = await Promise.all([
      prisma.userGameProfile.findUnique({
        where: { userId: session.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          userBadges: {
            include: {
              badge: true,
            },
          },
        },
      }),
      prisma.userGameProfile.findUnique({
        where: { userId: friendUserId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          userBadges: {
            include: {
              badge: true,
            },
          },
        },
      }),
    ]);

    console.log("Current user profile found:", !!currentUserProfile);
    console.log("Friend profile found:", !!friendProfile);

    if (!friendProfile) {
      console.log("Friend profile not found");
      return notFound();
    }

    // Rest of your code stays the same...
    // Get recent XP transactions for both users
    const [currentUserTransactions, friendTransactions] = await Promise.all([
      prisma.xPTransaction.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.xPTransaction.findMany({
        where: { userId: friendUserId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    // Get friend activity feed
    const friendActivities = await FriendService.getFriendActivityFeed(
      session.id,
      20
    );

    // Get shared courses (courses both are enrolled in)
    const [currentUserEnrollments, friendEnrollments] = await Promise.all([
      prisma.enrollment.findMany({
        where: {
          userId: session.id,
          status: "Active",
        },
        include: {
          Course: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),
      prisma.enrollment.findMany({
        where: {
          userId: friendUserId,
          status: "Active",
        },
        include: {
          Course: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),
    ]);

    const currentUserCourseIds = new Set(
      currentUserEnrollments.map((e) => e.Course.id)
    );
    const sharedCourses = friendEnrollments
      .filter((e) => currentUserCourseIds.has(e.Course.id))
      .map((e) => e.Course);

    // Get progress in shared courses
    const sharedCoursesProgress = await Promise.all(
      sharedCourses.map(async (course) => {
        // Get total lessons in course
        const totalLessons = await prisma.lesson.count({
          where: {
            Chapter: {
              courseId: course.id,
            },
          },
        });

        // Get completed lessons for both users
        const [currentUserCompleted, friendCompleted] = await Promise.all([
          prisma.lessonProgress.count({
            where: {
              userId: session.id,
              completed: true,
              Lesson: {
                Chapter: {
                  courseId: course.id,
                },
              },
            },
          }),
          prisma.lessonProgress.count({
            where: {
              userId: friendUserId,
              completed: true,
              Lesson: {
                Chapter: {
                  courseId: course.id,
                },
              },
            },
          }),
        ]);

        return {
          course,
          totalLessons,
          currentUserCompleted,
          friendCompleted,
          currentUserProgress:
            totalLessons > 0 ? (currentUserCompleted / totalLessons) * 100 : 0,
          friendProgress:
            totalLessons > 0 ? (friendCompleted / totalLessons) * 100 : 0,
        };
      })
    );

    // Calculate who's ahead in various metrics
    const comparisons = {
      totalXP: {
        current: currentUserProfile?.totalXP || 0,
        friend: friendProfile.totalXP,
        leader:
          (currentUserProfile?.totalXP || 0) > friendProfile.totalXP
            ? "current"
            : "friend",
        difference: Math.abs(
          (currentUserProfile?.totalXP || 0) - friendProfile.totalXP
        ),
      },
      level: {
        current: currentUserProfile?.currentLevel || 1,
        friend: friendProfile.currentLevel,
        leader:
          (currentUserProfile?.currentLevel || 1) > friendProfile.currentLevel
            ? "current"
            : "friend",
        difference: Math.abs(
          (currentUserProfile?.currentLevel || 1) - friendProfile.currentLevel
        ),
      },
      streak: {
        current: currentUserProfile?.currentStreak || 0,
        friend: friendProfile.currentStreak,
        leader:
          (currentUserProfile?.currentStreak || 0) > friendProfile.currentStreak
            ? "current"
            : "friend",
        difference: Math.abs(
          (currentUserProfile?.currentStreak || 0) - friendProfile.currentStreak
        ),
      },
      courses: {
        current: currentUserProfile?.totalCoursesCompleted || 0,
        friend: friendProfile.totalCoursesCompleted,
        leader:
          (currentUserProfile?.totalCoursesCompleted || 0) >
          friendProfile.totalCoursesCompleted
            ? "current"
            : "friend",
        difference: Math.abs(
          (currentUserProfile?.totalCoursesCompleted || 0) -
            friendProfile.totalCoursesCompleted
        ),
      },
      lessons: {
        current: currentUserProfile?.totalLessonsCompleted || 0,
        friend: friendProfile.totalLessonsCompleted,
        leader:
          (currentUserProfile?.totalLessonsCompleted || 0) >
          friendProfile.totalLessonsCompleted
            ? "current"
            : "friend",
        difference: Math.abs(
          (currentUserProfile?.totalLessonsCompleted || 0) -
            friendProfile.totalLessonsCompleted
        ),
      },
      badges: {
        current: currentUserProfile?.userBadges.length || 0,
        friend: friendProfile.userBadges.length,
        leader:
          (currentUserProfile?.userBadges.length || 0) >
          friendProfile.userBadges.length
            ? "current"
            : "friend",
        difference: Math.abs(
          (currentUserProfile?.userBadges.length || 0) -
            friendProfile.userBadges.length
        ),
      },
    };

    // Get badges comparison
    const currentUserBadgeIds = new Set(
      currentUserProfile?.userBadges.map((ub) => ub.badgeId) || []
    );
    const friendBadgeIds = new Set(
      friendProfile.userBadges.map((ub) => ub.badgeId)
    );

    const sharedBadges = friendProfile.userBadges.filter((ub) =>
      currentUserBadgeIds.has(ub.badgeId)
    );
    const friendExclusiveBadges = friendProfile.userBadges.filter(
      (ub) => !currentUserBadgeIds.has(ub.badgeId)
    );
    const currentUserExclusiveBadges =
      currentUserProfile?.userBadges.filter(
        (ub) => !friendBadgeIds.has(ub.badgeId)
      ) || [];

    return {
      currentUser: {
        ...currentUserProfile,
        recentTransactions: currentUserTransactions,
      },
      friend: {
        ...friendProfile,
        recentTransactions: friendTransactions,
      },
      comparisons,
      sharedCourses: sharedCoursesProgress,
      badges: {
        shared: sharedBadges,
        friendExclusive: friendExclusiveBadges,
        currentUserExclusive: currentUserExclusiveBadges,
      },
      activities: friendActivities,
    };
  } catch (error) {
    console.error("Error in getFriendComparison:", error);
    throw error;
  }
}

export type FriendComparison = Awaited<ReturnType<typeof getFriendComparison>>;