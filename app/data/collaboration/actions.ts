"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "../user/require-user";
import { CollabService } from "./collab-service";

export async function createCollabGroup(input: {
  name: string;
  description?: string;
}) {
  const session = await requireUser();

  const group = await CollabService.createGroup(session.id, {
    name: input.name,
    description: input.description,
  });

  revalidatePath("/dashboard/friends");
  revalidatePath("/dashboard/friends/collab");

  return group;
}

export async function addCollabGroupMember(input: {
  groupId: string;
  userId: string;
  role?: "OWNER" | "ADMIN" | "MEMBER";
}) {
  const session = await requireUser();

  const member = await CollabService.addMember(session.id, input);

  revalidatePath(`/dashboard/friends/collab/${input.groupId}`);
  revalidatePath("/dashboard/friends/collab");

  return member;
}

export async function removeCollabGroupMember(input: {
  groupId: string;
  memberId: string;
}) {
  const session = await requireUser();

  const result = await CollabService.removeMember(session.id, input.groupId, input.memberId);

  revalidatePath(`/dashboard/friends/collab/${input.groupId}`);
  revalidatePath("/dashboard/friends/collab");

  return result;
}

export async function createCollabGoal(input: {
  groupId: string;
  title: string;
  description?: string;
  type: "XP" | "LESSONS_COMPLETED" | "COURSES_COMPLETED" | "STREAK" | "CUSTOM";
  targetValue: number;
  dueDate?: Date | string | null;
}) {
  const session = await requireUser();

  const goal = await CollabService.createGoal(session.id, {
    groupId: input.groupId,
    title: input.title,
    description: input.description,
    type: input.type,
    targetValue: input.targetValue,
    dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
  });

  revalidatePath(`/dashboard/friends/collab/${input.groupId}`);
  revalidatePath("/dashboard/friends/collab");

  return goal;
}

export async function recordCollabGoalProgress(input: {
  goalId: string;
  amount: number;
  note?: string;
}) {
  const session = await requireUser();

  const result = await CollabService.recordGoalProgress(session.id, {
    goalId: input.goalId,
    userId: session.id,
    amount: input.amount,
    note: input.note,
  });

  if (result.goal) {
    revalidatePath(`/dashboard/friends/collab/${result.goal.groupId}`);
  }
  revalidatePath("/dashboard/friends/collab");

  return result;
}

export async function createCollabSession(input: {
  groupId: string;
  title: string;
  description?: string;
  scheduledAt: Date | string;
  durationMinutes?: number;
  meetingLink?: string;
  attendeeIds?: string[];
}) {
  const session = await requireUser();

  const sessionRecord = await CollabService.createSession(session.id, {
    groupId: input.groupId,
    title: input.title,
    description: input.description,
    scheduledAt: new Date(input.scheduledAt),
    durationMinutes: input.durationMinutes,
    meetingLink: input.meetingLink,
    attendeeIds: input.attendeeIds,
  });

  revalidatePath(`/dashboard/friends/collab/${input.groupId}`);
  revalidatePath("/dashboard/friends/collab");

  return sessionRecord;
}

export async function respondToCollabSession(input: {
  sessionId: string;
  response: "PENDING" | "ACCEPTED" | "DECLINED";
}) {
  const session = await requireUser();
  const responseRecord = await CollabService.respondToSession(
    session.id,
    input.sessionId,
    input.response
  );

  if (responseRecord.session) {
    revalidatePath(`/dashboard/friends/collab/${responseRecord.session.groupId}`);
  }
  revalidatePath("/dashboard/friends/collab");

  return responseRecord;
}
