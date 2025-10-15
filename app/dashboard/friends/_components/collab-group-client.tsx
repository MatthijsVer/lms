"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

import {
  CalendarClock,
  Check,
  Loader2,
  Plus,
  Sparkles,
  Target,
  Users,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import { CollabGroupDetail } from "@/app/data/collaboration/get-collab-group-detail";
import {
  addCollabGroupMember,
  createCollabGoal,
  createCollabSession,
  recordCollabGoalProgress,
  removeCollabGroupMember,
  respondToCollabSession,
} from "@/app/data/collaboration/actions";
import { searchUsers } from "@/app/data/friends/actions";
import { cn } from "@/lib/utils";

type UserSearchResult = Awaited<ReturnType<typeof searchUsers>>[number];

interface CollabGroupClientProps {
  group: NonNullable<CollabGroupDetail>;
}

export function CollabGroupClient({ group }: CollabGroupClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalTarget, setGoalTarget] = useState(1000);
  const [goalType, setGoalType] = useState<
    "XP" | "LESSONS_COMPLETED" | "COURSES_COMPLETED" | "STREAK" | "CUSTOM"
  >("XP");
  const [goalDueDate, setGoalDueDate] = useState<string>("");

  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDescription, setSessionDescription] = useState("");
  const [sessionScheduledAt, setSessionScheduledAt] = useState("");
  const [sessionDuration, setSessionDuration] = useState<number | undefined>(60);
  const [sessionMeetingLink, setSessionMeetingLink] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { group: groupData, currentUserId, currentUserRole } = group;
  const canManage = currentUserRole === "OWNER" || currentUserRole === "ADMIN";
  const isOwner = currentUserRole === "OWNER";

  const memberIds = useMemo(
    () => new Set(groupData.members.map((member) => member.userId)),
    [groupData.members]
  );

  const handleGoalCreate = () => {
    if (!goalTitle.trim()) {
      toast.error("Give the goal a title.");
      return;
    }

    startTransition(async () => {
      try {
        await createCollabGoal({
          groupId: groupData.id,
          title: goalTitle,
          description: goalDescription,
          type: goalType,
          targetValue: goalTarget,
          dueDate: goalDueDate ? new Date(goalDueDate) : undefined,
        });

        setGoalTitle("");
        setGoalDescription("");
        setGoalTarget(1000);
        setGoalType("XP");
        setGoalDueDate("");
        setIsGoalDialogOpen(false);

        toast.success("Shared goal created!");
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Could not create the goal.");
      }
    });
  };

  const handleSessionCreate = () => {
    if (!sessionTitle.trim() || !sessionScheduledAt) {
      toast.error("Fill in the session title and schedule.");
      return;
    }

    startTransition(async () => {
      try {
        await createCollabSession({
          groupId: groupData.id,
          title: sessionTitle,
          description: sessionDescription,
          scheduledAt: new Date(sessionScheduledAt),
          durationMinutes: sessionDuration,
          meetingLink: sessionMeetingLink,
          attendeeIds: groupData.members.map((member) => member.userId),
        });

        setSessionTitle("");
        setSessionDescription("");
        setSessionScheduledAt("");
        setSessionDuration(60);
        setSessionMeetingLink("");
        setIsSessionDialogOpen(false);
        toast.success("Session scheduled!");
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Could not schedule the session.");
      }
    });
  };

  const handleGoalProgress = (goalId: string, amount: number) => {
    startTransition(async () => {
      try {
        await recordCollabGoalProgress({
          goalId,
          amount,
        });
        toast.success("Progress logged!");
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Could not record progress.");
      }
    });
  };

  const handleSessionResponse = (sessionId: string, response: "ACCEPTED" | "DECLINED") => {
    startTransition(async () => {
      try {
        await respondToCollabSession({
          sessionId,
          response,
        });
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Could not update attendance.");
      }
    });
  };

  const handleRemoveMember = (memberId: string) => {
    startTransition(async () => {
      try {
        await removeCollabGroupMember({
          groupId: groupData.id,
          memberId,
        });
        toast.success("Member removed.");
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Could not remove member.");
      }
    });
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchUsers(query);
      setSearchResults(results.filter((result) => !memberIds.has(result.id)));
    } catch (error) {
      toast.error("Search failed. Try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = (user: UserSearchResult) => {
    startTransition(async () => {
      try {
        await addCollabGroupMember({
          groupId: groupData.id,
          userId: user.id,
          role: "MEMBER",
        });
        toast.success(`${user.name || user.email.split("@")[0]} added to the hub.`);
        setSearchQuery("");
        setSearchResults([]);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Could not add member.");
      }
    });
  };

  const upcomingSessions = groupData.sessions.filter(
    (session) => session.status === "SCHEDULED" && new Date(session.scheduledAt) >= new Date()
  );
  const pastSessions = groupData.sessions.filter(
    (session) => session.status !== "SCHEDULED" || new Date(session.scheduledAt) < new Date()
  );

  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-muted/30" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="border border-border/60 bg-background/80 shadow-lg backdrop-blur">
          <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">{groupData.name}</h1>
                  <Badge variant="secondary" className="uppercase">
                    {groupData.members.length} teammates
                  </Badge>
                  <Badge variant="outline" className="text-xs uppercase">
                    You: {currentUserRole.toLowerCase()}
                  </Badge>
                </div>
                {groupData.description && (
                  <p className="max-w-2xl text-sm text-muted-foreground">{groupData.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Created{" "}
                  {formatDistanceToNow(new Date(groupData.createdAt), {
                    addSuffix: true,
                  })}{" "}
                  by {groupData.owner.name || groupData.owner.email}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/friends/collab">Back to hub</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Members</p>
                <p className="mt-1 text-2xl font-bold">{groupData.members.length}</p>
                <p className="text-xs text-muted-foreground">
                  Collaborators linked to this learning hub.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Goals</p>
                <p className="mt-1 text-2xl font-bold">{groupData.goals.length}</p>
                <p className="text-xs text-muted-foreground">
                  Shared targets to keep the squad aligned.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Sessions</p>
                <p className="mt-1 text-2xl font-bold">{upcomingSessions.length}</p>
                <p className="text-xs text-muted-foreground">
                  Scheduled jams waiting on your calendar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <div className="space-y-6">
            <Card className="border border-border/60 bg-background/80 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-col gap-2 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-primary" />
                  Members
                </CardTitle>
                {canManage && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      value={searchQuery}
                      onChange={(event) => handleSearch(event.target.value)}
                      placeholder="Invite by name or email"
                      className="min-w-[220px]"
                    />
                    <div className="text-xs text-muted-foreground">
                      {isSearching
                        ? "Searching..."
                        : searchQuery.length >= 2 && searchResults.length === 0
                          ? "No matches yet."
                          : null}
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {canManage && searchResults.length > 0 && (
                  <div className="space-y-3 rounded-xl border border-border/60 bg-muted/40 p-4">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/50 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border/60">
                            <AvatarImage
                              src={result.image || undefined}
                              alt={result.name || result.email}
                            />
                            <AvatarFallback>
                              {(result.name || result.email).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <p className="font-medium">
                              {result.name || result.email.split("@")[0]}
                            </p>
                            <p className="text-xs text-muted-foreground">{result.email}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          disabled={isPending}
                          onClick={() => handleAddMember(result)}
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                          Invite
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  {groupData.members.map((member) => (
                    <div
                      key={member.userId}
                      className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/40 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border border-border/60">
                          <AvatarImage
                            src={member.user.image || undefined}
                            alt={member.user.name || member.user.email}
                          />
                          <AvatarFallback>
                            {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">
                            {member.user.name || member.user.email.split("@")[0]}
                          </p>
                          <p className="text-xs text-muted-foreground">{member.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <Badge variant="outline" className="uppercase">
                          {member.role.toLowerCase()}
                        </Badge>
                        <span>
                          Joined{" "}
                          {formatDistanceToNow(new Date(member.joinedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      {canManage && member.userId !== currentUserId && member.role !== "OWNER" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-destructive hover:bg-destructive/10"
                          disabled={isPending}
                          onClick={() => handleRemoveMember(member.userId)}
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserMinus className="h-4 w-4" />
                          )}
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/60 bg-background/80 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-col gap-2 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-primary" />
                  Shared Goals
                </CardTitle>
                {canManage && (
                  <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Goal
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create a shared goal</DialogTitle>
                        <DialogDescription>
                          Define the next milestone your collaboration will aim for.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <Input
                          placeholder="Goal title"
                          value={goalTitle}
                          onChange={(event) => setGoalTitle(event.target.value)}
                        />
                        <Textarea
                          placeholder="Describe what success looks like."
                          value={goalDescription}
                          onChange={(event) => setGoalDescription(event.target.value)}
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">
                              Target value
                            </label>
                            <Input
                              type="number"
                              min={1}
                              value={goalTarget}
                              onChange={(event) =>
                                setGoalTarget(Math.max(1, Number(event.target.value)))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">
                              Goal type
                            </label>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              value={goalType}
                              onChange={(event) =>
                                setGoalType(
                                  event.target.value as
                                    | "XP"
                                    | "LESSONS_COMPLETED"
                                    | "COURSES_COMPLETED"
                                    | "STREAK"
                                    | "CUSTOM"
                                )
                              }
                            >
                              <option value="XP">Total XP</option>
                              <option value="LESSONS_COMPLETED">Lessons completed</option>
                              <option value="COURSES_COMPLETED">Courses completed</option>
                              <option value="STREAK">Streak days</option>
                              <option value="CUSTOM">Custom metric</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase text-muted-foreground">
                            Due date (optional)
                          </label>
                          <Input
                            type="datetime-local"
                            value={goalDueDate}
                            onChange={(event) => setGoalDueDate(event.target.value)}
                          />
                        </div>
                        <Button
                          className="w-full gap-2"
                          onClick={handleGoalCreate}
                          disabled={isPending}
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          Save Goal
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {groupData.goals.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/60 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                    No goals yet. Kick things off by setting your first shared milestone.
                  </div>
                ) : (
                  groupData.goals.map((goal) => {
                    const progressPercent = Math.min(
                      100,
                      Math.round((goal.progressValue / goal.targetValue) * 100)
                    );
                    return (
                      <div
                        key={goal.id}
                        className="rounded-lg border border-border/60 bg-muted/40 p-5 space-y-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{goal.title}</p>
                            {goal.description && (
                              <p className="text-sm text-muted-foreground">{goal.description}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs uppercase">
                            {goal.type.toLowerCase().replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <Progress value={progressPercent} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {goal.progressValue.toLocaleString()} /{" "}
                            {goal.targetValue.toLocaleString()} ({progressPercent}%)
                          </p>
                          {goal.dueDate && (
                            <p className="text-xs text-muted-foreground">
                              Due {format(new Date(goal.dueDate), "MMMM d, yyyy")}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {[50, 100, 250].map((amount) => (
                            <Button
                              key={amount}
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => handleGoalProgress(goal.id, amount)}
                              disabled={isPending}
                            >
                              +{amount}
                            </Button>
                          ))}
                        </div>
                        {goal.updates.length > 0 && (
                          <div className="space-y-2 rounded-md border border-border/40 bg-background/60 p-3">
                            <p className="text-xs font-semibold uppercase text-muted-foreground">
                              Recent updates
                            </p>
                            {goal.updates.map((update) => (
                              <div key={update.id} className="flex items-start gap-2 text-xs">
                                <Check className="mt-0.5 h-3 w-3 text-primary" />
                                <div>
                                  <p className="font-medium">
                                    {update.user.name || update.user.email.split("@")[0]} added{" "}
                                    {update.amount} progress
                                  </p>
                                  <p className="text-muted-foreground">
                                    {formatDistanceToNow(new Date(update.createdAt), {
                                      addSuffix: true,
                                    })}
                                  </p>
                                  {update.note && (
                                    <p className="mt-1 text-muted-foreground">{update.note}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-border/60 bg-background/80 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-col gap-2 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarClock className="h-5 w-5 text-primary" />
                    Upcoming Sessions
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Coordinate deep-work sprints and accountability calls.
                  </p>
                </div>
                {canManage && (
                  <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Schedule Session
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule a collaboration session</DialogTitle>
                        <DialogDescription>
                          Book time to learn together or host a live retro.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <Input
                          placeholder="Session title"
                          value={sessionTitle}
                          onChange={(event) => setSessionTitle(event.target.value)}
                        />
                        <Textarea
                          placeholder="What will you cover?"
                          value={sessionDescription}
                          onChange={(event) => setSessionDescription(event.target.value)}
                        />
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase text-muted-foreground">
                            Date & time
                          </label>
                          <Input
                            type="datetime-local"
                            value={sessionScheduledAt}
                            onChange={(event) => setSessionScheduledAt(event.target.value)}
                          />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">
                              Duration (minutes)
                            </label>
                            <Input
                              type="number"
                              min={15}
                              step={15}
                              value={sessionDuration ?? ""}
                              onChange={(event) =>
                                setSessionDuration(
                                  event.target.value ? Number(event.target.value) : undefined
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">
                              Meeting link (optional)
                            </label>
                            <Input
                              placeholder="https://"
                              value={sessionMeetingLink}
                              onChange={(event) => setSessionMeetingLink(event.target.value)}
                            />
                          </div>
                        </div>
                        <Button
                          className="w-full gap-2"
                          onClick={handleSessionCreate}
                          disabled={isPending}
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          Schedule
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {upcomingSessions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/60 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                    No sessions scheduled. Get something on the calendar to stay aligned.
                  </div>
                ) : (
                  upcomingSessions.map((session) => {
                    const attendeeRecord = session.attendees.find(
                      (attendee) => attendee.userId === currentUserId
                    );
                    return (
                      <div
                        key={session.id}
                        className="space-y-3 rounded-lg border border-border/60 bg-muted/40 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{session.title}</p>
                            {session.description && (
                              <p className="text-sm text-muted-foreground">
                                {session.description}
                              </p>
                            )}
                          </div>
                          {session.meetingLink && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={session.meetingLink} target="_blank">
                                Join
                              </Link>
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(session.scheduledAt), "EEEE, MMM d • h:mm a")}
                          {session.durationMinutes ? ` • ${session.durationMinutes} min` : ""}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          {session.attendees.map((attendee) => (
                            <Badge
                              key={attendee.id}
                              variant={
                                attendee.response === "ACCEPTED"
                                  ? "default"
                                  : attendee.response === "DECLINED"
                                    ? "destructive"
                                    : "outline"
                              }
                              className="flex items-center gap-1"
                            >
                              <Avatar className="h-6 w-6 border border-border/60">
                                <AvatarImage
                                  src={attendee.user.image || undefined}
                                  alt={attendee.user.name || attendee.user.email}
                                />
                                <AvatarFallback className="text-xs">
                                  {(attendee.user.name || attendee.user.email)
                                    .charAt(0)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-[10px] uppercase">
                                {attendee.response.toLowerCase()}
                              </span>
                            </Badge>
                          ))}
                        </div>
                        {attendeeRecord && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => handleSessionResponse(session.id, "ACCEPTED")}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => handleSessionResponse(session.id, "DECLINED")}
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {pastSessions.length > 0 && (
              <Card className="border border-border/60 bg-background/80 shadow-sm backdrop-blur">
                <CardHeader className="border-b border-border/60">
                  <CardTitle className="text-lg">Past Sessions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-6">
                  {pastSessions.map((session) => (
                    <div
                      key={session.id}
                      className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground"
                    >
                      <p className="font-medium text-foreground">{session.title}</p>
                      <p>
                        {format(new Date(session.scheduledAt), "MMMM d, yyyy")} •{" "}
                        {session.durationMinutes ? `${session.durationMinutes} min` : "Duration?"}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
