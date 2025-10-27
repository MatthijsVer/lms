"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  Flame,
  BookOpen,
  TrendingUp,
  Calendar,
  Sparkles,
  Target,
} from "lucide-react";
import { LeaderboardsData } from "@/app/data/gamification/get-leaderboards";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface LeaderboardsClientProps {
  leaderboards: LeaderboardsData;
}

export function LeaderboardsClient({ leaderboards }: LeaderboardsClientProps) {
  const [activeTab, setActiveTab] = useState("allTime");

  const renderPodium = (
    first: any,
    second: any,
    third: any,
    userEntry: any,
    scoreLabel: string
  ) => {
    if (!first && !second && !third) return null;

    return (
      <div className="relative px-8 pt-8 mb-0">
        {/* Podium Steps */}
        <div className="flex items-end justify-center gap-6">
          {/* Second Place - Left */}
          {second && (
            <div className="flex flex-col items-center gap-3 w-32">
              <Avatar className="h-16 w-16 bg-foreground ring-2 ring-border">
                <AvatarImage
                  src={second.userImage || undefined}
                  alt={second.userName}
                />
                <AvatarFallback className="text-lg font-semibold">
                  {second.userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center space-y-1 w-full">
                <p className="font-semibold text-sm truncate px-1">
                  {second.userName}
                </p>
                <p className="text-xl font-bold">
                  {second.score.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{scoreLabel}</p>
                {second.userId === userEntry?.userId && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    You
                  </Badge>
                )}
              </div>
              {/* Podium Base - 2nd */}
              <div className="w-full h-20 bg-muted rounded-t-lg flex items-start justify-center pt-2">
                <span className="text-2xl font-bold text-muted-foreground">
                  2
                </span>
              </div>
            </div>
          )}

          {/* First Place - Center (Taller) */}
          {first && (
            <div className="flex flex-col items-center gap-3 w-32 -mt-4">
              <div className="relative">
                <Avatar className="h-20 w-20 ring-2 bg-foreground ring-foreground">
                  <AvatarImage
                    src={first.userImage || undefined}
                    alt={first.userName}
                  />
                  <AvatarFallback className="text-xl font-bold">
                    {first.userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -right-2 bg-foreground text-background rounded-full p-1.5">
                  <Trophy className="h-4 w-4" />
                </div>
              </div>
              <div className="text-center space-y-1 w-full">
                <p className="font-bold text-base truncate px-1">
                  {first.userName}
                </p>
                <p className="text-2xl font-bold">
                  {first.score.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{scoreLabel}</p>
                {first.userId === userEntry?.userId && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    You
                  </Badge>
                )}
              </div>
              {/* Podium Base - 1st (Tallest) */}
              <div className="w-full h-28 bg-muted rounded-t-lg flex items-start justify-center pt-2">
                <span className="text-3xl font-bold text-foreground">1</span>
              </div>
            </div>
          )}

          {/* Third Place - Right */}
          {third && (
            <div className="flex flex-col items-center gap-3 w-32">
              <Avatar className="h-16 bg-foreground w-16 ring-2 ring-border">
                <AvatarImage
                  src={third.userImage || undefined}
                  alt={third.userName}
                />
                <AvatarFallback className="text-lg font-semibold">
                  {third.userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center space-y-1 w-full">
                <p className="font-semibold text-sm truncate px-1">
                  {third.userName}
                </p>
                <p className="text-xl font-bold">
                  {third.score.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{scoreLabel}</p>
                {third.userId === userEntry?.userId && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    You
                  </Badge>
                )}
              </div>
              {/* Podium Base - 3rd */}
              <div className="w-full h-16 bg-muted rounded-t-lg flex items-start justify-center pt-2">
                <span className="text-2xl font-bold text-muted-foreground">
                  3
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLeaderboardList = (
    entries: any[],
    userEntry: any,
    scoreLabel: string
  ) => {
    const [first, second, third, ...rest] = entries;
    const top3 = [first, second, third].filter(Boolean);
    const restEntries = rest.slice(0, 7);
    const isUserInTop10 = [...top3, ...restEntries].some(
      (e) => e?.userId === userEntry?.userId
    );

    return (
      <div className="space-y-4">
        {/* Podium */}
        {renderPodium(first, second, third, userEntry, scoreLabel)}

        {/* Rest of entries (4-10) */}
        {restEntries.length > 0 && (
          <div className="space-y-2">
            {restEntries.map((entry, index) => {
              const isCurrentUser = entry.userId === userEntry?.userId;
              const rank = index + 4;

              return (
                <div
                  key={entry.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    isCurrentUser
                      ? "bg-muted/50 border-border"
                      : "bg-muted/30 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium text-muted-foreground">
                    {rank}
                  </div>

                  <Avatar className="h-9 w-9 bg-foreground">
                    <AvatarImage
                      src={entry.userImage || undefined}
                      alt={entry.userName}
                    />
                    <AvatarFallback className="text-xs">
                      {entry.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {entry.userName}
                    </p>
                  </div>

                  {isCurrentUser && (
                    <Badge variant="secondary" className="text-xs">
                      You
                    </Badge>
                  )}

                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      {entry.score.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {scoreLabel}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* User's position if not in top 10 */}
        {userEntry && !isUserInTop10 && (
          <div className="pt-4 border-t mt-4">
            <p className="text-xs text-muted-foreground mb-3">Your Position</p>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                {userEntry.rank}
              </div>

              <Avatar className="h-9 w-9 bg-foreground">
                <AvatarImage
                  src={userEntry.userImage || undefined}
                  alt={userEntry.userName}
                />
                <AvatarFallback className="text-xs">
                  {userEntry.userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <p className="text-sm font-medium">{userEntry.userName}</p>
              </div>

              <div className="text-right">
                <p className="font-semibold text-sm">
                  {userEntry.score.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{scoreLabel}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const leaderboardSections = [
    {
      key: "allTime",
      title: "All-Time",
      icon: <Sparkles className="h-4 w-4" />,
      scoreLabel: "XP",
      data: leaderboards.allTime,
    },
    {
      key: "weekly",
      title: "This Week",
      icon: <Calendar className="h-4 w-4" />,
      scoreLabel: "XP",
      data: leaderboards.weekly,
    },
    {
      key: "monthly",
      title: "This Month",
      icon: <TrendingUp className="h-4 w-4" />,
      scoreLabel: "XP",
      data: leaderboards.monthly,
    },
    {
      key: "streak",
      title: "Streak",
      icon: <Flame className="h-4 w-4" />,
      scoreLabel: "days",
      data: leaderboards.streak,
    },
    {
      key: "courses",
      title: "Courses",
      icon: <BookOpen className="h-4 w-4" />,
      scoreLabel: "completed",
      data: leaderboards.courses,
    },
  ];

  const activeSection = leaderboardSections.find((s) => s.key === activeTab);

  // Get current user's data from all leaderboards
  const getUserRankingData = () => {
    return {
      allTime: leaderboards.allTime?.userEntry,
      weekly: leaderboards.weekly?.userEntry,
      monthly: leaderboards.monthly?.userEntry,
      streak: leaderboards.streak?.userEntry,
      courses: leaderboards.courses?.userEntry,
    };
  };

  const userRankings = getUserRankingData();

  return (
    <div className="space-y-6 p-6">
      {/* Hero Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left: Leaderboard Tabs Card (2/3 width) */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Leaderboards
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tab Buttons */}
            <div className="flex flex-wrap gap-2">
              {leaderboardSections.map((section) => (
                <button
                  key={section.key}
                  onClick={() => setActiveTab(section.key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    activeTab === section.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  )}
                >
                  {section.icon}
                  {section.title}
                </button>
              ))}
            </div>

            {/* Active Leaderboard Content */}
            {activeSection?.data?.entries &&
            activeSection.data.entries.length > 0 ? (
              renderLeaderboardList(
                activeSection.data.entries,
                activeSection.data.userEntry,
                activeSection.scoreLabel
              )
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No data available yet</p>
                <p className="text-xs mt-2">
                  Start learning to appear on the leaderboard!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: User Stats Card (1/3 width) */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Your Rankings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User Profile */}
            {userRankings.allTime ? (
              <>
                <div className="flex items-center gap-3 pb-4 border-b">
                  <div className="relative">
                    <Avatar className="h-16 w-16 bg-foreground ring-2 ring-primary/20">
                      <AvatarImage
                        src={userRankings.allTime.userImage || undefined}
                        alt={userRankings.allTime.userName}
                      />
                      <AvatarFallback className="text-lg font-bold">
                        {userRankings.allTime.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                      <Trophy className="h-3 w-3" />
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-lg">
                      {userRankings.allTime.userName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {userRankings.allTime.score.toLocaleString()} Total XP
                    </p>
                  </div>
                </div>

                {/* Rankings List */}
                <div className="space-y-3">
                  {/* All-Time */}
                  {userRankings.allTime && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-background">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">All-Time</p>
                          <p className="text-xs text-muted-foreground">
                            {userRankings.allTime.score.toLocaleString()} XP
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        #{userRankings.allTime.rank}
                      </Badge>
                    </div>
                  )}

                  {/* Weekly */}
                  {userRankings.weekly && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-background">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">This Week</p>
                          <p className="text-xs text-muted-foreground">
                            {userRankings.weekly.score.toLocaleString()} XP
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        #{userRankings.weekly.rank}
                      </Badge>
                    </div>
                  )}

                  {/* Monthly */}
                  {userRankings.monthly && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-background">
                          <TrendingUp className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">This Month</p>
                          <p className="text-xs text-muted-foreground">
                            {userRankings.monthly.score.toLocaleString()} XP
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        #{userRankings.monthly.rank}
                      </Badge>
                    </div>
                  )}

                  {/* Streak */}
                  {userRankings.streak && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-background">
                          <Flame className="h-4 w-4 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Streak</p>
                          <p className="text-xs text-muted-foreground">
                            {userRankings.streak.score.toLocaleString()} days
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        #{userRankings.streak.rank}
                      </Badge>
                    </div>
                  )}

                  {/* Courses */}
                  {userRankings.courses && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-background">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Courses</p>
                          <p className="text-xs text-muted-foreground">
                            {userRankings.courses.score.toLocaleString()}{" "}
                            completed
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        #{userRankings.courses.rank}
                      </Badge>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No rankings yet</p>
                <p className="text-xs mt-1">Start learning to get ranked!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
