"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Mail,
  Trophy,
  Flame,
  Search,
  Clock,
  Loader2,
} from "lucide-react";
import { FriendsData } from "@/app/data/friends/get-friends-data";
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  searchUsers,
} from "@/app/data/friends/actions";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

type UserSearchResult = Awaited<ReturnType<typeof searchUsers>>[number];

interface FriendsClientProps {
  friendsData: FriendsData;
}

export function FriendsClient({ friendsData }: FriendsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addFriendEmail, setAddFriendEmail] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchUsers(query);
      setSearchResults(results);
    } catch {
      toast.error("Failed to search users");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!addFriendEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    startTransition(async () => {
      const result = await sendFriendRequest(addFriendEmail);

      if (result.success) {
        toast.success(result.message);
        setAddFriendEmail("");
        setIsDialogOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleAcceptRequest = (friendshipId: string) => {
    startTransition(async () => {
      const result = await acceptFriendRequest(friendshipId);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleDeclineRequest = (friendshipId: string) => {
    startTransition(async () => {
      const result = await declineFriendRequest(friendshipId);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleRemoveFriend = (friendshipId: string, friendName: string) => {
    if (!confirm(`Remove ${friendName} from your friends?`)) {
      return;
    }

    startTransition(async () => {
      const result = await removeFriend(friendshipId);

      if (result.success) {
        toast.success("Friend removed");
      } else {
        toast.error(result.message);
      }
    });
  };

  const isOnline = (lastActivityDate: Date | null) => {
    if (!lastActivityDate) return false;
    const now = new Date();
    const diff = now.getTime() - new Date(lastActivityDate).getTime();
    return diff < 30 * 60 * 1000; // Online if active in last 30 minutes
  };

  const handleQuickSendRequest = (email: string) => {
    startTransition(async () => {
      const result = await sendFriendRequest(email);

      if (result.success) {
        toast.success(result.message);
        setSearchQuery("");
        setSearchResults([]);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="relative min-h-screen bg-background">
      <div className="mx-auto flex w-full flex-col gap-8 px-4 py-6 sm:px-6">
        <Card className="border border-border/60 p-0 bg-background/80 shadow-lg backdrop-blur">
          <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">
                    Friends Arena
                  </h1>
                  <Badge variant="secondary" className="uppercase">
                    {friendsData.friendCount} total
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground max-w-xl">
                  Challenge friends, celebrate wins, and keep improving
                  together.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" className="gap-2" asChild>
                  <Link href="/dashboard/friends/collab">Collaborate</Link>
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" size="lg">
                      <UserPlus className="h-4 w-4" />
                      Add Friend
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add a Friend</DialogTitle>
                      <DialogDescription>
                        Enter your friend&apos;s email address to send them a friend
                        request.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Input
                          placeholder="friend@example.com"
                          type="email"
                          value={addFriendEmail}
                          onChange={(e) => setAddFriendEmail(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSendRequest();
                            }
                          }}
                        />
                      </div>
                      <Button
                        onClick={handleSendRequest}
                        disabled={isPending}
                        className="w-full gap-2"
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4" />
                            Send Friend Request
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Total Friends
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {friendsData.friendCount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Accepted connections
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Requests Waiting
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {friendsData.pendingRequests.length.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Incoming approvals needed
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Invites Sent
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {friendsData.sentRequests.length.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Awaiting responses
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email to invite new friends..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searchQuery.length >= 2 && (
                <div className="space-y-3 rounded-xl border border-border/60 bg-background/95 p-4 shadow-lg">
                  {isSearching ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching for learners...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No learners found. Try a different email or name.
                    </p>
                  ) : (
                    searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/40 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border/60">
                            <AvatarImage
                              src={result.image || undefined}
                              alt={result.name || result.email}
                            />
                            <AvatarFallback>
                              {(result.name || result.email)
                                .charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <p className="font-medium">
                              {result.name || result.email.split("@")[0]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {result.email}
                            </p>
                            {result.gameProfile && (
                              <p className="text-xs text-muted-foreground">
                                Level {result.gameProfile.currentLevel} ·{" "}
                                {result.gameProfile.totalXP.toLocaleString()} XP
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.friendshipStatus === "ACCEPTED" ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/dashboard/friends/${result.id}`}>
                                View friend
                              </Link>
                            </Button>
                          ) : result.friendshipStatus === "PENDING" ? (
                            <Badge variant="outline" className="text-xs">
                              Request pending
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              className="gap-2"
                              disabled={isPending}
                              onClick={() =>
                                handleQuickSendRequest(result.email)
                              }
                            >
                              {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <UserPlus className="h-4 w-4" />
                              )}
                              Invite
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="flex w-full justify-start gap-2 overflow-x-auto rounded-xl border border-border/60 bg-background/70 p-1">
            <TabsTrigger
              value="all"
              className="gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow"
            >
              <Users className="h-4 w-4" />
              All Friends ({friendsData.friends.length})
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow"
            >
              <UserCheck className="h-4 w-4" />
              Requests ({friendsData.pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger
              value="sent"
              className="gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow"
            >
              <Clock className="h-4 w-4" />
              Pending ({friendsData.sentRequests.length})
            </TabsTrigger>
          </TabsList>

          {/* All Friends */}
          <TabsContent value="all">
            <Card className="border border-border/60 bg-background/80 shadow-sm backdrop-blur">
              <CardHeader className="border-b border-border/60">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-primary" />
                  Your Friends
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {friendsData.friends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/40 py-12 text-center text-muted-foreground">
                    <Users className="h-12 w-12 opacity-60" />
                    <p className="font-medium">
                      Bring your learning crew together
                    </p>
                    <p className="text-sm">
                      Invite teammates to compare progress and keep each other
                      accountable.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {friendsData.friends.map((friend) => (
                      <Card
                        key={friend.friendshipId}
                        className="group h-full border border-border/60 bg-background/90 shadow-sm transition hover:border-primary/40 hover:shadow-lg"
                      >
                        <CardContent className="flex h-full flex-col gap-4 p-5">
                          <Link
                            href={`/dashboard/friends/${friend.id}`}
                            className="group space-y-4 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <Avatar className="h-12 w-12 border border-border/60">
                                    <AvatarImage
                                      src={friend.image || undefined}
                                      alt={friend.name || friend.email}
                                    />
                                    <AvatarFallback>
                                      {(friend.name || friend.email)
                                        .charAt(0)
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  {friend.gameProfile &&
                                    isOnline(
                                      friend.gameProfile.lastActivityDate
                                    ) && (
                                      <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background bg-emerald-500 shadow" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                  <p className="font-semibold transition group-hover:text-primary">
                                    {friend.name || friend.email.split("@")[0]}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {friend.email}
                                  </p>
                                  {friend.gameProfile?.lastActivityDate && (
                                    <p className="text-xs text-muted-foreground">
                                      Active{" "}
                                      {formatDistanceToNow(
                                        new Date(
                                          friend.gameProfile.lastActivityDate
                                        ),
                                        { addSuffix: true }
                                      )}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {friend.gameProfile && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] uppercase"
                                >
                                  {friend.gameProfile.totalCoursesCompleted}{" "}
                                  courses
                                </Badge>
                              )}
                            </div>

                            {friend.gameProfile && (
                              <div className="space-y-2 rounded-lg bg-muted/40 p-3">
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2 font-medium">
                                    <Badge
                                      variant="outline"
                                      className="gap-1 border-transparent bg-primary/10 text-xs text-primary"
                                    >
                                      <Trophy className="h-3 w-3" />
                                      Level {friend.gameProfile.currentLevel}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {friend.gameProfile.totalXP.toLocaleString()}{" "}
                                    XP
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  <span>
                                    {friend.gameProfile.totalLessonsCompleted}{" "}
                                    lessons completed
                                  </span>
                                  {friend.gameProfile.currentStreak > 0 && (
                                    <span className="flex items-center gap-1 text-orange-500">
                                      <Flame className="h-3 w-3" />
                                      {friend.gameProfile.currentStreak}-day
                                      streak
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Link>

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              handleRemoveFriend(
                                friend.friendshipId,
                                friend.name || friend.email
                              );
                            }}
                          >
                            <UserX className="h-4 w-4" />
                            Remove friend
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Friend Requests */}
          <TabsContent value="requests">
            <Card className="border border-border/60 bg-background/80 shadow-sm backdrop-blur">
              <CardHeader className="border-b border-border/60">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserCheck className="h-5 w-5 text-primary" />
                  Friend Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {friendsData.pendingRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/40 py-12 text-center text-muted-foreground">
                    <UserCheck className="h-12 w-12 opacity-60" />
                    <p className="font-medium">No pending friend requests</p>
                    <p className="text-sm">
                      Invite more learners or wait for new challenges to arrive.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {friendsData.pendingRequests.map((request) => (
                      <div
                        key={request.friendshipId}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/40 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-11 w-11 border border-border/60">
                            <AvatarImage
                              src={request.image || undefined}
                              alt={request.name || request.email}
                            />
                            <AvatarFallback>
                              {(request.name || request.email)
                                .charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <p className="font-semibold">
                              {request.name || request.email.split("@")[0]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {request.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Requested{" "}
                              {formatDistanceToNow(
                                new Date(request.createdAt),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="gap-2"
                            onClick={() =>
                              handleAcceptRequest(request.friendshipId)
                            }
                            disabled={isPending}
                          >
                            {isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() =>
                              handleDeclineRequest(request.friendshipId)
                            }
                            disabled={isPending}
                          >
                            {isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserX className="h-4 w-4" />
                            )}
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sent Requests */}
          <TabsContent value="sent">
            <Card className="border border-border/60 bg-background/80 shadow-sm backdrop-blur">
              <CardHeader className="border-b border-border/60">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  Pending Invites
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {friendsData.sentRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/40 py-12 text-center text-muted-foreground">
                    <Clock className="h-12 w-12 opacity-60" />
                    <p className="font-medium">No invites waiting right now</p>
                    <p className="text-sm">
                      Sent requests will show here until your friend responds.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {friendsData.sentRequests.map((request) => (
                      <div
                        key={request.friendshipId}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/40 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-11 w-11 border border-border/60">
                            <AvatarImage
                              src={request.image || undefined}
                              alt={request.name || request.email}
                            />
                            <AvatarFallback>
                              {(request.name || request.email)
                                .charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <p className="font-semibold">
                              {request.name || request.email.split("@")[0]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {request.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Sent{" "}
                              {formatDistanceToNow(
                                new Date(request.createdAt),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-xs uppercase"
                        >
                          Pending
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
