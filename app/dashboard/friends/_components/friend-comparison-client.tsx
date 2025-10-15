"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Flame,
  BookOpen,
  Award,
  ArrowLeft,
  Crown,
  Target,
  Zap,
  Calendar,
} from "lucide-react";
import { FriendComparison } from "@/app/data/friends/get-friend-comparison";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

interface FriendComparisonClientProps {
  comparison: FriendComparison;
}

export function FriendComparisonClient({
  comparison,
}: FriendComparisonClientProps) {
  const {
    currentUser,
    friend,
    comparisons,
    sharedCourses,
    badges,
    activities,
  } = comparison;

  const getCurrentUserName = () =>
    currentUser?.user.name || currentUser?.user.email.split("@")[0] || "You";
  const getFriendName = () =>
    friend.user.name || friend.user.email.split("@")[0];

  return (
    <div
      className="min-h-screen bg-background"
      onClick={() => console.log(badges)}
    >
      {/* Back Button - Fixed */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="bg-background/80 backdrop-blur"
        >
          <Link href="/dashboard/friends">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      {/* Main VS Screen */}
      <div className="relative  border-b flex items-center justify-center overflow-hidden">
        {/* Split Background Effect */}
        <div className="absolute inset-0 grid grid-cols-2">
          <div className="bg-gradient-to-br from-primary/5 via-background to-background" />
          <div className="bg-gradient-to-bl from-muted/50 via-background to-background" />
        </div>

        {/* Diagonal Split Line */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-px h-full bg-border transform -skew-x-12" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-18">
          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-12 items-center">
            {/* LEFT - Current User */}
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <Avatar className="relative size-30 border border-primary shadow-2xl">
                  <AvatarImage
                    src={currentUser?.user.image || undefined}
                    alt={getCurrentUserName()}
                  />
                  <AvatarFallback className="text-5xl font-bold">
                    {getCurrentUserName().charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-black tracking-tight">
                  {getCurrentUserName()}
                </h2>
                <Badge className="text-sm px-4 py-1">
                  LEVEL {currentUser?.currentLevel || 1}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
                <div className="space-y-1 border p-4 rounded-xl">
                  <Trophy className="h-6 w-6 mx-auto text-yellow-500" />
                  <p className="text-3xl font-bold">
                    {(currentUser?.totalXP || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Total XP
                  </p>
                </div>
                <div className="space-y-1 border p-4 rounded-xl">
                  <Flame className="h-6 w-6 mx-auto text-orange-500" />
                  <p className="text-3xl font-bold">
                    {currentUser?.currentStreak || 0}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Day Streak
                  </p>
                </div>
              </div>
            </div>

            {/* CENTER - VS Badge */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="relative bg-muted border border-border rounded-2xl p-8 shadow-2xl">
                  <p className="text-2xl font-black tracking-widest text-foreground">
                    VS
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT - Friend */}
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-muted blur-3xl rounded-full" />
                <Avatar className="relative size-30 border-muted-foreground shadow-2xl">
                  <AvatarImage
                    src={friend.user.image || undefined}
                    alt={getFriendName()}
                  />
                  <AvatarFallback className="text-5xl font-bold">
                    {getFriendName().charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="space-y-4 ">
                <h2 className="text-3xl font-black tracking-tight">
                  {getFriendName()}
                </h2>
                <Badge variant="secondary" className="text-sm px-4 py-1">
                  LEVEL {friend.currentLevel}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
                <div className="space-y-1 border p-4 rounded-xl">
                  <Trophy className="h-6 w-6 mx-auto text-yellow-500" />
                  <p className="text-3xl font-bold">
                    {friend.totalXP.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Total XP
                  </p>
                </div>
                <div className="space-y-1 border p-4 rounded-xl">
                  <Flame className="h-6 w-6 mx-auto text-orange-500" />
                  <p className="text-3xl font-bold">{friend.currentStreak}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Day Streak
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Battle Section */}
      <div className="mx-auto space-y-8">
        {/* Battle Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4">
          {/* XP Battle */}
          <Card className="relative bg-muted rounded-none border-t-0 border-l-0 overflow-hidden">
            <div
              className={cn(
                "absolute inset-0 opacity-10",
                comparisons.totalXP.leader === "current"
                  ? "bg-primary"
                  : comparisons.totalXP.leader === "friend"
                    ? "bg-muted-foreground"
                    : "bg-muted"
              )}
            />
            <CardHeader className="relative pb-0 mb-0">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Experience Points
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="flex items-end justify-between gap-2">
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold">
                    {(currentUser?.totalXP || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">You</p>
                </div>
                <div className="text-muted-foreground font-bold pb-1">:</div>
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold">
                    {friend.totalXP.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Them</p>
                </div>
              </div>
              {comparisons.totalXP.leader !== "tie" && (
                <div className="flex items-center justify-center gap-1 text-xs">
                  <Crown className="h-3 w-3 text-yellow-500" />
                  <span className="font-medium">
                    {comparisons.totalXP.leader === "current"
                      ? "You lead"
                      : "They lead"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Streak Battle */}
          <Card className="relative bg-muted rounded-none border-t-0 border-l-0 overflow-hidden">
            <div
              className={cn(
                "absolute inset-0 opacity-10",
                comparisons.streak.leader === "current"
                  ? "bg-primary"
                  : comparisons.streak.leader === "friend"
                    ? "bg-muted-foreground"
                    : "bg-muted"
              )}
            />
            <CardHeader className="relative pb-0 mb-0">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Streak Days
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="flex items-end justify-between bg-border gap-2">
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold">
                    {currentUser?.currentStreak || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">You</p>
                </div>
                <div className="text-muted-foreground font-bold pb-1">:</div>
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold">{friend.currentStreak}</p>
                  <p className="text-xs text-muted-foreground mt-1">Them</p>
                </div>
              </div>
              {comparisons.streak.leader !== "tie" && (
                <div className="flex items-center justify-center gap-1 text-xs">
                  <Crown className="h-3 w-3 text-yellow-500" />
                  <span className="font-medium">
                    {comparisons.streak.leader === "current"
                      ? "You lead"
                      : "They lead"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Courses Battle */}
          <Card className="relative bg-muted rounded-none border-t-0 border-l-0 overflow-hidden">
            <div
              className={cn(
                "absolute inset-0 opacity-10",
                comparisons.courses.current > comparisons.courses.friend
                  ? "bg-primary"
                  : comparisons.courses.friend > comparisons.courses.current
                    ? "bg-muted-foreground"
                    : "bg-muted"
              )}
            />
            <CardHeader className="relative pb-0 mb-0">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Courses Done
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="flex items-end justify-between gap-2">
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold">
                    {comparisons.courses.current}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">You</p>
                </div>
                <div className="text-muted-foreground font-bold pb-1">:</div>
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold">
                    {comparisons.courses.friend}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Them</p>
                </div>
              </div>
              {comparisons.courses.current !== comparisons.courses.friend && (
                <div className="flex items-center justify-center gap-1 text-xs">
                  <Crown className="h-3 w-3 text-yellow-500" />
                  <span className="font-medium">
                    {comparisons.courses.current > comparisons.courses.friend
                      ? "You lead"
                      : "They lead"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lessons Battle */}
          <Card className="relative bg-muted rounded-none border-t-0 border-l-0 overflow-hidden">
            <div
              className={cn(
                "absolute inset-0 opacity-10",
                comparisons.lessons.current > comparisons.lessons.friend
                  ? "bg-primary"
                  : comparisons.lessons.friend > comparisons.lessons.current
                    ? "bg-muted-foreground"
                    : "bg-muted"
              )}
            />
            <CardHeader className="relative pb-0 mb-0">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Lessons Done
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="flex items-end justify-between gap-2">
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold">
                    {comparisons.lessons.current}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">You</p>
                </div>
                <div className="text-muted-foreground font-bold pb-1">:</div>
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold">
                    {comparisons.lessons.friend}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Them</p>
                </div>
              </div>
              {comparisons.lessons.current !== comparisons.lessons.friend && (
                <div className="flex items-center justify-center gap-1 text-xs">
                  <Crown className="h-3 w-3 text-yellow-500" />
                  <span className="font-medium">
                    {comparisons.lessons.current > comparisons.lessons.friend
                      ? "You lead"
                      : "They lead"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Course Progress Battles */}
        {sharedCourses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Battles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {sharedCourses.map((course) => (
                <div key={course.course.id} className="space-y-3">
                  <Link
                    href={`/dashboard/${course.course.slug}`}
                    className="font-semibold hover:underline block"
                  >
                    {course.course.title}
                  </Link>

                  <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
                    {/* Your progress from left */}
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-primary to-primary/80 transition-all"
                      style={{
                        width: `${course.currentUserProgress}%`,
                      }}
                    />
                    {/* Friend's progress from right */}
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-muted-foreground to-muted-foreground/80 transition-all"
                      style={{
                        width: `${course.friendProgress}%`,
                      }}
                    />

                    {/* Labels */}
                    <div className="absolute inset-0 flex items-center justify-between px-4 text-sm font-bold">
                      <span className="text-primary-foreground drop-shadow">
                        {Math.round(course.currentUserProgress)}%
                      </span>
                      <span className="text-background drop-shadow">
                        {Math.round(course.friendProgress)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      You: {course.currentUserCompleted}/{course.totalLessons}
                    </span>
                    <span>
                      {getFriendName()}: {course.friendCompleted}/
                      {course.totalLessons}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Badge Collections */}
        {(badges.shared.length > 0 ||
          badges.currentUserExclusive.length > 0 ||
          badges.friendExclusive.length > 0) && (
          <div className="grid md:grid-cols-3 gap-4">
            {badges.currentUserExclusive.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Your Arsenal</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {badges.currentUserExclusive.length} unique
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2">
                    {badges.currentUserExclusive
                      .slice(0, 8)
                      .map((userBadge) => (
                        <div
                          key={userBadge.id}
                          className="aspect-square relative"
                        >
                          <Image
                            src={`/${userBadge.badge.imageKey}`}
                            alt={userBadge.badge.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {badges.shared.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Mutual Badges</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {badges.shared.length} shared
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2">
                    {badges.shared.slice(0, 8).map((userBadge) => (
                      <div
                        key={userBadge.id}
                        className="aspect-square relative"
                      >
                        <Image
                          src={`/${userBadge.badge.imageKey}`}
                          alt={userBadge.badge.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {badges.friendExclusive.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Their Arsenal</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {badges.friendExclusive.length} unique
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2">
                    {badges.friendExclusive.slice(0, 8).map((userBadge) => (
                      <div
                        key={userBadge.id}
                        className="aspect-square relative"
                      >
                        <Image
                          src={`/${userBadge.badge.imageKey}`}
                          alt={userBadge.badge.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Activity Feed */}
        {activities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Battle Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activities.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={activity.user.image || undefined}
                        alt={activity.user.name || activity.user.email}
                      />
                      <AvatarFallback className="text-xs">
                        {(activity.user.name || activity.user.email)
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">
                          {activity.user.name ||
                            activity.user.email.split("@")[0]}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {activity.description}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
