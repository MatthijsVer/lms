import "server-only";
import { prisma } from "@/lib/db";

export class FriendService {
  /**
   * Send a friend request
   */
  static async sendFriendRequest(userId: string, friendEmail: string) {
    // Find friend by email
    const friend = await prisma.user.findUnique({
      where: { email: friendEmail },
      select: { id: true, name: true, email: true },
    });

    if (!friend) {
      return { success: false, message: "User not found" };
    }

    if (friend.id === userId) {
      return { success: false, message: "You cannot add yourself as a friend" };
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId: friend.id },
          { userId: friend.id, friendId: userId },
        ],
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === "ACCEPTED") {
        return { success: false, message: "You are already friends" };
      }
      if (existingFriendship.status === "PENDING") {
        return { success: false, message: "Friend request already sent" };
      }
      if (existingFriendship.status === "BLOCKED") {
        return { success: false, message: "Cannot send friend request" };
      }
    }

    // Create friend request
    await prisma.friendship.create({
      data: {
        userId,
        friendId: friend.id,
        status: "PENDING",
      },
    });

    return {
      success: true,
      message: `Friend request sent to ${friend.name || friend.email}`,
    };
  }

/**
 * Accept a friend request
 */
static async acceptFriendRequest(userId: string, friendshipId: string) {
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });
  
    if (!friendship) {
      console.error("Friendship not found:", friendshipId);
      return { success: false, message: "Friend request not found" };
    }
  
    console.log("Found friendship:", friendship);
    console.log("Current user ID:", userId);
  
    // Verify this request is for the current user (they are the recipient)
    if (friendship.friendId !== userId) {
      console.error("User mismatch - friendId:", friendship.friendId, "userId:", userId);
      return { success: false, message: "Unauthorized - This request is not for you" };
    }
  
    if (friendship.status !== "PENDING") {
      console.error("Status is not PENDING:", friendship.status);
      return { success: false, message: `Friend request already ${friendship.status.toLowerCase()}` };
    }
  
    // Update to accepted
    try {
      await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: "ACCEPTED" },
      });
  
      console.log("Successfully accepted friendship:", friendshipId);
      return { success: true, message: "Friend request accepted!" };
    } catch (error) {
      console.error("Error updating friendship:", error);
      return { success: false, message: "Failed to accept friend request" };
    }
  }

  /**
   * Decline/remove a friend request
   */
  static async declineFriendRequest(userId: string, friendshipId: string) {
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      return { success: false, message: "Friend request not found" };
    }

    // Verify this request involves the current user
    if (friendship.friendId !== userId && friendship.userId !== userId) {
      return { success: false, message: "Unauthorized" };
    }

    // Delete the friendship
    await prisma.friendship.delete({
      where: { id: friendshipId },
    });

    return { success: true, message: "Friend request declined" };
  }

  /**
   * Remove a friend (unfriend)
   */
  static async removeFriend(userId: string, friendshipId: string) {
    return this.declineFriendRequest(userId, friendshipId);
  }

  /**
   * Get user's friends (accepted friendships)
   */
  static async getFriends(userId: string) {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: "ACCEPTED" },
          { friendId: userId, status: "ACCEPTED" },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            gameProfile: {
              select: {
                totalXP: true,
                currentLevel: true,
                currentStreak: true,
                totalLessonsCompleted: true,
                totalCoursesCompleted: true,
                lastActivityDate: true,
              },
            },
          },
        },
        friend: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            gameProfile: {
              select: {
                totalXP: true,
                currentLevel: true,
                currentStreak: true,
                totalLessonsCompleted: true,
                totalCoursesCompleted: true,
                lastActivityDate: true,
              },
            },
          },
        },
      },
    });

    // Map to friend data (the other user in the friendship)
    return friendships.map((friendship) => {
      const friend =
        friendship.userId === userId ? friendship.friend : friendship.user;
      return {
        friendshipId: friendship.id,
        ...friend,
      };
    });
  }

  static async getPendingRequests(userId: string) {
    const requests = await prisma.friendship.findMany({
      where: {
        friendId: userId,
        status: "PENDING",
      },
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
      orderBy: {
        createdAt: "desc",
      },
    });
  
    // FIX: Return the friendship ID, not the user ID
    return requests.map((request) => ({
      friendshipId: request.id, // This is the friendship ID we need!
      userId: request.user.id,  // This is the requester's user ID
      name: request.user.name,
      email: request.user.email,
      image: request.user.image,
      createdAt: request.createdAt,
    }));
  }

/**
 * Get sent friend requests (waiting for acceptance)
 */
static async getSentRequests(userId: string) {
    const requests = await prisma.friendship.findMany({
      where: {
        userId,
        status: "PENDING",
      },
      include: {
        friend: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  
    return requests.map((request) => ({
      friendshipId: request.id, // Friendship ID
      userId: request.friend.id, // Friend's user ID
      name: request.friend.name,
      email: request.friend.email,
      image: request.friend.image,
      createdAt: request.createdAt,
    }));
  }

  /**
   * Get friend count
   */
  static async getFriendCount(userId: string) {
    return prisma.friendship.count({
      where: {
        OR: [
          { userId, status: "ACCEPTED" },
          { friendId: userId, status: "ACCEPTED" },
        ],
      },
    });
  }

  /**
   * Check if two users are friends
   */
  static async areFriends(userId: string, otherUserId: string) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId: otherUserId, status: "ACCEPTED" },
          { userId: otherUserId, friendId: userId, status: "ACCEPTED" },
        ],
      },
    });

    return !!friendship;
  }

  /**
   * Search users by email or name (for adding friends)
   */
  static async searchUsers(query: string, currentUserId: string) {
    if (!query || query.length < 2) {
      return [];
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          {
            OR: [
              { email: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        gameProfile: {
          select: {
            totalXP: true,
            currentLevel: true,
          },
        },
      },
      take: 10,
    });

    // Check friendship status for each user
    const userIds = users.map((u) => u.id);
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: currentUserId, friendId: { in: userIds } },
          { userId: { in: userIds }, friendId: currentUserId },
        ],
      },
    });

    const friendshipMap = new Map(
      friendships.map((f) => [
        f.userId === currentUserId ? f.friendId : f.userId,
        f.status,
      ])
    );

    return users.map((user) => ({
      ...user,
      friendshipStatus: friendshipMap.get(user.id) || null,
    }));
  }

  /**
   * Log friend activity (for activity feed)
   */
  static async logActivity(
    userId: string,
    activityType: string,
    description: string,
    metadata?: any
  ) {
    await prisma.friendActivity.create({
      data: {
        userId,
        activityType,
        description,
        metadata,
      },
    });
  }

  /**
   * Get friend activity feed
   */
  static async getFriendActivityFeed(userId: string, limit: number = 20) {
    // Get user's friends
    const friends = await this.getFriends(userId);
    const friendIds = friends.map((f) => f.id);

    // Get recent activities from friends
    const activities = await prisma.friendActivity.findMany({
      where: {
        userId: { in: friendIds },
      },
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
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return activities;
  }
}