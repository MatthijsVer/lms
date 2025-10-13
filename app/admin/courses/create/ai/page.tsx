"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, File, MessageCircle, Video } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiCourseChat } from "@/components/ai/AiCourseChat";
import { CourseFromSourceForm } from "@/components/ai/CourseFromSourceForm";
import { CoursePreview } from "@/components/ai/CoursePreview";
import { useState, useTransition } from "react";
import { AiCourseStructure } from "@/lib/ai/course-structure";
import { createCourseFromAi } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AICourseCreationPage() {
  const [generatedCourse, setGeneratedCourse] =
    useState<AiCourseStructure | null>(null);
  const [isSaving, startTransition] = useTransition();
  const router = useRouter();

  const handleSaveCourse = (course: AiCourseStructure) => {
    startTransition(async () => {
      const result = await createCourseFromAi(course);
      if (result.status === "success" && result.courseId) {
        toast.success(result.message);
        router.push(`/admin/courses/${result.courseId}/edit`);
      } else {
        toast.error(result.message ?? "Failed to save course");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4">
        <Link
          href="/admin/courses"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">AI course builder</h1>
          <p className="text-sm text-muted-foreground">
            Generate full courses via conversation, transcripts, or documents.
            Review the preview and copy the JSON to integrate into your
            curriculum.
          </p>
        </div>
      </div>

      <Tabs defaultValue="chat" className="space-y-6">
        <TabsList className="gap-x-4">
          <TabsTrigger value="chat">
            <MessageCircle />
            Chat assistant
          </TabsTrigger>
          <TabsTrigger value="video">
            <Video />
            From video
          </TabsTrigger>
          <TabsTrigger value="document">
            <File />
            From document
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <AiCourseChat onCourseGenerated={setGeneratedCourse} />
            <CoursePreview
              course={generatedCourse}
              onSaveCourse={handleSaveCourse}
              isSaving={isSaving}
            />
          </div>
        </TabsContent>

        <TabsContent value="video">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <CourseFromSourceForm
              mode="video"
              onCourseGenerated={setGeneratedCourse}
            />
            <CoursePreview
              course={generatedCourse}
              onSaveCourse={handleSaveCourse}
              isSaving={isSaving}
            />
          </div>
        </TabsContent>

        <TabsContent value="document">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <CourseFromSourceForm
              mode="document"
              onCourseGenerated={setGeneratedCourse}
            />
            <CoursePreview
              course={generatedCourse}
              onSaveCourse={handleSaveCourse}
              isSaving={isSaving}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
