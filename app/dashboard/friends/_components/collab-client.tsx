"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import { CalendarClock, Loader2, Sparkles, Target, Users } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { UserCollabOverview } from "@/app/data/collaboration/get-user-collab-overview";
import { createCollabGroup } from "@/app/data/collaboration/actions";
import { cn } from "@/lib/utils";

interface CollabClientProps {
  overview: UserCollabOverview;
}

export function CollabClient({ overview }: CollabClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast.error("Give your collaboration a name first.");
      return;
    }

    startTransition(async () => {
      try {
        await createCollabGroup({
          name: groupName,
          description: groupDescription,
        });

        setGroupName("");
        setGroupDescription("");
        setIsDialogOpen(false);

        toast.success("Collaboration hub created!");
        router.refresh();
      } catch (error) {
        console.error("Failed to create collab group", error);
        toast.error("Could not create the collaboration hub.");
      }
    });
  };

  const totalGroups = overview.groups.length;
  const totalUpcomingSessions = overview.upcomingSessions.length;
  const activeGoals = overview.groups.reduce(
    (sum, group) => sum + group.goals.length,
    0
  );

  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-muted/30" />
      <div className="mx-auto flex w-full flex-col gap-8 px-4 py-6 sm:px-6">
        <Card className="border py-0 border-border/60 bg-background/80 shadow-lg backdrop-blur">
          <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">
                    Collaboration Hub
                  </h1>
                  <Badge variant="secondary" className="uppercase">
                    {totalGroups} {totalGroups === 1 ? "group" : "groups"}
                  </Badge>
                </div>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Organise squads, set shared goals, and schedule live learning
                  jams with your friends. Everything you need to level up
                  together lives here.
                </p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    New Collaboration
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Launch a collaboration hub</DialogTitle>
                    <DialogDescription>
                      Invite learning partners, track shared goals, and book
                      study sessions.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Input
                        placeholder="Squad name"
                        value={groupName}
                        onChange={(event) => setGroupName(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Textarea
                        placeholder="What is this collaboration focused on?"
                        value={groupDescription}
                        onChange={(event) =>
                          setGroupDescription(event.target.value)
                        }
                      />
                    </div>
                    <Button
                      className="w-full gap-2"
                      onClick={handleCreateGroup}
                      disabled={isPending}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Create Collaboration
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Shared Hubs
                </p>
                <p className="mt-1 text-2xl font-bold">{totalGroups}</p>
                <p className="text-xs text-muted-foreground">
                  Active collaboration spaces with your friends.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Active Goals
                </p>
                <p className="mt-1 text-2xl font-bold">{activeGoals}</p>
                <p className="text-xs text-muted-foreground">
                  Collective progress targets across all groups.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Upcoming Sessions
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {totalUpcomingSessions}
                </p>
                <p className="text-xs text-muted-foreground">
                  Scheduled study jams and accountability check-ins.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <Card className="border border-border/60 bg-background/80 shadow-sm backdrop-blur">
            <CardHeader className="flex flex-col gap-2 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-primary" />
                  Collaboration Groups
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track progress and coordinate your learning partners.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {overview.groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/40 py-12 text-center text-muted-foreground">
                  <Users className="h-12 w-12 opacity-60" />
                  <p className="font-medium">Start your first collaboration</p>
                  <p className="text-sm">
                    Create a hub, invite friends, and set your first shared
                    goal.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {overview.groups.map((group) => {
                    const nextSession = group.sessions.find(
                      (session) => session.status === "SCHEDULED"
                    );
                    return (
                      <Card
                        key={group.id}
                        className="border border-border/60 bg-background/90 shadow-sm transition hover:border-primary/40 hover:shadow-lg"
                      >
                        <CardContent className="flex flex-col gap-4 py-0 px-5">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold">
                                  {group.name}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] uppercase"
                                >
                                  {group.members.length} members
                                </Badge>
                              </div>
                              {group.description && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {group.description}
                                </p>
                              )}
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link
                                href={`/dashboard/friends/collab/${group.id}`}
                              >
                                Open Hub
                              </Link>
                            </Button>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <AvatarStack
                              members={group.members.map(
                                (member) => member.user
                              )}
                            />
                          </div>

                          <Separator className="bg-border/60" />

                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                              <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                                <Target className="h-4 w-4 text-primary" />
                                Goals
                              </p>
                              <p className="mt-2 text-sm text-muted-foreground">
                                {group.goals.length > 0
                                  ? `${group.goals.length} active target${
                                      group.goals.length === 1 ? "" : "s"
                                    }`
                                  : "No shared targets yet"}
                              </p>
                            </div>
                            <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                              <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                                <CalendarClock className="h-4 w-4 text-primary" />
                                Next Session
                              </p>
                              <p className="mt-2 text-sm text-muted-foreground">
                                {nextSession
                                  ? `${format(new Date(nextSession.scheduledAt), "MMMM d, h:mm a")}`
                                  : "No sessions scheduled"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-background/80 shadow-sm backdrop-blur">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarClock className="h-5 w-5 text-primary" />
                Upcoming Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {overview.upcomingSessions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                  No upcoming sessions. Schedule a study jam and stay
                  accountable together.
                </div>
              ) : (
                overview.upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-lg border border-border/60 bg-muted/40 p-4"
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
                      <Badge variant="outline" className="text-xs">
                        {session.group.name}
                      </Badge>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {format(
                        new Date(session.scheduledAt),
                        "EEEE, MMM d • h:mm a"
                      )}
                      {session.durationMinutes
                        ? ` • ${session.durationMinutes} min`
                        : ""}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AvatarStack({
  members,
}: {
  members: Array<{
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  }>;
}) {
  const maxVisible = 5;
  const visible = members.slice(0, maxVisible);
  const remaining = members.length - visible.length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-3">
        {visible.map((member) => (
          <Avatar
            key={member.id}
            className={cn(
              "border border-border/80",
              "h-9 w-9 bg-background shadow-sm"
            )}
          >
            <AvatarImage
              src={member.image || undefined}
              alt={member.name || member.email}
            />
            <AvatarFallback>
              {(member.name || member.email).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      {remaining > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}
