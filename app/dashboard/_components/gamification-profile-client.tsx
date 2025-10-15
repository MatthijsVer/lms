"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Flame,
  TrendingUp,
  Award,
  Sparkles,
  Lock,
  Calendar,
  Target,
  Zap,
} from "lucide-react";
import { UserGamificationProfile } from "@/app/data/gamification/get-user-gamification-profile";
import { GamificationService } from "@/app/data/gamification/gamification-service";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface GamificationProfileClientProps {
  profile: UserGamificationProfile;
}

export function GamificationProfileClient({
  profile,
}: GamificationProfileClientProps) {
  const earnedBadgeIds = new Set(profile.earnedBadges.map((b) => b.id));
  const lockedBadges = profile.allBadges.filter(
    (b) => !earnedBadgeIds.has(b.id)
  );

  // Calculate progress percentage to next level
  const xpNeededForNextLevel = profile.xpToNextLevel + profile.currentLevelXP;
  const progressPercentage = Math.round(
    (profile.currentLevelXP / xpNeededForNextLevel) * 100
  );

  // Group transactions by date
  const transactionsByDate = profile.recentTransactions.reduce(
    (acc, transaction) => {
      const date = format(transaction.createdAt, "yyyy-MM-dd");
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(transaction);
      return acc;
    },
    {} as Record<string, typeof profile.recentTransactions>
  );

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Common":
        return "text-gray-600 border-gray-300 bg-gray-50";
      case "Uncommon":
        return "text-green-600 border-green-300 bg-green-50";
      case "Rare":
        return "text-blue-600 border-blue-300 bg-blue-50";
      case "Epic":
        return "text-purple-600 border-purple-300 bg-purple-50";
      case "Legendary":
        return "text-yellow-600 border-yellow-300 bg-yellow-50";
      default:
        return "text-gray-600 border-gray-300 bg-gray-50";
    }
  };

  const getXPReasonIcon = (reason: string) => {
    switch (reason) {
      case "LESSON_COMPLETED":
        return "📚";
      case "COURSE_COMPLETED":
        return "🎓";
      case "QUIZ_PASSED":
        return "✅";
      case "QUIZ_PERFECT_SCORE":
        return "💯";
      case "STREAK_MILESTONE":
        return "🔥";
      case "BADGE_EARNED":
        return "🏆";
      case "SPEED_BONUS":
        return "⚡";
      default:
        return "✨";
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Hero Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Level Card */}
        <Card className="md:col-span-2 bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Trophy className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">
                      Level {profile.currentLevel}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {profile.totalXP.toLocaleString()} Total XP
                    </p>
                  </div>
                </div>
              </div>

              {profile.currentStreak > 0 && (
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Flame className="h-6 w-6 text-orange-500" />
                    <span className="text-3xl font-bold">
                      {profile.currentStreak}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">day streak</p>
                  {profile.longestStreak > profile.currentStreak && (
                    <p className="text-xs text-muted-foreground">
                      Best: {profile.longestStreak} days
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Progress to Next Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Progress to Level {profile.currentLevel + 1}
                </span>
                <span className="font-medium">
                  {profile.currentLevelXP.toLocaleString()} /{" "}
                  {xpNeededForNextLevel.toLocaleString()} XP
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <p className="text-xs text-muted-foreground text-right">
                {profile.xpToNextLevel.toLocaleString()} XP to go
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Courses</span>
                <span className="text-2xl font-bold">
                  {profile.totalCoursesCompleted}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Lessons</span>
                <span className="text-2xl font-bold">
                  {profile.totalLessonsCompleted}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Quizzes</span>
                <span className="text-2xl font-bold">
                  {profile.totalQuizzesPassed}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Badges</span>
                <span className="text-2xl font-bold">
                  {profile.earnedBadges.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="badges" className="space-y-4">
        <TabsList>
          <TabsTrigger value="badges" className="gap-2">
            <Award className="h-4 w-4" />
            Badges
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Zap className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-6">
          {/* Earned Badges */}
          {profile.earnedBadges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Earned Badges ({profile.earnedBadges.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {profile.earnedBadges.map((badge: any) => (
                    <div
                      key={badge.id}
                      className={cn(
                        "relative p-4 rounded-lg border-2 transition-all cursor-pointer group"
                        // getRarityColor(badge.rarity)
                      )}
                    >
                      <div className="space-y-2">
                        <div className="relative w-full aspect-square">
                          <Image
                            src={`/${badge.imageKey}`}
                            alt={badge.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-sm text-center">
                            {badge.name}
                          </p>
                          <p className="text-xs text-muted-foreground text-center line-clamp-2">
                            {badge.description}
                          </p>
                          <div className="flex items-center justify-center gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {badge.rarity}
                            </Badge>
                            {badge.xpReward > 0 && (
                              <Badge
                                variant="outline"
                                className="text-xs gap-1"
                              >
                                <Sparkles className="h-3 w-3" />
                                {badge.xpReward}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground text-center">
                            Earned{" "}
                            {format(new Date(badge.earnedAt), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Locked Badges */}
          {lockedBadges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  Locked Badges ({lockedBadges.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {lockedBadges.map((badge: any) => (
                    <div
                      key={badge.id}
                      className="relative p-4 rounded-lg border-2 border-dashed bg-muted/30 opacity-60 hover:opacity-80 transition-opacity"
                    >
                      <div className="space-y-2">
                        <div className="relative w-full aspect-square grayscale">
                          <Image
                            src={`/${badge.imageKey}`}
                            alt={badge.name}
                            fill
                            className="object-contain max-w-[190px] mx-auto"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                            <Lock className="h-8 w-8 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-sm text-center">
                            {badge.name}
                          </p>
                          <p className="text-xs text-muted-foreground text-center line-clamp-2">
                            {badge.description}
                          </p>
                          <div className="flex items-center justify-center gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {badge.rarity}
                            </Badge>
                            {badge.xpReward > 0 && (
                              <Badge
                                variant="outline"
                                className="text-xs gap-1"
                              >
                                <Sparkles className="h-3 w-3" />
                                {badge.xpReward}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground text-center">
                            {badge.requirement.replace(/_/g, " ").toLowerCase()}{" "}
                            {badge.targetValue}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.recentTransactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No activity yet. Start learning to earn XP!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(transactionsByDate).map(
                    ([date, transactions]) => (
                      <div key={date} className="space-y-3">
                        <p className="text-sm font-semibold text-muted-foreground">
                          {format(new Date(date), "EEEE, MMMM d, yyyy")}
                        </p>
                        <div className="space-y-2">
                          {transactions.map((transaction) => (
                            <div
                              key={transaction.id}
                              className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">
                                  {getXPReasonIcon(transaction.reason)}
                                </span>
                                <div>
                                  <p className="text-sm font-medium">
                                    {transaction.description ||
                                      transaction.reason
                                        .replace(/_/g, " ")
                                        .toLowerCase()}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(transaction.createdAt, "h:mm a")}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant={
                                  transaction.amount > 0
                                    ? "default"
                                    : "destructive"
                                }
                                className="gap-1"
                              >
                                <Sparkles className="h-3 w-3" />
                                {transaction.amount > 0 ? "+" : ""}
                                {transaction.amount} XP
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
