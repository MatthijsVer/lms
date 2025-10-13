import { z } from "zod";

export const AiContentBlockSchema = z.object({
  type: z.enum([
    "VIDEO",
    "TEXT",
    "IMAGE",
    "QUIZ",
    "EXERCISE",
    "CODE",
    "CODE_EXERCISE",
    "PDF",
    "AUDIO",
    "DOWNLOAD",
    "FILL_IN_BLANK",
    "FLASHCARD",
    "MATCHING",
    "ORDERING",
    "DRAG_DROP",
    "TIMELINE",
  ]),
  position: z.number(),
  content: z.record(z.any()),
});

export const AiLessonSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  thumbnailKey: z.string().optional(),
  videoKey: z.string().optional(),
  position: z.number(),
  contentBlocks: z.array(AiContentBlockSchema).optional(),
});

export const AiChapterSchema = z.object({
  title: z.string(),
  overview: z.string().optional(),
  position: z.number(),
  lessons: z.array(AiLessonSchema),
});

export const AiCourseStructureSchema = z.object({
  title: z.string(),
  smallDescription: z.string(),
  description: z.string(),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  duration: z.number(),
  price: z.number().min(0),
  category: z.string(),
  status: z.enum(["Draft", "Published", "Archived"]).optional(),
  thumbnailKey: z.string().optional(),
  chapters: z.array(AiChapterSchema),
});

export type AiContentBlock = z.infer<typeof AiContentBlockSchema>;
export type AiLesson = z.infer<typeof AiLessonSchema>;
export type AiChapter = z.infer<typeof AiChapterSchema>;
export type AiCourseStructure = z.infer<typeof AiCourseStructureSchema>;
