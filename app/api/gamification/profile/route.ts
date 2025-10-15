import { requireUser } from "@/app/data/user/require-user";
import { GamificationService } from "@/app/data/gamification/gamification-service";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await requireUser();
    
    const profile = await GamificationService.getUserProfile(session.id);
    
    const levelInfo = GamificationService.calculateLevelFromXP(profile.totalXP);
    
    return NextResponse.json({
      ...profile,
      currentLevelXP: levelInfo.currentLevelXP,
    });
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}