import "server-only";

import slugify from "slugify";
import { prisma } from "@/lib/db";

type CreateGroupInput = {
  name: string;
  description?: string | null;
};

type AddMemberInput = {
  groupId: string;
  userId: string;
  role?: "OWNER" | "ADMIN" | "MEMBER";
};

type CreateGoalInput = {
  groupId: string;
  title: string;
  description?: string | null;
  type: "XP" | "LESSONS_COMPLETED" | "COURSES_COMPLETED" | "STREAK" | "CUSTOM";
  targetValue: number;
  dueDate?: Date | null;
};

type GoalProgressInput = {
  goalId: string;
  userId: string;
  amount: number;
  note?: string | null;
};

type CreateSessionInput = {
  groupId: string;
  title: string;
  description?: string | null;
  scheduledAt: Date;
  durationMinutes?: number | null;
  meetingLink?: string | null;
  attendeeIds?: string[];
};

const SLUG_SUFFIX_LENGTH = 6;

function generateGroupSlug(name: string) {
  const base = slugify(name, {
    lower: true,
    strict: true,
    trim: true,
  });
  const suffix = Math.random()
    .toString(36)
    .slice(2, 2 + SLUG_SUFFIX_LENGTH);

  return `${base}-${suffix}`;
}

export class CollabService {
  static async createGroup(ownerId: string, input: CreateGroupInput) {
    const slug = generateGroupSlug(input.name);

    return prisma.collabGroup.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        slug,
        ownerId,
        members: {
          create: {
            userId: ownerId,
            role: "OWNER",
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  static async getGroupsForUser(userId: string) {
    return prisma.collabGroup.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      include: {
        owner: true,
        members: {
          include: {
            user: true,
          },
        },
        goals: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
        sessions: {
          where: {
            scheduledAt: {
              gte: new Date(),
            },
            status: "SCHEDULED",
          },
          orderBy: { scheduledAt: "asc" },
          take: 2,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getGroupDetail(groupId: string, userId: string) {
    const group = await prisma.collabGroup.findUnique({
      where: { id: groupId },
      include: {
        owner: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                gameProfile: {
                  select: {
                    currentLevel: true,
                    totalXP: true,
                    currentStreak: true,
                    totalLessonsCompleted: true,
                    totalCoursesCompleted: true,
                  },
                },
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        goals: {
          include: {
            updates: {
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
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
          orderBy: { createdAt: "desc" },
        },
        sessions: {
          include: {
            attendees: {
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
            },
          },
          orderBy: { scheduledAt: "asc" },
        },
      },
    });

    if (!group) {
      return null;
    }

    const isMember = group.members.some((member) => member.userId === userId);
    const isOwner = group.ownerId === userId;

    if (!isMember && !isOwner) {
      return null;
    }

    return group;
  }

  static async addMember(requesterId: string, input: AddMemberInput) {
    const group = await prisma.collabGroup.findUnique({
      where: { id: input.groupId },
      include: {
        members: true,
      },
    });

    if (!group) {
      throw new Error("Group not found");
    }

    const requesterMembership = group.members.find(
      (member) => member.userId === requesterId
    );

    const isOwner = group.ownerId === requesterId;
    const isAdmin = requesterMembership?.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      throw new Error("You do not have permission to add members");
    }

    return prisma.collabGroupMember.upsert({
      where: {
        groupId_userId: {
          groupId: input.groupId,
          userId: input.userId,
        },
      },
      update: {
        role: input.role ?? "MEMBER",
      },
      create: {
        groupId: input.groupId,
        userId: input.userId,
        role: input.role ?? "MEMBER",
      },
      include: {
        user: true,
      },
    });
  }

  static async removeMember(requesterId: string, groupId: string, memberId: string) {
    const group = await prisma.collabGroup.findUnique({
      where: { id: groupId },
      include: {
        members: true,
      },
    });

    if (!group) {
      throw new Error("Group not found");
    }

    const requesterMembership = group.members.find(
      (member) => member.userId === requesterId
    );

    const isOwner = group.ownerId === requesterId;
    const isAdmin = requesterMembership?.role === "ADMIN";

    if (!isOwner && !isAdmin && requesterId !== memberId) {
      throw new Error("You do not have permission to remove this member");
    }

    if (group.ownerId === memberId) {
      throw new Error("Cannot remove the group owner");
    }

    return prisma.collabGroupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId: memberId,
        },
      },
    });
  }

  static async createGoal(userId: string, input: CreateGoalInput) {
    await this.assertMembership(userId, input.groupId);

    return prisma.collabGoal.create({
      data: {
        groupId: input.groupId,
        title: input.title,
        description: input.description ?? null,
        type: input.type,
        targetValue: input.targetValue,
        createdById: userId,
        dueDate: input.dueDate ?? null,
      },
    });
  }

  static async recordGoalProgress(userId: string, input: GoalProgressInput) {
    const goal = await prisma.collabGoal.findUnique({
      where: { id: input.goalId },
      include: {
        group: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!goal) {
      throw new Error("Goal not found");
    }

    await this.assertMembership(userId, goal.groupId);

    const newProgressValue = Math.max(0, goal.progressValue + input.amount);
    const cappedProgress = Math.min(newProgressValue, goal.targetValue);

    return prisma.$transaction(async (tx) => {
      const update = await tx.collabGoalUpdate.create({
        data: {
          goalId: goal.id,
          userId,
          amount: input.amount,
          note: input.note ?? null,
        },
      });

      const updatedGoal = await tx.collabGoal.update({
        where: { id: goal.id },
        data: {
          progressValue: cappedProgress,
        },
        select: {
          id: true,
          groupId: true,
          progressValue: true,
          targetValue: true,
        },
      });

      return {
        update,
        goal: updatedGoal,
      };
    });
  }

  static async createSession(userId: string, input: CreateSessionInput) {
    await this.assertMembership(userId, input.groupId);

    return prisma.collabSession.create({
      data: {
        groupId: input.groupId,
        creatorId: userId,
        title: input.title,
        description: input.description ?? null,
        scheduledAt: input.scheduledAt,
        durationMinutes: input.durationMinutes ?? null,
        meetingLink: input.meetingLink ?? null,
        attendees: input.attendeeIds?.length
          ? {
              create: input.attendeeIds.map((memberId) => ({
                userId: memberId,
                response: memberId === userId ? "ACCEPTED" : "PENDING",
                respondedAt: memberId === userId ? new Date() : null,
              })),
            }
          : undefined,
      },
      include: {
        attendees: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  static async respondToSession(
    userId: string,
    sessionId: string,
    response: "PENDING" | "ACCEPTED" | "DECLINED"
  ) {
    const session = await prisma.collabSession.findUnique({
      where: { id: sessionId },
      include: {
        group: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    await this.assertMembership(userId, session.groupId);

    return prisma.collabSessionAttendee.upsert({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
      update: {
        response,
        respondedAt: response === "PENDING" ? null : new Date(),
      },
      create: {
        sessionId,
        userId,
        response,
        respondedAt: response === "PENDING" ? null : new Date(),
      },
      include: {
        session: {
          select: {
            id: true,
            groupId: true,
          },
        },
      },
    });
  }

  static async getUpcomingSessions(userId: string) {
    return prisma.collabSession.findMany({
      where: {
        group: {
          members: {
            some: {
              userId,
            },
          },
        },
        scheduledAt: {
          gte: new Date(),
        },
        status: "SCHEDULED",
      },
      include: {
        group: true,
        attendees: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    });
  }

  private static async assertMembership(userId: string, groupId: string) {
    const membership = await prisma.collabGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (membership) {
      return;
    }

    const ownsGroup = await prisma.collabGroup.count({
      where: {
        id: groupId,
        ownerId: userId,
      },
    });

    if (!ownsGroup) {
      throw new Error("You are not a member of this group");
    }
  }
}
