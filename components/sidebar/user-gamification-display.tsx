"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

interface UserProfile {
  totalXP: number;
  currentLevel: number;
  xpToNextLevel: number;
  currentLevelXP: number;
  currentStreak: number;
  totalLessonsCompleted: number;
  totalCoursesCompleted: number;
}

export function UserGamificationDisplay() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/gamification/profile");
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error("Failed to fetch gamification profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Custom event listener for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchProfile();
    };

    window.addEventListener("gamification-profile-update", handleProfileUpdate);
    return () => {
      window.removeEventListener(
        "gamification-profile-update",
        handleProfileUpdate
      );
    };
  }, []);

  if (isLoading) {
    return (
      <div className="mx-2 mb-2 p-3 space-y-2 border rounded-lg">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-2 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  // Calculate progress percentage to next level
  const xpNeededForNextLevel = profile.xpToNextLevel + profile.currentLevelXP;
  const progressPercentage = Math.round(
    (profile.currentLevelXP / xpNeededForNextLevel) * 100
  );

  return (
    <Card className="mx-2 mb-2 p-3 bg-input/20 border-0 to-background">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold">
                Level {profile.currentLevel}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {profile.totalXP.toLocaleString()} XP
              </p>
            </div>
          </div>

          {profile.currentStreak > 0 && (
            <Badge variant="outline" className="gap-1 h-6 px-2">
              <Flame className="h-3 w-3 text-orange-500" />
              <span className="text-xs font-bold">{profile.currentStreak}</span>
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Next level</span>
            <span className="font-medium text-primary">
              {profile.xpToNextLevel} XP to go
            </span>
          </div>
          <Progress value={progressPercentage} className="h-1.5" />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {profile.totalLessonsCompleted} lessons
            </span>
          </div>
          {profile.totalCoursesCompleted > 0 && (
            <div className="text-[10px] text-muted-foreground">
              • {profile.totalCoursesCompleted} courses
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
