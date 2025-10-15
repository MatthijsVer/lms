import { getLeaderboards } from "@/app/data/gamification/get-leaderboards";
import { LeaderboardsClient } from "../_components/leaderboards-client";

export default async function LeaderboardsPage() {
  const leaderboards = await getLeaderboards();

  return <LeaderboardsClient leaderboards={leaderboards} />;
}
