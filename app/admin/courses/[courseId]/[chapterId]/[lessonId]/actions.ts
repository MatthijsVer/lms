"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";
import { ContentBlockType } from "@/lib/content-blocks";

export async function updateLesson(
  values: LessonSchemaType,
  lessonId: string
): Promise<ApiResponse> {
  await requireAdmin();

  try {
    const result = lessonSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    // Update lesson basic info
    await prisma.lesson.update({
      where: {
        id: lessonId,
      },
      data: {
        title: result.data.name,
        description: result.data.description,
        thumbnailKey: result.data.thumbnailKey,
        videoKey: result.data.videoKey,
      },
    });

    // Handle content blocks if provided
    if (result.data.contentBlocks && result.data.contentBlocks.length > 0) {
      // Delete existing content blocks
      await prisma.contentBlock.deleteMany({
        where: { lessonId },
      });

      // Create new content blocks
      await prisma.contentBlock.createMany({
        data: result.data.contentBlocks.map((block) => ({
          lessonId,
          type: block.type as ContentBlockType,
          position: block.position,
          content: block.content,
        })),
      });
    }

    return {
      status: "success",
      message: "Course updated successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to update course",
    };
  }
}
