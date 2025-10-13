"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { ApiResponse } from "@/lib/types";
import {
  AiCourseStructure,
  AiCourseStructureSchema,
} from "@/lib/ai/course-structure";
import { request } from "@arcjet/next";
import { ContentBlockType } from "@/lib/content-blocks";
import { revalidatePath } from "next/cache";
import slugify from "slugify";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

type AiCourseActionResponse = ApiResponse & { courseId?: string };

export async function createCourseFromAi(
  payload: unknown
): Promise<AiCourseActionResponse> {
  const session = await requireAdmin();

  try {
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: session.user.id,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return {
          status: "error",
          message: "You have been rate limited. Try again shortly.",
        };
      }
      return {
        status: "error",
        message: "Request blocked. Contact support if this persists.",
      };
    }

    const parsed: AiCourseStructure = AiCourseStructureSchema.parse(payload);

    const product = await stripe.products.create({
      name: parsed.title,
      description: parsed.smallDescription,
      default_price_data: {
        currency: "usd",
        unit_amount: Math.max(0, Math.round(parsed.price * 100)),
      },
    });

    const course = await prisma.$transaction(async (tx) => {
      const slug = slugify(parsed.title, {
        lower: true,
        strict: true,
      }).slice(0, 60);

      const courseRecord = await tx.course.create({
        data: {
          title: parsed.title,
          description: toRichText(parsed.description),
          smallDescription: parsed.smallDescription,
          level: parsed.level,
          duration: Math.max(1, Math.round(parsed.duration)),
          price: Math.max(0, Math.round(parsed.price)),
          category: parsed.category,
          status: parsed.status ?? "Draft",
          fileKey: parsed.thumbnailKey ?? "",
          slug,
          userId: session.user.id,
          stripePriceId: product.default_price as string,
        },
      });

      for (const [chapterIdx, chapter] of parsed.chapters.entries()) {
        const chapterRecord = await tx.chapter.create({
          data: {
            title: chapter.title,
            courseId: courseRecord.id,
            position: typeof chapter.position === "number" ? chapter.position : chapterIdx + 1,
          },
        });

        for (const [lessonIdx, lesson] of chapter.lessons.entries()) {
          const lessonRecord = await tx.lesson.create({
            data: {
              title: lesson.title,
              description: lesson.description ?? "",
              thumbnailKey: lesson.thumbnailKey,
              videoKey: lesson.videoKey,
              chapterId: chapterRecord.id,
              position:
                typeof lesson.position === "number"
                  ? lesson.position
                  : lessonIdx + 1,
            },
          });

          if (Array.isArray(lesson.contentBlocks)) {
            const blocks = lesson.contentBlocks
              .map((block, blockIdx) => {
                const type = String(block.type || "").toUpperCase();
                if (!Object.values(ContentBlockType).includes(type as ContentBlockType)) {
                  return null;
                }
                return {
                  type: type as ContentBlockType,
                  position:
                    typeof block.position === "number"
                      ? block.position
                      : blockIdx + 1,
                  content: block.content ?? {},
                };
              })
              .filter((block): block is { type: ContentBlockType; position: number; content: any } => Boolean(block));

            if (blocks.length) {
              await tx.contentBlock.createMany({
                data: blocks.map((block) => ({
                  type: block.type,
                  position: block.position,
                  content: block.content,
                  lessonId: lessonRecord.id,
                })),
              });
            }
          }
        }
      }

      return courseRecord;
    });

    revalidatePath("/admin/courses");

    return {
      status: "success",
      message: "Course generated and saved successfully.",
      courseId: course.id,
    };
  } catch (error) {
    console.error("createCourseFromAi failed:", error);
    return {
      status: "error",
      message: "Failed to save AI generated course.",
    };
  }
}

function toRichText(text: string) {
  const safeText = typeof text === "string" && text.trim().length > 0 ? text : "Generated course description";
  return JSON.stringify({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: safeText }],
      },
    ],
  });
}
