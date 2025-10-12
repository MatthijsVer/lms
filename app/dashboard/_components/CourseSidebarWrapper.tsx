"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Map, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { CourseRoadmap } from "@/app/dashboard/_components/CourseRoadmap";
import { CourseRoadmapDataType } from "@/app/data/course/get-course-roadmap-data";

interface CourseSidebarWrapperProps {
  regularSidebar: React.ReactNode;
  roadmapData: CourseRoadmapDataType;
}

export function CourseSidebarWrapper({
  regularSidebar,
  roadmapData,
}: CourseSidebarWrapperProps) {
  const [viewMode, setViewMode] = useState<"lessons" | "roadmap">("lessons");

  return (
    <div className="flex flex-col sticky top-0 h-full max-h-screen overflow-y-aut">
      {/* Toggle buttons */}
      <div className="flex items-center gap-2 p-4 border-b bg-background">
        <Button
          variant={viewMode === "lessons" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("lessons")}
          className="flex-1 gap-2"
        >
          <List className="h-4 w-4" />
          Lessons
        </Button>
        <Button
          variant={viewMode === "roadmap" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("roadmap")}
          className="flex-1 gap-2"
        >
          <Map className="h-4 w-4" />
          Roadmap
        </Button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "lessons" ? (
          regularSidebar
        ) : (
          <CourseRoadmap data={roadmapData} />
        )}
      </div>
    </div>
  );
}
