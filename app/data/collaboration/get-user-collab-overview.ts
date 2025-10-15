import "server-only";

import { requireUser } from "../user/require-user";
import { CollabService } from "./collab-service";

export async function getUserCollabOverview() {
  const session = await requireUser();

  const [groups, sessions] = await Promise.all([
    CollabService.getGroupsForUser(session.id),
    CollabService.getUpcomingSessions(session.id),
  ]);

  return {
    groups,
    upcomingSessions: sessions,
  };
}

export type UserCollabOverview = Awaited<ReturnType<typeof getUserCollabOverview>>;
