import "server-only";
import { requireUser } from "../user/require-user";
import { LeaderboardService } from "./leaderboard-service";

export async function getLeaderboards() {
  const session = await requireUser();

  // Get all active leaderboards with user's rank
  const leaderboards = await Promise.all([
    LeaderboardService.getLeaderboard("all-time-xp", session.id),
    LeaderboardService.getLeaderboard("weekly-xp", session.id),
    LeaderboardService.getLeaderboard("monthly-xp", session.id),
    LeaderboardService.getLeaderboard("streak-length", session.id),
    LeaderboardService.getLeaderboard("courses-completed", session.id),
  ]);

  return {
    allTime: leaderboards[0],
    weekly: leaderboards[1],
    monthly: leaderboards[2],
    streak: leaderboards[3],
    courses: leaderboards[4],
  };
}

export type LeaderboardsData = Awaited<ReturnType<typeof getLeaderboards>>;