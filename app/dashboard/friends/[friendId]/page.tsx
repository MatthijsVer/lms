import { getFriendComparison } from "@/app/data/friends/get-friend-comparison";
import { FriendComparisonClient } from "../_components/friend-comparison-client";

interface FriendComparisonPageProps {
  params: Promise<{
    friendId: string;
  }>;
}

export default async function FriendComparisonPage({
  params,
}: FriendComparisonPageProps) {
  const { friendId } = await params;
  const comparison = await getFriendComparison(friendId);

  return <FriendComparisonClient comparison={comparison} />;
}
