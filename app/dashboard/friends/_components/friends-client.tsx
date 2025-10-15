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

interface FriendsClientProps {
  friendsData: FriendsData;
}

export function FriendsClient({ friendsData }: FriendsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
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
    } catch (error) {
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Friends
          </h1>
          <p className="text-muted-foreground">
            {friendsData.friendCount}{" "}
            {friendsData.friendCount === 1 ? "friend" : "friends"}
          </p>
        </div>

        {/* Add Friend Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Friend
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a Friend</DialogTitle>
              <DialogDescription>
                Enter your friend's email address to send them a friend request.
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
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Friend Request
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Users className="h-4 w-4" />
            All Friends ({friendsData.friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Requests ({friendsData.pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({friendsData.sentRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* All Friends */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Your Friends</CardTitle>
            </CardHeader>
            <CardContent>
              {friendsData.friends.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No friends yet. Add some friends to get started!</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {friendsData.friends.map((friend) => (
                    <Link
                      key={friend.friendshipId}
                      href={`/dashboard/friends/${friend.id}`}
                    >
                      <Card className="py-0 cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar className="h-12 w-12">
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
                                    <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
                                  )}
                              </div>
                              <div>
                                <p className="font-semibold">
                                  {friend.name || friend.email.split("@")[0]}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {friend.email}
                                </p>
                              </div>
                            </div>
                          </div>

                          {friend.gameProfile && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-1">
                                  <Trophy className="h-4 w-4 text-yellow-500" />
                                  <span>
                                    Level {friend.gameProfile.currentLevel}
                                  </span>
                                </div>
                                <span className="text-muted-foreground">
                                  {friend.gameProfile.totalXP.toLocaleString()}{" "}
                                  XP
                                </span>
                              </div>

                              {friend.gameProfile.currentStreak > 0 && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Flame className="h-4 w-4 text-orange-500" />
                                  <span>
                                    {friend.gameProfile.currentStreak} day
                                    streak
                                  </span>
                                </div>
                              )}

                              <div className="text-xs text-muted-foreground">
                                {friend.gameProfile.totalLessonsCompleted}{" "}
                                lessons completed
                              </div>
                            </div>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-3"
                            onClick={() =>
                              handleRemoveFriend(
                                friend.friendshipId,
                                friend.name || friend.email
                              )
                            }
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Remove Friend
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Friend Requests */}
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Friend Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {friendsData.pendingRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending friend requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {friendsData.pendingRequests.map((request) => (
                    <div
                      key={request.friendshipId}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
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
                        <div>
                          <p className="font-medium">
                            {request.name || request.email.split("@")[0]}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(request.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleAcceptRequest(request.friendshipId)
                          }
                          disabled={isPending}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleDeclineRequest(request.friendshipId)
                          }
                          disabled={isPending}
                        >
                          <UserX className="h-4 w-4 mr-2" />
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
          <Card>
            <CardHeader>
              <CardTitle>Sent Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {friendsData.sentRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending sent requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {friendsData.sentRequests.map((request) => (
                    <div
                      key={request.friendshipId}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
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
                        <div>
                          <p className="font-medium">
                            {request.name || request.email.split("@")[0]}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Sent{" "}
                            {formatDistanceToNow(new Date(request.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
