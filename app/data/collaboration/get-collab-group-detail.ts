import "server-only";

import { requireUser } from "../user/require-user";
import { CollabService } from "./collab-service";

export async function getCollabGroupDetail(groupId: string) {
  const session = await requireUser();

  const group = await CollabService.getGroupDetail(groupId, session.id);

  if (!group) {
    return null;
  }

  const membership = group.members.find((member) => member.userId === session.id);
  const currentUserRole = group.ownerId === session.id ? "OWNER" : membership?.role ?? "MEMBER";

  return {
    group,
    currentUserId: session.id,
    currentUserRole,
  };
}

export type CollabGroupDetail = Awaited<ReturnType<typeof getCollabGroupDetail>>;
