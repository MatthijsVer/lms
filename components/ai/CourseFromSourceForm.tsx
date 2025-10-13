"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { AiCourseStructure } from "@/lib/ai/course-structure";

interface CourseFromSourceFormProps {
  mode: "video" | "document";
  onCourseGenerated?: (course: AiCourseStructure | null) => void;
}

export function CourseFromSourceForm({
  mode,
  onCourseGenerated,
}: CourseFromSourceFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      toast.error("Please upload a file to analyse.");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("mode", mode);
      formData.append("file", file);
      if (notes.trim().length > 0) {
        formData.append("notes", notes.trim());
      }

      const response = await fetch("/api/ai/course-creator/from-file", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to generate course");
      }

      const data = await response.json();
      if (data.courseJson) {
        onCourseGenerated?.(data.courseJson);
        toast.success("Course generated from source material!");
      } else {
        toast.error(
          "AI response did not include course JSON. Try providing more detailed source text."
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          {mode === "video"
            ? "Generate from video transcript"
            : "Generate from document text"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor={`${mode}-file`}>
              {mode === "video"
                ? "Upload video or audio file (mp4, mp3, wav)"
                : "Upload document (pdf, docx, txt)"}
            </Label>
            <Input
              id={`${mode}-file`}
              type="file"
              accept={
                mode === "video"
                  ? "video/mp4,video/mpeg,video/quicktime,audio/mpeg,audio/mp4,audio/x-m4a,audio/wav"
                  : ".pdf,.docx,.txt"
              }
              onChange={(event) => {
                const nextFile = event.target.files?.[0];
                setFile(nextFile ?? null);
              }}
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                Selected: {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${mode}-source`}>
              {mode === "video"
                ? "Optional notes for the transcript (context, target audience, etc.)"
                : "Optional notes about the document"}
            </Label>
            <Textarea
              id={`${mode}-source`}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add any extra context the AI should consider"
              className="min-h-[140px]"
            />
          </div>
          <Button type="submit" disabled={isLoading || !file}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analysing source…
              </>
            ) : (
              "Generate course"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
