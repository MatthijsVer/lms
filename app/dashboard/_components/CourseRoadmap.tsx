"use client";

import { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trophy,
  CheckCircle2,
  Lock,
  Play,
  Star,
  Castle,
  Rocket,
  Crown,
  BookOpen,
} from "lucide-react";
import { motion } from "framer-motion";

// Types
import { CourseRoadmapDataType } from "@/app/data/course/get-course-roadmap-data";

interface GameRoadmapProps {
  data: CourseRoadmapDataType;
}

type NodeKind = "lesson" | "chapterGate" | "reward" | "start" | "finish";

/**
 * Polished Duolingo‑style roadmap
 * Visual upgrades:
 * - Glassy header with stat chips and gradient badge button
 * - Soft gradient blobs + dotted grid backdrop for depth
 * - Thicker serpentine path with segmented states (completed / active / upcoming)
 * - Animated current node (breathing ring) and hover lift on unlocked lessons
 * - Compact, touch‑friendly spacing + better contrast and a11y labels
 */
export function CourseRoadmap({ data }: GameRoadmapProps) {
  const chapters = data.chapters || [];

  // Build a linear sequence of nodes (lessons interleaved with gates/rewards)
  const nodes = useMemo(() => {
    const seq: Array<{
      id: string;
      kind: NodeKind;
      label?: string;
      chapterIndex?: number;
      lessonIndex?: number;
      isCompleted?: boolean;
      isLocked?: boolean;
      isCurrent?: boolean;
      href?: string;
    }> = [];

    // START node
    seq.push({ id: "start", kind: "start", label: "START" });

    chapters.forEach((ch, ci) => {
      const lessons = ch.lessons || [];
      const chapterDone = lessons.every((l) => l.isCompleted);
      const chapterLocked =
        ci > 0 &&
        !(chapters[ci - 1]?.lessons || []).every((l) => l.isCompleted);

      // chapter gate (big node)
      seq.push({
        id: `gate-${ci}`,
        kind: "chapterGate",
        label: ch.title,
        chapterIndex: ci,
        isCompleted: chapterDone,
        isLocked: chapterLocked,
      });

      lessons.forEach((lesson, li) => {
        const locked =
          chapterLocked || (li > 0 && !lessons[li - 1].isCompleted);
        const isCurrent =
          !locked &&
          !lesson.isCompleted &&
          (li === 0 || lessons[li - 1].isCompleted);

        seq.push({
          id: lesson.id,
          kind: "lesson",
          label: lesson.title || `Lesson ${li + 1}`,
          chapterIndex: ci,
          lessonIndex: li,
          isCompleted: lesson.isCompleted,
          isLocked: locked,
          isCurrent,
          href: locked
            ? undefined
            : `/dashboard/${data.course.slug}/${lesson.id}`,
        });

        // sprinkle rewards occasionally (keep minimal to reduce visual noise)
        if (lesson.isCompleted && li % 5 === 4) {
          seq.push({ id: `rw-${ci}-${li}`, kind: "reward", isCompleted: true });
        }
      });
    });

    // FINISH
    const allCompleted = data.stats.progressPercentage === 100;
    seq.push({
      id: "finish",
      kind: "finish",
      label: "FINISH",
      isCompleted: allCompleted,
    });

    return seq;
  }, [chapters, data.course?.slug, data.stats.progressPercentage]);

  // Layout math — vertical serpentine with alternating offsets
  const lane = (i: number) => {
    const lanes = [22, 78]; // left / right percentages (wider zig‑zag)
    const y = i * 120 + 110; // spacing
    return { x: lanes[i % 2], y };
  };

  const completedLessons = data.stats.completedLessons;
  const totalLessons = data.stats.totalLessons;

  return (
    <div className="relative w-full h-full">
      {/* Background: gradient blobs + dotted grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
      >
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-30 bg-gradient-to-tr from-amber-500/30 via-amber-500/10 to-transparent dark:from-amber-400/20" />
        <svg
          className="absolute inset-0 opacity-[0.08]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="dots"
              x="0"
              y="0"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="1" className="fill-foreground" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight truncate flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-primary/15 text-primary border border-primary/20">
                <Rocket className="h-3.5 w-3.5" />
              </span>
              Learning Quest
            </h2>
            <div className="mt-1 flex items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 bg-card text-muted-foreground">
                <CheckCircle2 className="h-3 w-3" /> {completedLessons}/
                {totalLessons}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 bg-card text-muted-foreground">
                <Star className="h-3 w-3" />{" "}
                {Math.round(data.stats.progressPercentage)}%
              </span>
            </div>
          </div>

          <Button
            size="sm"
            className="h-8 px-3 rounded-full text-[11px] border bg-gradient-to-r from-primary/90 to-primary shadow-sm shadow-primary/20 hover:shadow-primary/30"
            variant="default"
          >
            <Crown className="h-3.5 w-3.5 mr-1" /> Badges
          </Button>
        </div>
        <div className="mt-2">
          <Progress value={data.stats.progressPercentage} className="h-1.5" />
        </div>
      </div>

      {/* Vertical map */}
      <ScrollArea className="h-[calc(100dvh-76px)]">
        <div className="relative py-8 px-4">
          {/* PATH */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0 }}
          >
            <defs>
              <linearGradient id="pathCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="oklch(var(--primary))"
                  stopOpacity="0.45"
                />
                <stop
                  offset="100%"
                  stopColor="oklch(var(--primary))"
                  stopOpacity="0.35"
                />
              </linearGradient>
              <linearGradient id="pathActive" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="oklch(var(--primary))"
                  stopOpacity="0.6"
                />
                <stop
                  offset="100%"
                  stopColor="oklch(var(--primary))"
                  stopOpacity="0.5"
                />
              </linearGradient>
              <linearGradient id="pathUpcoming" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="oklch(var(--border))"
                  stopOpacity="0.6"
                />
                <stop
                  offset="100%"
                  stopColor="oklch(var(--border))"
                  stopOpacity="0.45"
                />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {nodes.map((_, i) => {
              if (i === nodes.length - 1) return null;
              const a = lane(i);
              const b = lane(i + 1);

              const currentNode = nodes[i];
              const nextNode = nodes[i + 1];

              let stroke = "url(#pathUpcoming)";
              let dasharray: string | undefined = "6 6"; // upcoming = dashed
              let width = 8;

              const bothDone = currentNode.isCompleted && nextNode.isCompleted;
              const activeEdge =
                currentNode.isCompleted || currentNode.isCurrent;

              if (bothDone) {
                stroke = "url(#pathCompleted)";
                dasharray = undefined; // solid
                width = 10;
              } else if (activeEdge) {
                stroke = "url(#pathActive)";
                dasharray = "0"; // solid
                width = 10;
              }

              const ctrl = Math.abs(a.x - b.x) * 0.9;
              const d = `M ${a.x}% ${a.y} C ${a.x}% ${a.y + ctrl}, ${b.x}% ${b.y - ctrl}, ${b.x}% ${b.y}`;

              return (
                <g key={`edge-${i}`}>
                  {/* soft outer */}
                  <path
                    d={d}
                    fill="none"
                    stroke="oklch(var(--border))"
                    strokeWidth={width + 6}
                    strokeLinecap="round"
                    opacity="0.08"
                  />
                  {/* main */}
                  <path
                    d={d}
                    filter="url(#glow)"
                    fill="none"
                    stroke={stroke}
                    strokeWidth={width}
                    strokeLinecap="round"
                    strokeDasharray={dasharray}
                  />

                  {/* dotted path markers */}
                  {[0.16, 0.32, 0.48, 0.64, 0.8, 0.92].map((t) => {
                    const x0 = a.x,
                      y0 = a.y;
                    const x1 = a.x,
                      y1 = a.y + ctrl;
                    const x2 = b.x,
                      y2 = b.y - ctrl;
                    const x3 = b.x,
                      y3 = b.y;

                    const mt = 1 - t;
                    const bx =
                      mt * mt * mt * x0 +
                      3 * mt * mt * t * x1 +
                      3 * mt * t * t * x2 +
                      t * t * t * x3;
                    const by =
                      mt * mt * mt * y0 +
                      3 * mt * mt * t * y1 +
                      3 * mt * t * t * y2 +
                      t * t * t * y3;

                    const isDone = bothDone;
                    const isActive = activeEdge && !bothDone;
                    const r = isDone || isActive ? 2.3 : 1.7;
                    const fill =
                      isDone || isActive
                        ? "oklch(var(--primary))"
                        : "oklch(var(--muted-foreground))";
                    const op = isDone ? 0.45 : isActive ? 0.4 : 0.22;

                    return (
                      <circle
                        key={`dot-${i}-${t}`}
                        cx={`${bx}%`}
                        cy={by}
                        r={r}
                        fill={fill}
                        opacity={op}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {/* NODES */}
          {nodes.map((n, i) => {
            const { x, y } = lane(i);

            const S =
              n.kind === "chapterGate"
                ? 68
                : n.kind === "start" || n.kind === "finish"
                  ? 60
                  : n.kind === "reward"
                    ? 44
                    : 52;

            const base =
              "absolute -translate-x-1/2 -translate-y-1/2 rounded bg-primary/10 grid place-items-center select-none transition-transform duration-300 border";

            const interactive =
              n.kind === "lesson" && !n.isLocked
                ? "focus:-translate-y-0.5"
                : "";

            const ringAnim =
              n.kind === "lesson" && n.isCurrent ? (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full"
                  initial={{ boxShadow: "0 0 0 0 rgba(0,0,0,0)" }}
                  animate={{
                    boxShadow: [
                      "0 0 0 0 rgba(0,0,0,0)",
                      "0 0 0 6px rgba(0,0,0,0.03)",
                      "0 0 0 10px rgba(0,0,0,0.02)",
                    ],
                  }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
              ) : null;

            const nodeTone = (() => {
              if (n.kind === "lesson") {
                if (n.isCompleted)
                  return "bg-card/90 border-border text-muted-foreground";
                if (n.isLocked)
                  return "bg-muted/40 border-border/60 text-muted-foreground/60";
                if (n.isCurrent)
                  return "bg-primary/10 border-primary/60 text-primary shadow-sm shadow-primary/30";
                return "bg-card/90 border-border text-foreground";
              }
              if (n.kind === "chapterGate") {
                if (n.isCompleted)
                  return "bg-card border-primary/50 text-foreground";
                if (n.isLocked)
                  return "bg-muted/40 border-border/60 text-muted-foreground/60";
                return "bg-card border-border text-foreground";
              }
              if (n.kind === "start")
                return "bg-primary/10 border-primary/60 text-primary";
              if (n.kind === "finish")
                return n.isCompleted
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-muted/40 border-border/60 text-muted-foreground/70";
              return "bg-card";
            })();

            const icon = (() => {
              const iconClass =
                n.kind === "chapterGate"
                  ? "h-7 w-7"
                  : n.kind === "start" || n.kind === "finish"
                    ? "h-6 w-6"
                    : "h-5 w-5";
              switch (n.kind) {
                case "start":
                  return <Rocket className={iconClass} aria-label="Start" />;
                case "finish":
                  return <Trophy className={iconClass} aria-label="Finish" />;
                case "reward":
                  return <Star className={iconClass} aria-label="Reward" />;
                case "chapterGate":
                  if (n.isLocked)
                    return (
                      <Lock className={iconClass} aria-label="Locked chapter" />
                    );
                  if (n.isCompleted)
                    return (
                      <CheckCircle2
                        className={iconClass}
                        aria-label="Chapter complete"
                      />
                    );
                  return <Castle className={iconClass} aria-label="Chapter" />;
                case "lesson":
                  if (n.isCompleted)
                    return (
                      <CheckCircle2
                        className={iconClass}
                        aria-label="Lesson complete"
                      />
                    );
                  if (n.isLocked)
                    return (
                      <Lock className={iconClass} aria-label="Lesson locked" />
                    );
                  if (n.isCurrent)
                    return (
                      <Play
                        className={iconClass}
                        aria-label="Continue lesson"
                      />
                    );
                  return <BookOpen className={iconClass} aria-label="Lesson" />;
              }
            })();

            const NodeShell = (
              <motion.div
                className={cn(
                  base,
                  nodeTone,
                  interactive,
                  "ring-2 ring-background/80"
                )}
                style={{
                  left: `${x}%`,
                  top: y,
                  width: S,
                  height: S,
                  zIndex: 10,
                }}
                whileTap={{ scale: 0.98 }}
                aria-live={n.isCurrent ? "polite" : undefined}
              >
                {ringAnim}
                {icon}

                {/* Chapter label */}
                {n.kind === "chapterGate" && n.label && (
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-60 text-center">
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-foreground/90 bg-card/90 backdrop-blur px-3 py-1.5 rounded-lg border border-border shadow-sm">
                      <span className="max-w-[200px] truncate">{n.label}</span>
                    </div>
                  </div>
                )}

                {/* Lesson label */}
                {n.kind === "lesson" && n.label && (
                  <div className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-48 text-center">
                    <div
                      className={cn(
                        "inline-block text-[11px] font-medium px-2.5 py-1 rounded-md border shadow-sm",
                        n.isCompleted &&
                          "text-muted-foreground bg-card border-border",
                        n.isLocked &&
                          "text-muted-foreground/60 bg-muted/30 border-border/60",
                        n.isCurrent &&
                          "text-primary bg-primary/5 border-primary/30",
                        !n.isCompleted &&
                          !n.isLocked &&
                          !n.isCurrent &&
                          "text-foreground bg-card border-border"
                      )}
                    >
                      <span className="max-w-[150px] truncate inline-block">
                        {n.label}
                      </span>
                    </div>
                  </div>
                )}

                {/* Start/Finish badges */}
                {(n.kind === "start" || n.kind === "finish") && (
                  <div className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2">
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2.5 py-0.5 rounded-full border",
                        n.kind === "start" &&
                          "bg-primary/10 text-primary border-primary/30",
                        n.kind === "finish" &&
                          n.isCompleted &&
                          "bg-primary/10 text-primary border-primary/30",
                        n.kind === "finish" &&
                          !n.isCompleted &&
                          "bg-muted/40 text-muted-foreground border-border/60"
                      )}
                    >
                      {n.kind === "start" ? "START" : "FINISH"}
                    </span>
                  </div>
                )}
              </motion.div>
            );

            if (n.kind === "lesson" && n.href && !n.isLocked) {
              return (
                <Link
                  key={n.id}
                  href={n.href}
                  className="group"
                  prefetch={false}
                  aria-label={`Open ${n.label}`}
                >
                  {NodeShell}
                </Link>
              );
            }
            return <div key={n.id}>{NodeShell}</div>;
          })}

          {/* Spacer ensures scrollable space at the end */}
          <div style={{ height: nodes.length * 120 + 180 }} />
        </div>
      </ScrollArea>
    </div>
  );
}
