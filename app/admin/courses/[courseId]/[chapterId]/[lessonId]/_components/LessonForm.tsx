"use client";

import { AdminLessonType } from "@/app/data/admin/admin-get-lesson";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";
import { ArrowLeft, Play, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Uploader } from "@/components/file-uploader/Uploader";
import { useTransition, useState } from "react";
import { tryCatch } from "@/hooks/try-catch";
import { updateLesson } from "../actions";
import { toast } from "sonner";
import { ContentBlockEditor } from "@/components/content-blocks/ContentBlockEditor";
import {
  ContentBlock,
  ContentBlockType,
  VideoContent,
} from "@/lib/content-blocks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AILessonGeneratorDialog } from "@/components/ai/AiLessonChat";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface iAppProps {
  data: AdminLessonType;
  chapterId: string;
  courseId: string;
}

export function LessonForm({ chapterId, data, courseId }: iAppProps) {
  const [pending, startTransition] = useTransition();
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(() => {
    if (data.contentBlocks && data.contentBlocks.length > 0) {
      return data.contentBlocks.map((block) => ({
        id: block.id,
        type: block.type as ContentBlockType,
        position: block.position,
        content: block.content as unknown as ContentBlock["content"],
      })) as ContentBlock[];
    }

    if (data.videoKey) {
      return [
        {
          type: ContentBlockType.VIDEO,
          position: 0,
          content: { videoKey: data.videoKey, title: "" } as VideoContent,
        },
      ];
    }

    return [];
  });

  const form = useForm<LessonSchemaType>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      name: data.title,
      chapterId: chapterId,
      courseId: courseId,
      description: data.description ?? undefined,
      videoKey: data.videoKey ?? undefined,
      thumbnailKey: data.thumbnailKey ?? undefined,
    },
  });

  // Handle AI-generated content
  const handleAIContentGenerated = (newBlocks: ContentBlock[]) => {
    // Add new blocks to existing ones
    setContentBlocks((prevBlocks) => [...prevBlocks, ...newBlocks]);
    toast.success(`Added ${newBlocks.length} AI-generated content blocks`);
  };

  // 2. Define a submit handler.
  function onSubmit(values: LessonSchemaType) {
    startTransition(async () => {
      // Include content blocks in the submission if in blocks mode
      const submitData = {
        ...values,
        contentBlocks: contentBlocks.length > 0 ? contentBlocks : undefined,
      };

      const { data: result, error } = await tryCatch(
        updateLesson(submitData, data.id)
      );

      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  return (
    <div>
      <Link
        className={buttonVariants({ variant: "outline", className: "mb-6" })}
        href={`/admin/courses/${courseId}/edit`}
      >
        <ArrowLeft className="size-4" />
        <span>Go Back</span>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Lesson Configuration</CardTitle>
          <CardDescription>
            Configure the content for this lesson.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="thumbnailKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail image</FormLabel>
                    <FormControl>
                      <Uploader
                        fileTypeAccepted="image"
                        onChange={field.onChange}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter lesson name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Tabs defaultValue="blocks" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="legacy">Simple Mode</TabsTrigger>
                  <TabsTrigger value="blocks">
                    Content Blocks (Recommended)
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="legacy" className="space-y-6 mt-6">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Simple mode is for basic lessons with text and video only.
                      For interactive content like quizzes, use Content Blocks
                      mode.
                    </AlertDescription>
                  </Alert>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <RichTextEditor field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="videoKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video File</FormLabel>
                        <FormControl>
                          <Uploader
                            onChange={field.onChange}
                            value={field.value}
                            fileTypeAccepted="video"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="blocks" className="mt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          Build with Content Blocks
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Create rich, interactive lessons with various content
                          types.
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* AI Generator Button */}
                        <AILessonGeneratorDialog
                          onContentGenerated={handleAIContentGenerated}
                          existingBlocks={contentBlocks}
                          lessonTitle={form.getValues("name")}
                          trigger={
                            <Button variant="outline" size="sm" type="button">
                              <Sparkles className="h-4 w-4" />
                              Generate with AI
                            </Button>
                          }
                        />
                        <Button size={"sm"}>
                          <Play className="h-4 w-4" />
                          Preview
                        </Button>
                      </div>
                    </div>

                    {contentBlocks.length === 0 && (
                      <Alert className="border-dashed">
                        <Wand2 className="h-4 w-4" />
                        <AlertDescription className="space-y-2">
                          <p>No content blocks yet. Get started by:</p>
                          <ul className="list-disc list-inside text-sm ml-2">
                            <li>
                              Adding blocks manually using the buttons below
                            </li>
                            <li>Or use AI to generate content automatically</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    <ContentBlockEditor
                      blocks={contentBlocks}
                      onChange={setContentBlocks}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex items-center gap-2">
                <Button disabled={pending} type="submit">
                  {pending ? "Saving..." : "Save Lesson"}
                </Button>

                {contentBlocks.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {contentBlocks.length} content block
                    {contentBlocks.length !== 1 ? "s" : ""} configured
                  </span>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
