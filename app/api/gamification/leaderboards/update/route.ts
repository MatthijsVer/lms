import { NextResponse } from "next/server";
import { LeaderboardService } from "@/app/data/gamification/leaderboard-service";

export async function POST() {
  try {
    const results = await LeaderboardService.updateAllLeaderboards();
    
    return NextResponse.json({
      success: true,
      message: "Leaderboards updated successfully",
      results,
    });
  } catch (error) {
    console.error("Failed to update leaderboards:", error);
    return NextResponse.json(
      { error: "Failed to update leaderboards" },
      { status: 500 }
    );
  }
}
