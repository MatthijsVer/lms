import "server-only";
import { requireUser } from "../user/require-user";
import { FriendService } from "./friend-service";

export async function getFriendsData() {
  const session = await requireUser();

  const [friends, pendingRequests, sentRequests, friendCount] = await Promise.all([
    FriendService.getFriends(session.id),
    FriendService.getPendingRequests(session.id),
    FriendService.getSentRequests(session.id),
    FriendService.getFriendCount(session.id),
  ]);

  return {
    friends,
    pendingRequests,
    sentRequests,
    friendCount,
  };
}

export type FriendsData = Awaited<ReturnType<typeof getFriendsData>>;