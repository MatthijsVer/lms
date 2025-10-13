"use client";

import { AiCourseStructure } from "@/lib/ai/course-structure";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";

interface CoursePreviewProps {
  course?: AiCourseStructure | null;
  onSaveCourse?: (course: AiCourseStructure) => void;
  isSaving?: boolean;
}

export function CoursePreview({ course, onSaveCourse, isSaving }: CoursePreviewProps) {
  const handleCopy = () => {
    if (!course) return;
    navigator.clipboard
      .writeText(JSON.stringify(course, null, 2))
      .then(() => toast.success("Course JSON copied to clipboard"))
      .catch(() => toast.error("Failed to copy JSON"));
  };

  const handleDownload = () => {
    if (!course) return;
    const blob = new Blob([JSON.stringify(course, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${course.title.replace(/\s+/g, "-").toLowerCase()}-course.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Generated course preview</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            disabled={!course}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            disabled={!course}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => course && onSaveCourse?.(course)}
            disabled={!course || isSaving}
          >
            {isSaving ? "Saving…" : "Save course"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!course ? (
          <p className="text-sm text-muted-foreground">
            Generated courses will appear here once the AI returns a structure.
            You can copy or download the JSON to import later.
          </p>
        ) : (
          <>
            <div className="space-y-2 rounded-md border bg-muted/30 p-3">
              <h3 className="text-lg font-semibold">{course.title}</h3>
              <p className="text-sm text-muted-foreground">
                {course.smallDescription}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{course.level}</Badge>
                <Badge variant="secondary">{course.category}</Badge>
                <Badge variant="outline">{course.duration} hrs</Badge>
                <Badge variant="outline">${course.price}</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Chapters
              </h4>
              <ScrollArea className="h-60 rounded-md border bg-muted/20 p-3">
                <ol className="space-y-4 text-sm">
                  {course.chapters.map((chapter) => (
                    <li key={chapter.position} className="space-y-2">
                      <div className="font-medium">
                        {chapter.position}. {chapter.title}
                      </div>
                      {chapter.lessons.length > 0 && (
                        <ol className="ml-4 list-decimal space-y-1 text-muted-foreground">
                          {chapter.lessons.map((lesson) => (
                            <li key={lesson.position}>
                              {lesson.title}{" "}
                              <span className="text-xs">
                                ({lesson.contentBlocks?.length ?? 0} blocks)
                              </span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </li>
                  ))}
                </ol>
              </ScrollArea>
            </div>

            <div className="rounded-md border bg-muted/30 p-3">
              <h4 className="text-sm font-medium">Raw JSON</h4>
              <ScrollArea className="mt-2 h-48 rounded bg-background p-3">
                <pre className="text-xs leading-normal max-w-150">
                  {JSON.stringify(course, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
